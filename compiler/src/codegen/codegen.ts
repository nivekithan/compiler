import llvm, {
  ArrayType,
  BasicBlock,
  ConstantFP,
  Function as LLVMFunction,
  FunctionType,
  IRBuilder,
  LLVMContext,
  Module,
  PointerType,
  StructType,
  Value,
} from "llvm-bindings";
import { KeywordTokens, Token } from "../lexer/tokens";
import { TLLVMFunction } from "./function";
import { ReAssignmentPath } from "../tsTypes/base";
import { getDatatypeOfTypeCheckedExp } from "../utils/utils";
import {
  isArrayDatatype,
  isBooleanDatatype,
  isMinusUninaryExp,
  isNumberDatatype,
  isObjectDatatype,
  isPlusUninaryExp,
} from "../tsTypes/all";
import {
  TypeCheckedAst,
  TypeCheckedDatatype,
  TypeCheckedExpression,
} from "../tsTypes/typechecked";

export const convertToLLVMModule = (asts: TypeCheckedAst[]): string => {
  const ModuleCodeGen = new CodeGen(asts, "main");
  ModuleCodeGen.consume();
  return ModuleCodeGen.dumpModule();
};

export class CodeGen {
  asts: TypeCheckedAst[];
  curPos: number | null;

  moduleName: string;

  llvmContext: LLVMContext;
  llvmModule: Module;
  llvmIrBuilder: IRBuilder;

  currentFn: TLLVMFunction;

  breakBB: BasicBlock | null; // On loop what block to go on break statement
  continueBB: BasicBlock | null; // on loop what block to go on continue statement

  globalVarDatabases: { [varName: string]: LLVMFunction | undefined };

  constructor(typeCheckedAst: TypeCheckedAst[], moduleName: string) {
    this.asts = typeCheckedAst;
    this.curPos = 0;

    this.moduleName = moduleName;

    this.llvmContext = new LLVMContext();
    this.llvmModule = new Module(moduleName, this.llvmContext);
    this.llvmIrBuilder = new IRBuilder(this.llvmContext);

    this.breakBB = null;
    this.continueBB = null;

    this.globalVarDatabases = {};

    const voidType = this.llvmIrBuilder.getVoidTy();
    const mainFnType = FunctionType.get(voidType, [], false);
    const mainFn = LLVMFunction.Create(
      mainFnType,
      LLVMFunction.LinkageTypes.ExternalLinkage,
      "main",
      this.llvmModule
    );
    const TMainFn = new TLLVMFunction(mainFn);
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

  consumeAst(curAst: TypeCheckedAst | null) {
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
    } else if (curAst.type === "typeCheckedIfBlockDeclaration") {
      this.consumeTypeCheckedIfBlockDeclaration(curAst);
    } else if (curAst.type === "WhileLoopDeclaration") {
      this.consumeWhileLoopDeclaration(curAst);
    } else if (curAst.type === "DoWhileLoopDeclaration") {
      this.consumeDoWhileLoopDeclaration(curAst);
    } else if (curAst.type === KeywordTokens.Continue) {
      this.consumeContinueStatement(curAst);
    } else if (curAst.type === KeywordTokens.Break) {
      this.consumeBreakStatement(curAst);
    } else {
      throw Error(`It is still not supported for compiling ast ${curAst.type}`);
    }
  }

  /**
   * Expects the curAst to be of type DoWhileLoopDeclaration
   */

  consumeDoWhileLoopDeclaration(curAst: TypeCheckedAst | null) {
    if (curAst === null || curAst.type !== "DoWhileLoopDeclaration") {
      throw new Error(
        `Expected curAst to be of type DoWhileLoopDeclaration but instead got ${curAst?.type}`
      );
    }

    const doWhileDecBB = BasicBlock.Create(
      this.llvmContext,
      this.currentFn.getBasicBlockTempName(),
      this.currentFn.getLLVMFunction()
    );

    const doWhileCondCheckerBB = BasicBlock.Create(
      this.llvmContext,
      this.currentFn.getBasicBlockTempName(),
      this.currentFn.getLLVMFunction()
    );

    const outsideBlock = BasicBlock.Create(
      this.llvmContext,
      this.currentFn.getBasicBlockTempName(),
      this.currentFn.getLLVMFunction()
    );

    this.llvmIrBuilder.CreateBr(doWhileDecBB);

    this.llvmIrBuilder.SetInsertPoint(doWhileDecBB);
    this.breakBB = outsideBlock;
    this.continueBB = doWhileCondCheckerBB;

    this.currentFn.parsingChildContext();
    for (const insideDoWhileBlockAst of curAst.blocks) {
      this.consumeAst(insideDoWhileBlockAst);
    }

    this.llvmIrBuilder.CreateBr(doWhileCondCheckerBB);
    this.currentFn.finishedParsingChildContext();

    this.llvmIrBuilder.SetInsertPoint(doWhileCondCheckerBB);

    const conditionExp = this.getExpValue(curAst.condition);

    this.llvmIrBuilder.CreateCondBr(conditionExp, doWhileDecBB, outsideBlock);

    this.llvmIrBuilder.SetInsertPoint(outsideBlock);
  }

  /**
   * Expected curAst to be of type KeywordTokens.Continue
   */
  consumeContinueStatement(curAst: TypeCheckedAst | null) {
    if (curAst === null || curAst.type !== KeywordTokens.Continue) {
      throw new Error(
        `Expected curAst to be of type KeywordTokens.Continue but instead got ${curAst?.type}`
      );
    }

    if (this.continueBB === null) {
      throw Error(`Expected this.continueBB to be not null`);
    }

    this.llvmIrBuilder.CreateBr(this.continueBB);
  }
  /**
   * Expected curAst to be of type KeywordTokens.Break
   */
  consumeBreakStatement(curAst: TypeCheckedAst | null) {
    if (curAst === null || curAst.type !== KeywordTokens.Break) {
      throw new Error(
        `Expected curAst to be of type KeywordTokens.Break but instead got ${curAst?.type}`
      );
    }

    if (this.breakBB === null) {
      throw Error(`Expected this.breakBB to be not null`);
    }

    this.llvmIrBuilder.CreateBr(this.breakBB);
  }

  /**
   * Expects the curAst to be of WhileLoopDeclaration
   */

  consumeWhileLoopDeclaration(curAst: TypeCheckedAst | null) {
    if (curAst === null || curAst.type !== "WhileLoopDeclaration") {
      throw new Error(
        `Expected curAst to of type WhileLoopDeclaration but instead got ${curAst?.type}`
      );
    }

    const whileLoopCondCheckerBB = BasicBlock.Create(
      this.llvmContext,
      this.currentFn.getBasicBlockTempName(),
      this.currentFn.getLLVMFunction()
    );

    const whileLoopDecBB = BasicBlock.Create(
      this.llvmContext,
      this.currentFn.getBasicBlockTempName(),
      this.currentFn.getLLVMFunction()
    );

    const outsideBlockBB = BasicBlock.Create(
      this.llvmContext,
      this.currentFn.getBasicBlockTempName(),
      this.currentFn.getLLVMFunction()
    );

    this.llvmIrBuilder.CreateBr(whileLoopCondCheckerBB);

    this.llvmIrBuilder.SetInsertPoint(whileLoopCondCheckerBB);

    const whileLoopCondExp = this.getExpValue(curAst.condition);

    this.llvmIrBuilder.CreateCondBr(
      whileLoopCondExp,
      whileLoopDecBB,
      outsideBlockBB
    );

    this.llvmIrBuilder.SetInsertPoint(whileLoopDecBB);

    this.currentFn.parsingChildContext();

    this.continueBB = whileLoopCondCheckerBB;
    this.breakBB = outsideBlockBB;

    for (const insideWhileLoopAst of curAst.blocks) {
      this.consumeAst(insideWhileLoopAst);
    }

    this.llvmIrBuilder.CreateBr(whileLoopCondCheckerBB);

    this.continueBB = null;
    this.breakBB = null;

    this.currentFn.finishedParsingChildContext();

    this.llvmIrBuilder.SetInsertPoint(outsideBlockBB);
  }

  /**
   * Expects the curAst to be of TypeCheckedIfBlockDeclaration
   */

  consumeTypeCheckedIfBlockDeclaration(curAst: TypeCheckedAst | null) {
    if (curAst === null || curAst.type !== "typeCheckedIfBlockDeclaration") {
      throw Error(
        `Expected curAst to be of type typeCheckedIfBlockDeclaration but instead got ${curAst?.type}`
      );
    }

    const ifBlockCondExp = this.getExpValue(curAst.ifBlock.condition);

    const ifBlockBB = BasicBlock.Create(
      this.llvmContext,
      this.currentFn.getBasicBlockTempName(),
      this.currentFn.getLLVMFunction()
    );

    const elseIfBlocksBBs = curAst.elseIfBlocks.map((value) => {
      const elseIfBlockCondChecker = BasicBlock.Create(
        this.llvmContext,
        this.currentFn.getBasicBlockTempName(),
        this.currentFn.getLLVMFunction()
      );

      const elseIfBlockDeclaration = BasicBlock.Create(
        this.llvmContext,
        this.currentFn.getBasicBlockTempName(),
        this.currentFn.getLLVMFunction()
      );

      return {
        condCheckerBB: elseIfBlockCondChecker,
        decBB: elseIfBlockDeclaration,
      };
    });

    const elseBlockBB = curAst.elseBlock
      ? BasicBlock.Create(
          this.llvmContext,
          this.currentFn.getBasicBlockTempName(),
          this.currentFn.getLLVMFunction()
        )
      : undefined;

    const outsideBlock = BasicBlock.Create(
      this.llvmContext,
      this.currentFn.getBasicBlockTempName(),
      this.currentFn.getLLVMFunction()
    );

    const BBToGoAferIfBlockFailed = () => {
      const isElseIfBlockPresent = elseIfBlocksBBs.length !== 0;
      const isElseBlockPresent = elseBlockBB !== undefined;

      if (isElseIfBlockPresent) {
        return elseIfBlocksBBs[0].condCheckerBB;
      }

      if (isElseBlockPresent) {
        return elseBlockBB;
      }

      return outsideBlock;
    };

    this.llvmIrBuilder.CreateCondBr(
      ifBlockCondExp,
      ifBlockBB,
      BBToGoAferIfBlockFailed()
    );

    this.llvmIrBuilder.SetInsertPoint(ifBlockBB);

    this.currentFn.parsingChildContext();
    for (const ifBlockAst of curAst.ifBlock.blocks) {
      this.consumeAst(ifBlockAst);
    }
    this.llvmIrBuilder.CreateBr(outsideBlock);
    this.currentFn.finishedParsingChildContext();

    elseIfBlocksBBs.forEach(({ condCheckerBB, decBB }, i) => {
      const elseIfBlockAst = curAst.elseIfBlocks[i];

      this.llvmIrBuilder.SetInsertPoint(condCheckerBB);

      const elseIfBlockCondition = this.getExpValue(elseIfBlockAst.condition);

      const nextBBToGoIfCondFailed = () => {
        const isThereAnotherElseIfBlock = elseIfBlocksBBs[i + 1] !== undefined;
        const isThereElseBlock = elseBlockBB !== undefined;

        if (isThereAnotherElseIfBlock) {
          return elseIfBlocksBBs[i + 1].condCheckerBB;
        }

        if (isThereElseBlock) {
          return elseBlockBB;
        }

        return outsideBlock;
      };

      this.llvmIrBuilder.CreateCondBr(
        elseIfBlockCondition,
        decBB,
        nextBBToGoIfCondFailed()
      );

      this.llvmIrBuilder.SetInsertPoint(decBB);

      this.currentFn.parsingChildContext();

      for (const astInsideElseIfBlock of elseIfBlockAst.blocks) {
        this.consumeAst(astInsideElseIfBlock);
      }

      this.llvmIrBuilder.CreateBr(outsideBlock);

      this.currentFn.finishedParsingChildContext();
    });

    if (elseBlockBB) {
      this.llvmIrBuilder.SetInsertPoint(elseBlockBB);

      this.currentFn.parsingChildContext();

      for (const elseBlockAst of curAst.elseBlock!.blocks) {
        this.consumeAst(elseBlockAst);
      }

      this.llvmIrBuilder.CreateBr(outsideBlock);
      this.currentFn.finishedParsingChildContext();
    }

    this.llvmIrBuilder.SetInsertPoint(outsideBlock);

    // this.llvmIrBuilder.CreateStore(i);
  }

  /**
   * Expects the curAst to be of Reassignment
   *
   */

  consumeReassignment(curAst: TypeCheckedAst | null) {
    if (curAst === null || curAst.type !== "ReAssignment")
      throw Error(
        `Expected curAst to be of type ConsumeReaassignment but instead got ${curAst?.type}`
      );

    const leftPath = curAst.path;
    const varPointer = this.getReassignmentPointer(leftPath);

    const expValue = this.getExpValue(curAst.exp);

    if (curAst.assignmentOperator === Token.Assign) {
      this.llvmIrBuilder.CreateStore(expValue, varPointer);
    } else if (curAst.assignmentOperator === Token.PlusAssign) {
      const loadVar = this.llvmIrBuilder.CreateLoad(
        this.llvmIrBuilder.getDoubleTy(),
        varPointer
      );
      const addValue = this.llvmIrBuilder.CreateFAdd(loadVar, expValue);
      this.llvmIrBuilder.CreateStore(addValue, varPointer);
    } else if (curAst.assignmentOperator === Token.MinusAssign) {
      const loadVar = this.llvmIrBuilder.CreateLoad(
        this.llvmIrBuilder.getDoubleTy(),
        varPointer
      );
      const minusValue = this.llvmIrBuilder.CreateFSub(loadVar, expValue);
      this.llvmIrBuilder.CreateStore(minusValue, varPointer);
    } else if (curAst.assignmentOperator === Token.StarAssign) {
      const loadVar = this.llvmIrBuilder.CreateLoad(
        this.llvmIrBuilder.getDoubleTy(),
        varPointer
      );
      const starValue = this.llvmIrBuilder.CreateFMul(loadVar, expValue);
      this.llvmIrBuilder.CreateStore(starValue, varPointer);
    } else if (curAst.assignmentOperator == Token.SlashAssign) {
      const loadVar = this.llvmIrBuilder.CreateLoad(
        this.llvmIrBuilder.getDoubleTy(),
        varPointer
      );
      const slashValue = this.llvmIrBuilder.CreateFDiv(loadVar, expValue);
      this.llvmIrBuilder.CreateStore(slashValue, varPointer);
    }
  }

  /**
   * Expects the curAst to be constVariableDeclaration
   */

  consumeVariableDeclaration(curAst: TypeCheckedAst | null) {
    if (
      curAst === null ||
      (curAst.type !== "constVariableDeclaration" &&
        curAst.type !== "letVariableDeclaration")
    )
      throw Error(`Unreachable`);

    const varType = this.getLLVMType(curAst.datatype);

    const resolvedIdentifierName = this.resolveIdentifierName(
      curAst.identifierName
    );

    const allocatedVar = this.llvmIrBuilder.CreateAlloca(
      varType,
      null,
      resolvedIdentifierName
    );

    const value = this.getExpValue(curAst.exp);

    this.llvmIrBuilder.CreateStore(value, allocatedVar);

    this.currentFn.insertVarName(resolvedIdentifierName, allocatedVar);
  }

  /**
   * Expects the curAst to be functionDeclaration
   */

  consumeFunctionDeclaration(curAst: TypeCheckedAst | null) {
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

    const TFnValue = new TLLVMFunction(fnValue);
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
  consumeReturnExp(curAst: TypeCheckedAst | null) {
    if (curAst === null || curAst.type !== "ReturnExpression")
      throw new Error("Expected curAst to be of type ReturnExpression");

    const returnExp = curAst.exp;

    if (returnExp === null) {
      this.llvmIrBuilder.CreateRetVoid();
    } else {
      this.llvmIrBuilder.CreateRet(this.getExpValue(returnExp));
    }
  }

  getReassignmentPointer(
    assignmentPath: ReAssignmentPath<TypeCheckedExpression, TypeCheckedDatatype>
  ): Value {
    if (assignmentPath.type === "IdentifierPath") {
      const varInfo = this.currentFn.getVarInfo(assignmentPath.name);

      if (varInfo === null)
        throw Error(`There is no variable with name ${assignmentPath.name}`);

      return varInfo;
    } else if (assignmentPath.type === "DotMemberPath") {
      const leftInfo = this.getReassignmentPointer(assignmentPath.leftPath);
      const leftDatatype = assignmentPath.leftDataType;

      if (!isObjectDatatype(leftDatatype))
        throw Error(
          "Expected typechecker to make sure that leftDatatype is object"
        );

      const index = Object.keys(leftDatatype.keys).indexOf(
        assignmentPath.rightPath
      );

      const deReferenceLeft = this.llvmIrBuilder.CreateLoad(
        leftInfo.getType().getPointerElementType(),
        leftInfo
      );

      const ObjectElementPointer = this.llvmIrBuilder.CreateGEP(
        deReferenceLeft.getType().getPointerElementType(),
        deReferenceLeft,
        [this.llvmIrBuilder.getInt64(0), this.llvmIrBuilder.getInt32(index)]
      );

      return ObjectElementPointer;
    } else if (assignmentPath.type === "BoxMemberPath") {
      const leftPointer = this.getReassignmentPointer(assignmentPath.leftPath);

      const floatIndexValue = this.getExpValue(assignmentPath.accessExp);
      const convertedToInt = this.llvmIrBuilder.CreateFPToSI(
        floatIndexValue,
        this.llvmIrBuilder.getInt32Ty()
      );

      const deferenceLeft = this.llvmIrBuilder.CreateLoad(
        leftPointer.getType().getPointerElementType(),
        leftPointer
      );

      const arrayElementPointer = this.llvmIrBuilder.CreateGEP(
        deferenceLeft.getType().getPointerElementType(),
        deferenceLeft,
        [this.llvmIrBuilder.getInt64(0), convertedToInt]
      );

      return arrayElementPointer;
    }

    throw Error("Not yet Implemented");
  }

  getExpValue(exp: TypeCheckedExpression): Value {
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
    } else if (exp.type === "object") {
      const objectDatatype = exp.datatype;

      if (!isObjectDatatype(objectDatatype)) {
        throw Error(
          "Expected typechecker to make sure that datatype to be always objectDatatype"
        );
      }

      const elementType = Object.values(objectDatatype.keys).map((value) => {
        if (value === undefined)
          throw Error("Did not expect undefined as value in keys");

        return this.getLLVMType(value);
      });

      const structType = StructType.get(this.llvmContext, elementType);
      const allocatedValue = this.llvmIrBuilder.CreateAlloca(structType);

      exp.keys.forEach(([_, exp], i) => {
        if (exp === undefined)
          throw Error("Did not expect undefined as values in keys");

        const insideElementPointer = this.llvmIrBuilder.CreateGEP(
          structType,
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

      if (isNumberDatatype(comparingDatatype)) {
        return this.llvmIrBuilder.CreateFCmpOEQ(leftValue, rightValue);
      } else if (isBooleanDatatype(comparingDatatype)) {
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

      if (isNumberDatatype(comparingDatatype)) {
        return this.llvmIrBuilder.CreateFCmpONE(leftValue, rightValue);
      } else if (isBooleanDatatype(comparingDatatype)) {
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
    } else if (exp.type === "DotMemberAccess") {
      const leftValue = this.getExpValue(exp.left);

      const leftDatatype = getDatatypeOfTypeCheckedExp(exp.left);

      if (!isObjectDatatype(leftDatatype)) {
        throw Error(
          "Expected typechecker to make sure that leftDatatype is ObjectDatatype"
        );
      }

      const elementIndex = Object.keys(leftDatatype.keys).findIndex(
        (value) => value === exp.right
      );

      const pointerToElement = this.llvmIrBuilder.CreateGEP(
        leftValue.getType().getPointerElementType(),
        leftValue,
        [
          this.llvmIrBuilder.getInt64(0),
          this.llvmIrBuilder.getInt32(elementIndex),
        ]
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

  getLLVMType(dataType: TypeCheckedDatatype): llvm.Type {
    if (isNumberDatatype(dataType)) {
      return this.llvmIrBuilder.getDoubleTy();
    } else if (isBooleanDatatype(dataType)) {
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
      } else if (dataType.type === "ObjectDataType") {
        const elementType = Object.values(dataType.keys).map(
          (elementDatatype) => {
            if (elementDatatype === undefined)
              throw Error("Did not expect undefined in keys");

            return this.getLLVMType(elementDatatype);
          }
        );

        return PointerType.get(
          StructType.get(this.llvmContext, elementType),
          0
        );
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

  // Adds the function context with the identifierName
  resolveIdentifierName(varName: string) {
    const resolvedName = `${varName}${this.currentFn.context}`;
    return resolvedName;
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

  getCurAst(): TypeCheckedAst | null {
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
