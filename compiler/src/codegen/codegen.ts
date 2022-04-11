import {
  ArrayDatatype,
  Ast,
  DataType,
  Expression,
  LiteralDataType,
  MinusBinaryExp,
  MinusUninaryExp,
  PlusUninaryExp,
} from "../parser/ast";
import llvm, {
  AddrSpaceCastInst,
  ArrayType,
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
  PointerType,
  UndefValue,
  Value,
} from "llvm-bindings";
import { Token } from "../lexer/tokens";
import { TLLVMFunction } from "./function";
import { type } from "os";

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

  currentFn: TLLVMFunction;

  globalVarDatabases: { [varName: string]: LLVMFunction | undefined };

  constructor(typeCheckedAst: Ast[], moduleName: string) {
    this.asts = typeCheckedAst;
    this.curPos = 0;

    this.moduleName = moduleName;

    this.llvmContext = new LLVMContext();
    this.llvmModule = new Module(moduleName, this.llvmContext);
    this.llvmIrBuilder = new IRBuilder(this.llvmContext);

    this.globalVarDatabases = {};

    const voidType = this.llvmIrBuilder.getVoidTy();
    const mainFnType = FunctionType.get(voidType, [], false);
    const mainFn = LLVMFunction.Create(
      mainFnType,
      LLVMFunction.LinkageTypes.ExternalLinkage,
      "main",
      this.llvmModule
    );
    const TMainFn = new TLLVMFunction(mainFn, this.globalVarDatabases);
    this.currentFn = TMainFn;
    const entryBasicBlock = BasicBlock.Create(
      this.llvmContext,
      "entry",
      mainFn
    );
    this.llvmIrBuilder.SetInsertPoint(entryBasicBlock);
  }

  consume() {
    while (this.getCurAst() !== null) {
      this.consumeAst(this.getCurAst());
      this.next();
    }

    this.llvmIrBuilder.CreateRet(null as unknown as Value);
  }

  consumeAst(curAst: Ast | null) {
    if (curAst === null) throw Error("Does not expect curAst to be null");

    if (curAst.type === "constVariableDeclaration") {
      this.consumeVariableDeclaration(curAst);
    } else if (curAst.type === "letVariableDeclaration") {
      this.consumeVariableDeclaration(curAst);
    } else if (curAst.type === "FunctionDeclaration") {
      this.consumeFunctionDeclaration(curAst);
    } else if (curAst.type === "ReturnExpression") {
      this.consumeReturnExp(curAst);
    } else if (curAst.type === "ReAssignment") {
      this.consumeReassignment(curAst);
    } else {
      throw Error(`It is still not supported for compiling ast ${curAst.type}`);
    }
  }

  /**
   * Expects the curAst to be of Reassignment
   *
   */

  consumeReassignment(curAst: Ast | null) {
    if (curAst === null || curAst.type !== "ReAssignment")
      throw Error(
        `Expected curAst to be of type ConsumeReaassignment but instead got ${curAst?.type}`
      );

    const leftPath = curAst.path;

    if (leftPath.type !== "IdentifierPath")
      throw Error(
        "Its not yet supported for reassignment path to be anything other than IdentifierPath"
      );

    const varInfo = this.currentFn.getVarInfo(leftPath.name);

    if (varInfo === null)
      throw Error(`There is no variable with name ${leftPath.name}`);

    const expValue = this.getExpValue(curAst.exp);

    if (curAst.assignmentOperator === Token.Assign) {
      this.llvmIrBuilder.CreateStore(expValue, varInfo);
    } else if (curAst.assignmentOperator === Token.PlusAssign) {
      const loadVar = this.llvmIrBuilder.CreateLoad(
        this.llvmIrBuilder.getDoubleTy(),
        varInfo
      );
      const addValue = this.llvmIrBuilder.CreateFAdd(loadVar, expValue);
      this.llvmIrBuilder.CreateStore(addValue, varInfo);
    } else if (curAst.assignmentOperator === Token.MinusAssign) {
      const loadVar = this.llvmIrBuilder.CreateLoad(
        this.llvmIrBuilder.getDoubleTy(),
        varInfo
      );
      const minusValue = this.llvmIrBuilder.CreateFSub(loadVar, expValue);
      this.llvmIrBuilder.CreateStore(minusValue, varInfo);
    } else if (curAst.assignmentOperator === Token.StarAssign) {
      const loadVar = this.llvmIrBuilder.CreateLoad(
        this.llvmIrBuilder.getDoubleTy(),
        varInfo
      );
      const starValue = this.llvmIrBuilder.CreateFMul(loadVar, expValue);
      this.llvmIrBuilder.CreateStore(starValue, varInfo);
    } else if (curAst.assignmentOperator == Token.SlashAssign) {
      const loadVar = this.llvmIrBuilder.CreateLoad(
        this.llvmIrBuilder.getDoubleTy(),
        varInfo
      );
      const slashValue = this.llvmIrBuilder.CreateFDiv(loadVar, expValue);
      this.llvmIrBuilder.CreateStore(slashValue, varInfo);
    }
  }

  /**
   * Expects the curAst to be constVariableDeclaration
   */

  consumeVariableDeclaration(curAst: Ast | null) {
    if (
      curAst === null ||
      (curAst.type !== "constVariableDeclaration" &&
        curAst.type !== "letVariableDeclaration")
    )
      throw Error(`Unreachable`);

    const varType = this.getLLVMType(curAst.datatype);

    const allocatedVar = this.llvmIrBuilder.CreateAlloca(
      varType,
      null,
      curAst.identifierName
    );

    const value = this.getExpValue(curAst.exp);

    this.llvmIrBuilder.CreateStore(value, allocatedVar);

    this.currentFn.insertVarName(curAst.identifierName, allocatedVar);
  }

  /**
   * Expects the curAst to be functionDeclaration
   */

  consumeFunctionDeclaration(curAst: Ast | null) {
    if (curAst === null || curAst.type !== "FunctionDeclaration")
      throw Error(`Expected curAst to be of type functionDeclaration`);

    const returnLLVMType = this.getLLVMType(curAst.returnType);
    const fnArguments = curAst.arguments.map(([argName, argType]) => {
      return this.getLLVMType(argType);
    });

    const fnType = FunctionType.get(returnLLVMType, fnArguments, false);
    const fnValue = LLVMFunction.Create(
      fnType,
      LLVMFunction.LinkageTypes.ExternalLinkage,
      curAst.name,
      this.llvmModule
    );

    this.addGlobalVar(curAst.name, fnValue);

    const TFnValue = new TLLVMFunction(fnValue, this.globalVarDatabases);
    const previousTFnValue = this.currentFn;
    this.currentFn = TFnValue;

    const entryBB = BasicBlock.Create(this.llvmContext, "entry", fnValue);
    const previousInsertBlock = this.llvmIrBuilder.GetInsertBlock();

    if (previousInsertBlock === null)
      throw Error("Did not expect previousInsetBlock to be null");

    this.llvmIrBuilder.SetInsertPoint(entryBB);

    curAst.arguments.forEach(([argName], i) => {
      const arg = fnValue.getArg(i);
      const argType = arg.getType();

      const allocaArg = this.llvmIrBuilder.CreateAlloca(argType, null, argName);
      this.llvmIrBuilder.CreateStore(arg, allocaArg);

      TFnValue.insertVarName(argName, allocaArg);
    });

    curAst.blocks.forEach((ast) => {
      this.consumeAst(ast);
    });

    this.currentFn = previousTFnValue;
    this.llvmIrBuilder.SetInsertPoint(previousInsertBlock);
  }
  /**
   * Expects the curAst to be of ReturnExpression
   */
  consumeReturnExp(curAst: Ast | null) {
    if (curAst === null || curAst.type !== "ReturnExpression")
      throw new Error("Expected curAst to be of type ReturnExpression");

    const returnExp = curAst.exp;

    if (returnExp === null) {
      this.llvmIrBuilder.CreateRetVoid();
    } else {
      this.llvmIrBuilder.CreateRet(this.getExpValue(returnExp));
    }
  }

  getExpValue(exp: Expression): Value {
    if (exp.type === "number") {
      return ConstantFP.get(this.llvmIrBuilder.getDoubleTy(), exp.value);
    } else if (exp.type === "boolean") {
      return this.llvmIrBuilder.getInt1(exp.value);
    } else if (exp.type === "identifier") {
      const allocatedVarName = this.currentFn.getVarInfo(exp.name);

      if (allocatedVarName === null) {
        const value = this.getGlobalVar(exp.name);

        if (value === null)
          throw new Error(`There is no variable with name ${exp.name}`);

        return value;
      }

      const llvmType = this.getLLVMType(exp.datatype);

      return this.llvmIrBuilder.CreateLoad(llvmType, allocatedVarName);
    } else if (exp.type === "FunctionCall") {
      const leftValue = this.getExpValue(exp.left);

      const fnArgs = exp.arguments.map((exp) => {
        return this.getExpValue(exp);
      });
      return this.llvmIrBuilder.CreateCall(leftValue as LLVMFunction, fnArgs);
    } else if (exp.type === "array") {
      const arrayDatatype = exp.datatype;

      if (!isArrayDatatype(arrayDatatype))
        throw Error(
          "Expected typechecker to make sure that only ArrayDatatype is allowed in array"
        );

      const noOfElements = arrayDatatype.numberOfElements;

      if (noOfElements === undefined) {
        throw Error(
          "Expected typechecker to make sure that numberOfElements is number"
        );
      }

      const baseType = this.getLLVMType(arrayDatatype.baseType);
      const arrayType = ArrayType.get(baseType, noOfElements);
      const allocatedValue = this.llvmIrBuilder.CreateAlloca(arrayType);

      exp.exps.forEach((exp, i) => {
        const insideElementPointer = this.llvmIrBuilder.CreateGEP(
          arrayType,
          allocatedValue,
          [this.llvmIrBuilder.getInt64(0), this.llvmIrBuilder.getInt32(i)]
        );

        this.llvmIrBuilder.CreateStore(
          this.getExpValue(exp),
          insideElementPointer
        );
      });

      return allocatedValue;
    } else if (exp.type === Token.Bang) {
      const argValue = this.getExpValue(exp.argument);
      return this.llvmIrBuilder.CreateXor(
        argValue,
        this.llvmIrBuilder.getInt1(true)
      );
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
    } else if (exp.type === Token.Star) {
      const leftValue = this.getExpValue(exp.left);
      const rightValue = this.getExpValue(exp.right);

      return this.llvmIrBuilder.CreateFMul(leftValue, rightValue);
    } else if (exp.type === Token.Slash) {
      const leftValue = this.getExpValue(exp.left);
      const rightValue = this.getExpValue(exp.right);

      return this.llvmIrBuilder.CreateFDiv(leftValue, rightValue);
    } else if (exp.type === Token.StrictEquality) {
      const leftValue = this.getExpValue(exp.left);
      const rightValue = this.getExpValue(exp.right);

      const comparingDatatype = exp.datatype;

      if (comparingDatatype === undefined) {
        throw Error(
          "Expected typeCheckAst to make sure Datatype not be undefined"
        );
      }

      if (comparingDatatype === LiteralDataType.Number) {
        return this.llvmIrBuilder.CreateFCmpOEQ(leftValue, rightValue);
      } else if (comparingDatatype === LiteralDataType.Boolean) {
        return this.llvmIrBuilder.CreateICmpEQ(leftValue, rightValue);
      }
    } else if (exp.type === Token.StrictNotEqual) {
      const leftValue = this.getExpValue(exp.left);
      const rightValue = this.getExpValue(exp.right);

      const comparingDatatype = exp.datatype;

      if (comparingDatatype === undefined) {
        throw Error(
          "Expected typecheckAst to make sure Datatype not be undefined"
        );
      }

      if (comparingDatatype === LiteralDataType.Number) {
        return this.llvmIrBuilder.CreateFCmpONE(leftValue, rightValue);
      } else if (comparingDatatype === LiteralDataType.Boolean) {
        return this.llvmIrBuilder.CreateICmpNE(leftValue, rightValue);
      }
    } else if (exp.type === Token.GreaterThan) {
      const leftValue = this.getExpValue(exp.left);
      const rightValue = this.getExpValue(exp.right);

      return this.llvmIrBuilder.CreateFCmpOGT(leftValue, rightValue);
    } else if (exp.type === Token.GreaterThanOrEqual) {
      const leftValue = this.getExpValue(exp.left);
      const rightValue = this.getExpValue(exp.right);

      return this.llvmIrBuilder.CreateFCmpOGE(leftValue, rightValue);
    } else if (exp.type === Token.LessThan) {
      const leftValue = this.getExpValue(exp.left);
      const rightValue = this.getExpValue(exp.right);

      return this.llvmIrBuilder.CreateFCmpOLT(leftValue, rightValue);
    } else if (exp.type === Token.LessThanOrEqual) {
      const leftValue = this.getExpValue(exp.left);
      const rightValue = this.getExpValue(exp.right);

      return this.llvmIrBuilder.CreateFCmpOLE(leftValue, rightValue);
    } else if (exp.type === "BoxMemberAccess") {
      const leftValue = this.getExpValue(exp.left);
      const rightValue = this.getExpValue(exp.right);

      const convertedToIntValue = this.llvmIrBuilder.CreateFPToSI(
        rightValue,
        this.llvmIrBuilder.getInt32Ty()
      );

      const pointerToElement = this.llvmIrBuilder.CreateGEP(
        leftValue.getType().getPointerElementType(),
        leftValue,
        [this.llvmIrBuilder.getInt64(0), convertedToIntValue]
      );

      return this.llvmIrBuilder.CreateLoad(
        pointerToElement.getType().getPointerElementType(),
        pointerToElement
      );
    }

    throw Error(
      `It is not yet supported to generate code for expression.type === ${exp.type}`
    );
  }

  getLLVMType(dataType: DataType): llvm.Type {
    if (dataType === LiteralDataType.Number) {
      return this.llvmIrBuilder.getDoubleTy();
    } else if (dataType === LiteralDataType.Boolean) {
      return this.llvmIrBuilder.getInt1Ty();
    } else if (typeof dataType === "object") {
      if (dataType.type === "FunctionDataType") {
        const returnType = this.getLLVMType(dataType.returnType);
        const args = Object.values(dataType.arguments).map((dataType) => {
          if (dataType === undefined) throw Error("Unreachable");

          return this.getLLVMType(dataType);
        });

        if (args.length === 0) {
          return PointerType.get(FunctionType.get(returnType, false), 0);
        } else {
          return PointerType.get(FunctionType.get(returnType, args, false), 0);
        }
      } else if (dataType.type === "ArrayDataType") {
        const baseElement = this.getLLVMType(dataType.baseType);
        const numberOfElements = dataType.numberOfElements;

        if (numberOfElements === undefined)
          throw Error(
            "Expected typecheck to make sure that numberOfElements can never be undefined"
          );

        return PointerType.get(ArrayType.get(baseElement, numberOfElements), 0);
      }
    }

    throw Error("something");
  }

  addGlobalVar(varName: string, value: LLVMFunction) {
    const globalValue = this.globalVarDatabases[varName];

    if (globalValue === undefined) {
      this.globalVarDatabases[varName] = value;
    } else {
      throw new Error(
        `There is already a variable defined with var name ${varName}`
      );
    }
  }

  getGlobalVar(varName: string): LLVMFunction | null {
    const globalValue = this.globalVarDatabases[varName];

    if (globalValue === undefined) {
      return null;
    } else {
      return globalValue;
    }
  }

  dumpModule() {
    llvm.verifyFunction(this.currentFn.getLLVMFunction());
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

const isArrayDatatype = (datatype: DataType): datatype is ArrayDatatype => {
  return typeof datatype === "object" && datatype.type === "ArrayDataType";
};
