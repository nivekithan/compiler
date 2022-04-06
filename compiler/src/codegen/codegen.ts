import {
  Ast,
  DataType,
  Expression,
  LiteralDataType,
  MinusBinaryExp,
  MinusUninaryExp,
  PlusUninaryExp,
} from "../parser/ast";
import llvm, {
  APFloat,
  APInt,
  BasicBlock,
  Constant,
  ConstantFP,
  ConstantInt,
  ConstantPointerNull,
  Function as LLVMFunction,
  FunctionType,
  IRBuilder,
  LLVMContext,
  Module,
  ReturnInst,
  Type,
  UndefValue,
  Value,
} from "llvm-bindings";
import { Token } from "../lexer/tokens";

export const convertToLLVMModule = (asts: Ast[]): string => {
  const ModuleCodeGen = new CodeGen(asts, "main");
  ModuleCodeGen.consume();
  return ModuleCodeGen.dumpModule();
};

export class CodeGen {
  asts: Ast[];
  curPos: number | null;

  moduleName: string;

  llvmContext: LLVMContext;
  llvmModule: Module;
  llvmIrBuilder: IRBuilder;

  llvmMainFn: LLVMFunction;

  constructor(typeCheckedAst: Ast[], moduleName: string) {
    this.asts = typeCheckedAst;
    this.curPos = 0;

    this.moduleName = moduleName;

    this.llvmContext = new LLVMContext();
    this.llvmModule = new Module(moduleName, this.llvmContext);
    this.llvmIrBuilder = new IRBuilder(this.llvmContext);

    const voidType = this.llvmIrBuilder.getVoidTy();
    const mainFnType = FunctionType.get(voidType, [], false);
    const mainFn = LLVMFunction.Create(
      mainFnType,
      LLVMFunction.LinkageTypes.ExternalLinkage,
      "main",
      this.llvmModule
    );
    this.llvmMainFn = mainFn;
    const entryBasicBlock = BasicBlock.Create(
      this.llvmContext,
      "entry",
      mainFn
    );
    this.llvmIrBuilder.SetInsertPoint(entryBasicBlock);
  }

  consume() {
    while (this.getCurAst() !== null) {
      const curAst = this.getCurAst();

      if (curAst === null) throw Error(`Unreachable`);

      if (curAst.type === "constVariableDeclaration") {
        const varType = this.getLLVMType(curAst.datatype);

        const allocatedVar = this.llvmIrBuilder.CreateAlloca(
          varType,
          null,
          curAst.identifierName
        );

        const value = this.getExpValue(curAst.exp);

        this.llvmIrBuilder.CreateStore(value, allocatedVar);
      }

      this.next();
    }

    this.llvmIrBuilder.CreateRet(null as unknown as Value);
  }

  getExpValue(exp: Expression): Value {
    if (exp.type === "number") {
      return ConstantFP.get(this.llvmIrBuilder.getDoubleTy(), exp.value);
    } else if (exp.type === "boolean") {
      return this.llvmIrBuilder.getInt1(exp.value);
    } else if (exp.type === Token.Plus) {
      if (isPlusUninaryExp(exp)) {
        return this.getExpValue(exp.argument);
      } else {
        const leftValue = this.getExpValue(exp.left);
        const rightValue = this.getExpValue(exp.right);

        return this.llvmIrBuilder.CreateFAdd(leftValue, rightValue);
      }
    } else if (exp.type === Token.Minus) {
      if (isMinusUninaryExp(exp)) {
        const argValue = this.getExpValue(exp.argument);
        return this.llvmIrBuilder.CreateFNeg(argValue);
      } else {
        const leftvalue = this.getExpValue(exp.left);
        const rightValue = this.getExpValue(exp.right);

        return this.llvmIrBuilder.CreateFSub(leftvalue, rightValue);
      }
    }

    throw Error("Something");
  }

  getLLVMType(type: DataType) {
    if (type === LiteralDataType.Number) {
      return this.llvmIrBuilder.getDoubleTy();
    } else if (type === LiteralDataType.Boolean) {
      return this.llvmIrBuilder.getInt1Ty();
    }

    throw Error("something");
  }

  dumpModule() {
    llvm.verifyFunction(this.llvmMainFn);
    llvm.verifyModule(this.llvmModule);
    return this.llvmModule.print();
  }

  next() {
    if (this.curPos === null || this.curPos >= this.asts.length - 1) {
      this.curPos = null;
    } else {
      this.curPos++;
    }
  }

  getCurAst(): Ast | null {
    if (this.curPos === null) {
      return null;
    } else {
      const ast = this.asts[this.curPos];

      if (ast === undefined) {
        throw Error("Expected this.curPos to be always in bound of this.asts");
      }

      return ast;
    }
  }
}

const isPlusUninaryExp = (exp: Expression): exp is PlusUninaryExp => {
  if (
    exp.type === Token.Plus &&
    (exp as PlusUninaryExp).argument !== undefined
  ) {
    return true;
  }

  return false;
};

const isMinusUninaryExp = (exp: Expression): exp is MinusUninaryExp => {
  if (
    exp.type === Token.Minus &&
    (exp as MinusUninaryExp).argument !== undefined
  ) {
    return true;
  }

  return false;
};
