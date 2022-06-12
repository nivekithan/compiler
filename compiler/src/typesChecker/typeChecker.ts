import clone = require("clone");
import deepEqual = require("deep-equal");
import { KeywordTokens, Token } from "../lexer/tokens";
import {
  isFunctionDatatype,
  isArrayDatatype,
  isObjectDatatype,
  isPlusUninaryExp,
  isMinusUninaryExp,
  isUnknownVariable,
} from "../tsTypes/all";
import { Ast, DataType, Expression } from "../tsTypes/ast";
import {
  FunctionDatatype,
  IdentifierDatatype,
  LiteralDataType,
  MinusUninaryExp,
  ObjectDatatype,
  PlusUninaryExp,
  ReAssignmentPath,
  TypeCheckedIfBlockDeclaration,
  ArrayDatatype,
  UnknownVariable as UnknownVariableDatatype,
} from "../tsTypes/base";
import { Closure } from "./closure";
import { DepImporter } from "./depImporter";

/**
 * Mutates the passed ast
 */
export const typeCheckAst = (asts: Ast[], depImporter?: DepImporter): Ast[] => {
  const TypeChecker = new TypeCheckerFactory(
    asts,
    new Closure(null, {
      isInsideLoop: false,
    }),
    depImporter
  );
  TypeChecker.typeCheck();
  return asts;
};

export type TypeCheckerOptions = {
  isClosureCreatedForLoop: boolean;
};

class TypeCheckerFactory {
  asts: Ast[];
  curPos: number | null;

  closure: Closure;
  depImporter: DepImporter | null;

  constructor(asts: Ast[], closure: Closure, depImporter?: DepImporter) {
    this.asts = asts;
    this.curPos = 0;
    this.closure = closure;
    this.depImporter = depImporter === undefined ? null : depImporter;
  }

  typeCheck() {
    while (this.curPos !== null) {
      const curAst = this.getCurAst();

      if (curAst === null) return;

      if (
        curAst.type === "constVariableDeclaration" ||
        curAst.type === "letVariableDeclaration"
      ) {
        this.typeCheckVariableDeclaration();
      } else if (curAst.type === "ReAssignment") {
        this.typeCheckReAssignment();
      } else if (curAst.type === "WhileLoopDeclaration") {
        this.typeCheckWhileLoopDeclaration();
      } else if (curAst.type === "DoWhileLoopDeclaration") {
        this.typeCheckDoWhileLoopDeclaration();
      } else if (curAst.type === "FunctionDeclaration") {
        this.typeCheckFunctionDeclaration();
      } else if (curAst.type === "ReturnExpression") {
        this.typeCheckReturnExpression();
      } else if (curAst.type === "IfBlockDeclaration") {
        this.typeCheckIsBlockDeclaration();
      } else if (curAst.type === "importDeclaration") {
        this.typeCheckImportDeclaration();
      } else if (
        curAst.type === KeywordTokens.Break ||
        curAst.type === KeywordTokens.Continue
      ) {
        this.typeCheckCondFlowStatement();
      } else {
        throw Error(`Cannot typecheck ast of type ${curAst.type}`);
      }
    }
  }

  /**
   * Expects the curAst to be of type ImportDeclaration
   */
  typeCheckImportDeclaration() {
    const curAst = this.getCurAst();

    if (curAst === null || curAst.type !== "importDeclaration")
      throw new Error(
        `Expected curAst to be of type importDeclaration but instead got ${curAst}`
      );

    const depImporter = this.depImporter;

    if (depImporter === null)
      throw new Error(
        `DepImporter should not be null for parsing importDeclaration`
      );

    if (this.closure.higherClosure !== null)
      throw new Error(`Can only use import declaration at top level`);

    const fromFileName = curAst.from;

    curAst.importedIdentifires.forEach((s, i) => {
      const identifierName = s.name;
      const datatype = depImporter.getDatatypeFrom(
        identifierName,
        fromFileName
      );

      curAst.importedIdentifires[i].dataType = datatype;

      this.closure.insertVariableInfo({
        dataType: datatype,
        isDeclaredConst: true,
        isExported: false,
        name: identifierName,
      });
    });

    this.next();
  }

  /**
   * Expects the curAst to be of type ifBlockDeclaration
   */
  typeCheckIsBlockDeclaration() {
    const curAst = this.getCurAst();

    if (curAst === null || curAst.type !== "IfBlockDeclaration")
      throw Error("Expected curAst to be of type if Block declaration");

    const ifCondDatatype = this.getDataTypeOfExpression(curAst.condition);

    if (ifCondDatatype !== LiteralDataType.Boolean)
      throw Error(
        `Expected ifCondDatatype to be only LiteralDatatype.Boolean but instead got ${ifCondDatatype}`
      );

    const IfBlockClosure = new Closure(this.closure, {
      isInsideLoop: false,
    });

    const IfBlockTypeChecker = new TypeCheckerFactory(
      curAst.blocks,
      IfBlockClosure
    );

    IfBlockTypeChecker.typeCheck();

    const typeCheckedIfBlock: TypeCheckedIfBlockDeclaration = {
      type: "typeCheckedIfBlockDeclaration",
      ifBlock: curAst,
      elseIfBlocks: [],
    };

    this.removeCurAst(); // removes ifBlock from array

    const whileBlockCond = () => {
      const curAst = this.getCurAst();

      return curAst !== null && curAst.type === "ElseIfBlockDeclaration";
    };

    while (whileBlockCond()) {
      const curAst = this.getCurAst();

      if (curAst === null || curAst.type !== "ElseIfBlockDeclaration")
        throw Error("Unreachable");

      const elseIfCondDatatype = this.getDataTypeOfExpression(curAst.condition);

      if (elseIfCondDatatype !== LiteralDataType.Boolean)
        throw Error(
          `Expected datatype of else if condition to be boolean but instead got ${elseIfCondDatatype}`
        );

      const ElseIfBlockClosure = new Closure(this.closure, {
        isInsideLoop: false,
      });

      const ElseIfBlockTypeChecker = new TypeCheckerFactory(
        curAst.blocks,
        ElseIfBlockClosure
      );

      ElseIfBlockTypeChecker.typeCheck();

      typeCheckedIfBlock.elseIfBlocks.push(curAst);

      this.removeCurAst(); // removes else if block
    }

    const nextAst = this.getCurAst();

    if (nextAst !== null && nextAst.type === "ElseBlockDeclaration") {
      const ElseBlockClosure = new Closure(this.closure, {
        isInsideLoop: false,
      });

      const ElseBlockTypeChecker = new TypeCheckerFactory(
        nextAst.blocks,
        ElseBlockClosure
      );

      ElseBlockTypeChecker.typeCheck();

      typeCheckedIfBlock.elseBlock = nextAst;

      this.removeCurAst(); // removes else block
    }

    this.addAst(typeCheckedIfBlock);
    this.next(); // consumes typeCheckedIfBlock;
  }

  /**
   * Expects the curAst to be of type FunctionDeclaration
   */
  typeCheckFunctionDeclaration() {
    const curAst = this.getCurAst();

    if (curAst === null || curAst.type !== "FunctionDeclaration")
      throw new Error(
        `Expect curAst to be of type FunctionDeclaration but instead got ${curAst?.type}`
      );

    if (!this.closure.isTopLevel())
      throw Error("Can only declare function at top level");

    const argumentDatatypes = curAst.arguments.reduce(
      (argDatatypes: { [index: string]: DataType | undefined }, curr) => {
        const argName = curr[0];
        const argType = curr[1];

        if (argDatatypes[argName] !== undefined)
          throw Error(`There is already a argument with name ${argName}`);

        argDatatypes[argName] = argType;

        return argDatatypes;
      },
      {}
    );

    const FunctionClosure = new Closure(this.closure, {
      functionInfo: {
        insideFunctionDeclaration: true,
        returnType: curAst.returnType,
      },
      isInsideLoop: false,
    });

    Object.entries(argumentDatatypes).forEach(([argName, argDatatype]) => {
      if (argDatatype === undefined) throw Error("Impossible");

      FunctionClosure.insertVariableInfo({
        dataType: argDatatype,
        isDeclaredConst: false,
        isExported: false,
        name: argName,
      });
    });

    const TypeCheckerForFunction = new TypeCheckerFactory(
      curAst.blocks,
      FunctionClosure
    );

    TypeCheckerForFunction.typeCheck();

    const typeCheckedReturnType = FunctionClosure.functionInfo.returnType;

    if (isUnknownVariable(typeCheckedReturnType)) {
      const hookForReturnType = () => {
        const newReturnType = FunctionClosure.functionInfo.returnType;

        if (isUnknownVariable(newReturnType)) {
          FunctionClosure.addHookForReturnType(hookForReturnType);
        }

        curAst.returnType = newReturnType;
      };

      FunctionClosure.addHookForReturnType(hookForReturnType);
    }

    curAst.returnType = typeCheckedReturnType;

    this.next(); // consume Function Declaration

    this.closure.insertVariableInfo({
      name: curAst.name,
      isExported: curAst.export,
      isDeclaredConst: true,
      dataType: {
        type: "FunctionDataType",
        arguments: argumentDatatypes,
        returnType: curAst.returnType,
      },
    });
  }

  /**
   * Expects the curAst to be return Expression
   */
  typeCheckReturnExpression() {
    const curAst = this.getCurAst();

    if (curAst === null || curAst.type !== "ReturnExpression")
      throw Error("Expected curAst to be of type Return Expression");

    if (curAst.exp === null)
      throw Error("It is not still supported for return exp to be null");

    const datatype = this.getDataTypeOfExpression(curAst.exp);

    const returnType = this.closure.getReturnType();

    if (returnType === null)
      throw Error(
        "Cannot use return expression outside of function declaration"
      );

    if (isUnknownVariable(datatype)) {
      const varClosureHook = () => {
        if (curAst.exp === null) throw Error("Not yet supported");

        const newDatatype = this.getDataTypeOfExpression(curAst.exp);

        if (isUnknownVariable(newDatatype)) {
          const VarClosure = this.closure.getClosureWithVarName(
            newDatatype.varName
          );

          if (VarClosure !== null) {
            VarClosure.addHookForVariableInfo(
              newDatatype.varName,
              varClosureHook
            );
            return;
          }

          const topClosure = this.closure.getTopClosure();

          if (topClosure === this.closure) {
            // This can never happen since return exp at top level would have caused
            // the program to throw error when returnType is null
            throw Error("Unreachable");
          } else {
            topClosure.addHookForVariableInfo(
              newDatatype.varName,
              varClosureHook
            );
          }
        }

        this.closure.setReturnType(newDatatype);
      };

      const VarClosure = this.closure.getClosureWithVarName(datatype.varName);

      if (VarClosure !== null) {
        VarClosure.addHookForVariableInfo(datatype.varName, varClosureHook);
      } else {
        const topClosure = this.closure.getTopClosure();

        if (topClosure === this.closure) {
          // This can never happen since return exp at top level would have caused
          // the program to throw error when returnType is null
          throw Error("Unreachable");
        } else {
          topClosure.addHookForVariableInfo(datatype.varName, varClosureHook);
        }
      }
    }

    if (returnType === LiteralDataType.NotCalculated) {
      this.closure.setReturnType(datatype);
    } else if (!deepEqual(returnType, datatype, { strict: true })) {
      throw Error("Expected both returnType and datatype of exp to be equal");
    }

    this.next(); // consumes RetrunExpression
  }

  /**
   * Expects the curAst to be of type KeyWord.Break or Keyword.Continue*
   */
  typeCheckCondFlowStatement() {
    const curAst = this.getCurAst();

    if (
      curAst === null ||
      (curAst.type !== KeywordTokens.Break &&
        curAst.type !== KeywordTokens.Continue)
    )
      throw Error(
        `Expects the curAst to be of type Keyword.Break or keyWord.Continue but instead got ${curAst?.type}`
      );

    if (!this.closure.isInsideLoop())
      throw Error("Can only use Break or Continue statement inside loops");

    this.next(); // consumes Break or Continue
  }

  /**
   * Expects the curAst to be of type of DoWhileLoopDeclaration
   */
  typeCheckDoWhileLoopDeclaration() {
    const curAst = this.getCurAst();

    if (curAst === null || curAst.type !== "DoWhileLoopDeclaration")
      throw Error(
        `Expected curAst to be of type doWhileLoopDeclaration but instead got ${curAst?.type}`
      );

    const loopCondDatatype = this.getDataTypeOfExpression(curAst.condition);

    if (loopCondDatatype !== LiteralDataType.Boolean)
      throw Error(
        "Expected condition of do while loop to be of LiteralDatatype.Boolean"
      );

    const LowerOrderClosure = new Closure(this.closure, {
      isInsideLoop: true,
    });
    const DoWhileBlockTypeChecker = new TypeCheckerFactory(
      curAst.blocks,
      LowerOrderClosure
    );

    DoWhileBlockTypeChecker.typeCheck();

    this.next(); // consumes Do While loop declaration
  }

  /**
   * Expects the curAst to be of type WhileLoopDeclaration
   */
  typeCheckWhileLoopDeclaration() {
    const curAst = this.getCurAst();

    if (curAst === null || curAst.type !== "WhileLoopDeclaration")
      throw Error(
        `Expected curAst to be of type whileLoopDeclaration but instead got ${curAst?.type}`
      );

    const loopCondDatatype = this.getDataTypeOfExpression(curAst.condition);

    if (loopCondDatatype !== LiteralDataType.Boolean)
      throw Error(
        "Expected condition of while loop to be of LiteralDatatype.Boolean"
      );

    const LowerOrderClosure = new Closure(this.closure, {
      isInsideLoop: true,
    });
    const WhileBlockTypeChecker = new TypeCheckerFactory(
      curAst.blocks,
      LowerOrderClosure
    );

    WhileBlockTypeChecker.typeCheck();

    this.next(); // consumes While Loop declaration
  }

  /**
   * Expects the curAst to be of type either constVariableDeclaration or
   * letVariableDeclaration
   */
  typeCheckVariableDeclaration() {
    const curAst = this.getCurAst();

    if (curAst === null)
      throw Error("Expected current ast to be of variableDeclation");

    if (
      curAst.type !== "constVariableDeclaration" &&
      curAst.type !== "letVariableDeclaration"
    )
      throw Error(
        `Expected current ast to be of constVariableDeclaration or letVariableDeclaration but instead got ${curAst}`
      );

    if (curAst.export && !this.closure.isTopLevel())
      throw Error("Can only declare a variable as export at top level");

    const expectedDatatype = curAst.datatype;
    const expressionDatatype = this.getDataTypeOfExpression(curAst.exp);

    if (
      expectedDatatype === LiteralDataType.NotCalculated ||
      expectedDatatype === LiteralDataType.Unknown ||
      isUnknownVariable(expressionDatatype)
    ) {
      curAst.datatype = expressionDatatype;
    } else if (
      !deepEqual(expectedDatatype, expressionDatatype, { strict: true })
    ) {
      throw Error(
        `Expected datatype ${expectedDatatype} but instead got ${expressionDatatype}`
      );
    }

    this.closure.insertVariableInfo({
      name: curAst.identifierName,
      dataType: curAst.datatype,
      isDeclaredConst: curAst.type === "constVariableDeclaration",
      isExported: curAst.export,
    });

    if (isUnknownVariable(expressionDatatype)) {
      const varClosureHook = () => {
        const newDatatype = this.getDataTypeOfExpression(curAst.exp);

        curAst.datatype = newDatatype;

        if (isUnknownVariable(newDatatype)) {
          const VarClosure = this.closure.getClosureWithVarName(
            newDatatype.varName
          );

          if (VarClosure !== null) {
            VarClosure.addHookForVariableInfo(
              newDatatype.varName,
              varClosureHook
            );
          } else {
            const TopClosure = this.closure.getTopClosure();

            if (TopClosure === this.closure) {
              TopClosure.addHookForVariableInfo(
                newDatatype.varName,
                topClosureHook
              );
            }

            TopClosure.addHookForVariableInfo(
              newDatatype.varName,
              varClosureHook
            );
          }
        } else {
          if (
            expectedDatatype !== LiteralDataType.NotCalculated &&
            expectedDatatype !== LiteralDataType.Unknown &&
            !deepEqual(expectedDatatype, newDatatype, { strict: true })
          ) {
            throw Error(
              `Expected both expected datatype and expressed datatype to be equal`
            );
          }
        }

        this.closure.updateVariableInfo({
          name: curAst.identifierName,
          dataType: curAst.datatype,
          isDeclaredConst: curAst.type === "constVariableDeclaration",
          isExported: curAst.export,
        });
      };

      const topClosureHook = () => {
        const resolvedDatatype = this.closure.getVariableInfo(
          expressionDatatype.varName
        );

        if (
          resolvedDatatype === null ||
          !isFunctionDatatype(resolvedDatatype.dataType)
        ) {
          throw Error("Hoisting is only supported for function declartion");
        }

        varClosureHook();
      };

      const VarClosure = this.closure.getClosureWithVarName(
        expressionDatatype.varName
      );

      if (VarClosure !== null) {
        VarClosure.addHookForVariableInfo(
          expressionDatatype.varName,
          varClosureHook
        );
      } else {
        const TopClosure = this.closure.getTopClosure();

        if (TopClosure === this.closure) {
          TopClosure.addHookForVariableInfo(
            expressionDatatype.varName,
            topClosureHook
          );
        } else {
          TopClosure.addHookForVariableInfo(
            expressionDatatype.varName,
            varClosureHook
          );
        }
      }
    }

    this.next();
  }

  /**
   * Expects the curAst to be of type a ReAssignment
   */
  typeCheckReAssignment(ast?: Ast) {
    const curAst: Ast | null = ast === undefined ? this.getCurAst() : ast;

    if (curAst === null || curAst.type !== "ReAssignment")
      throw Error(
        `Expected curAst to be of type Reassignment but instead got ${curAst?.type}`
      );

    const path = curAst.path;

    if (path.type === "IdentifierPath") {
      const identifierName = path.name;
      const varInfo = this.closure.getVariableInfo(identifierName);

      if (varInfo === null)
        throw Error(`There is no variable defined with name ${identifierName}`);

      const isVarConst = varInfo.isDeclaredConst;

      if (isVarConst)
        throw Error("Cannot reassign variable that is declared const");
    }

    const dataTypeOfPath = this.getDataTypeOfAssignmentPath(path);

    if (isUnknownVariable(dataTypeOfPath)) {
      const varClosureHook = () => {
        this.typeCheckReAssignment(curAst);
      };

      const topClosureHook = () => {
        const varInfo = this.closure.getVariableInfo(dataTypeOfPath.varName);

        if (varInfo === null || !isFunctionDatatype(varInfo.dataType)) {
          throw Error("Hoisting is only supported for function declaration");
        }

        varClosureHook();
      };

      const VarClosure = this.closure.getClosureWithVarName(
        dataTypeOfPath.varName
      );

      if (VarClosure === null) {
        const TopClosure = this.closure.getTopClosure();

        if (TopClosure === this.closure) {
          TopClosure.addHookForVariableInfo(
            dataTypeOfPath.varName,
            topClosureHook
          );
        } else {
          TopClosure.addHookForVariableInfo(
            dataTypeOfPath.varName,
            varClosureHook
          );
        }
      } else {
        VarClosure.addHookForVariableInfo(
          dataTypeOfPath.varName,
          varClosureHook
        );
      }
    }

    const expDataType = this.getDataTypeOfExpression(curAst.exp);

    if (isUnknownVariable(expDataType)) {
      const varClosureHook = () => {
        this.typeCheckReAssignment(curAst);
      };

      const topClosureHook = () => {
        const varInfo = this.closure.getVariableInfo(expDataType.varName);

        if (varInfo === null || !isFunctionDatatype(varInfo.dataType)) {
          throw Error("Hoisting is only supported for function declaration");
        }

        varClosureHook();
      };

      const VarClosure = this.closure.getClosureWithVarName(
        expDataType.varName
      );

      if (VarClosure === null) {
        const TopClosure = this.closure.getTopClosure();

        if (TopClosure === this.closure) {
          TopClosure.addHookForVariableInfo(
            expDataType.varName,
            topClosureHook
          );
        } else {
          TopClosure.addHookForVariableInfo(
            expDataType.varName,
            varClosureHook
          );
        }
      } else {
        VarClosure.addHookForVariableInfo(expDataType.varName, varClosureHook);
      }
    }

    if (
      !deepEqual(dataTypeOfPath, expDataType, { strict: true }) &&
      !(isUnknownVariable(dataTypeOfPath) || isUnknownVariable(expDataType))
    ) {
      throw Error(
        `Cannot reassign a variable of datatype ${dataTypeOfPath} with exp whose datatype is ${expDataType} `
      );
    }

    if (
      curAst.assignmentOperator !== Token.Assign &&
      dataTypeOfPath !== LiteralDataType.Number &&
      !isUnknownVariable(dataTypeOfPath)
    )
      throw Error(`Expected datatype to be number`);

    ast === undefined ? this.next() : null; // consumes ReAssignment
  }

  getDataTypeOfAssignmentPath(
    path: ReAssignmentPath<Expression, DataType>
  ): DataType {
    if (path.type === "IdentifierPath") {
      const identifierName = path.name;
      const identInfo = this.closure.getVariableInfo(identifierName);

      if (identInfo === null)
        return { type: "UnknownVariable", varName: identifierName };

      if (isUnknownVariable(identInfo.dataType)) {
        return { type: "UnknownVariable", varName: identifierName };
      }

      return identInfo.dataType;
    } else if (path.type === "BoxMemberPath") {
      const leftDataType = this.getDataTypeOfAssignmentPath(path.leftPath);

      if (isArrayDatatype(leftDataType)) {
        const expDatatype = this.getDataTypeOfExpression(path.accessExp);
        path.leftBaseType = leftDataType.baseType;

        if (isUnknownVariable(expDatatype)) {
          return { type: "UnknownVariable", varName: expDatatype.varName };
        }

        if (expDatatype !== LiteralDataType.Number) {
          throw Error(
            "Only exp whose datatype is number can be used in accessing exp in BoxMemberPath"
          );
        }
        return leftDataType.baseType;
      } else if (isUnknownVariable(leftDataType)) {
        return { type: "UnknownVariable", varName: leftDataType.varName };
      } else {
        throw new Error(
          "Left datatype can only be Array Datatype in BoxMemberPath"
        );
      }
    } else if (path.type === "DotMemberPath") {
      const leftDataType = this.getDataTypeOfAssignmentPath(path.leftPath);
      path.leftDataType = leftDataType;
      if (isObjectDatatype(leftDataType)) {
        const keyName = path.rightPath;

        const keyType = leftDataType.keys[keyName];

        if (keyType === undefined) {
          throw Error(`There is no key with name ${keyName}`);
        }

        if (isUnknownVariable(keyType)) {
          return { type: "UnknownVariable", varName: keyType.varName };
        }

        return keyType;
      } else if (isUnknownVariable(leftDataType)) {
        return { type: "UnknownVariable", varName: leftDataType.varName };
      } else {
        throw Error("Left datatype can only be object in DotMemberPath");
      }
    } else {
      throw Error("Unreachable");
    }
  }

  getDataTypeOfExpression(exp: Expression): DataType {
    if (exp.type === "number") {
      return LiteralDataType.Number;
    } else if (exp.type === "boolean") {
      return LiteralDataType.Boolean;
    } else if (exp.type === "string") {
      return LiteralDataType.String;
    } else if (exp.type === "object") {
      let unknownVariable: string | null = null;

      const keys = exp.keys.reduce(
        (keys: { [name: string]: DataType }, curValue) => {
          const keyName = curValue[0];
          const keyExp = curValue[1];

          if (keys[keyName] !== undefined)
            throw Error(`There is already a key with name ${keyName}`);

          const keyDatatype = this.getDataTypeOfExpression(keyExp);

          if (isUnknownVariable(keyDatatype)) {
            unknownVariable = keyDatatype.varName;
          }

          keys[keyName] = keyDatatype;

          return keys;
        },
        {}
      );

      if (unknownVariable !== null) {
        return { type: "UnknownVariable", varName: unknownVariable };
      }

      const datatype: DataType = {
        type: "ObjectDataType",
        keys,
      };

      exp.datatype = datatype;
      return datatype;
    } else if (exp.type === "array") {
      let baseDataType: DataType | null = null;
      let unknownVariableName: string | null = null;

      exp.exps.forEach((exp) => {
        const expType = this.getDataTypeOfExpression(exp);

        if (baseDataType === null) {
          baseDataType = expType;
          if (isUnknownVariable(expType)) {
            unknownVariableName = expType.varName;
            return;
          }
        } else {
          if (isUnknownVariable(baseDataType)) {
            unknownVariableName = baseDataType.varName;
            return;
          }

          if (isUnknownVariable(expType)) {
            unknownVariableName = expType.varName;
            return;
          }

          if (!deepEqual(baseDataType, expType, { strict: true }))
            throw Error(
              "Expected all expression to be of same datatype in array"
            );
        }
      });

      if (baseDataType === null)
        throw Error("Expected atleast one expression in array");

      if (unknownVariableName !== null) {
        const datatype: DataType = {
          type: "UnknownVariable",
          varName: unknownVariableName,
        };
        exp.datatype = datatype;
        return datatype;
      }

      const datatype: DataType = {
        type: "ArrayDataType",
        baseType: baseDataType,
        numberOfElements: exp.exps.length,
      };

      exp.datatype = datatype;
      return datatype;
    } else if (exp.type === "identifier") {
      if (
        exp.datatype === LiteralDataType.NotCalculated ||
        isUnknownVariable(exp.datatype)
      ) {
        const varInfo = this.closure.getVariableInfo(exp.name);

        if (varInfo === null) {
          return { type: "UnknownVariable", varName: exp.name };
        }

        if (isUnknownVariable(varInfo.dataType)) {
          exp.datatype = { type: "UnknownVariable", varName: exp.name };
          return { type: "UnknownVariable", varName: exp.name };
        }

        exp.datatype = varInfo.dataType;

        return exp.datatype;
      } else {
        return exp.datatype;
      }
    } else if (exp.type === Token.Plus) {
      if (isPlusUninaryExp(exp)) {
        const argumentExp = this.getDataTypeOfExpression(exp.argument);

        if (isUnknownVariable(argumentExp)) {
          return { type: "UnknownVariable", varName: argumentExp.varName };
        }

        if (argumentExp !== LiteralDataType.Number)
          throw Error(
            "Argument to Uninary Plus Token cannot be anything other Datatype `number`"
          );

        return LiteralDataType.Number;
      } else {
        const leftDataType = this.getDataTypeOfExpression(exp.left);
        const rightDataType = this.getDataTypeOfExpression(exp.right);

        if (
          leftDataType === LiteralDataType.Number &&
          rightDataType === LiteralDataType.Number
        ) {
          return LiteralDataType.Number;
        } else if (
          leftDataType === LiteralDataType.String &&
          rightDataType === LiteralDataType.String
        ) {
          return LiteralDataType.String;
        } else {
          if (isUnknownVariable(leftDataType)) {
            return { type: "UnknownVariable", varName: leftDataType.varName };
          }

          if (isUnknownVariable(rightDataType)) {
            return { type: "UnknownVariable", varName: rightDataType.varName };
          }

          throw Error(
            "Expected both leftDatatype and rightDatatype to be equal and be either number or string"
          );
        }
      }
    } else if (exp.type === Token.Minus) {
      if (isMinusUninaryExp(exp)) {
        const argumentExp = this.getDataTypeOfExpression(exp.argument);

        if (isUnknownVariable(argumentExp)) {
          return { type: "UnknownVariable", varName: argumentExp.varName };
        }

        if (argumentExp !== LiteralDataType.Number)
          throw Error(
            "Argument to Uninary Plus Token cannot be anything other Datatype `number`"
          );

        return LiteralDataType.Number;
      } else {
        const leftDataType = this.getDataTypeOfExpression(exp.left);
        const rightDataType = this.getDataTypeOfExpression(exp.right);

        if (
          leftDataType === LiteralDataType.Number &&
          rightDataType === LiteralDataType.Number
        ) {
          return LiteralDataType.Number;
        } else {
          if (isUnknownVariable(leftDataType)) {
            return { type: "UnknownVariable", varName: leftDataType.varName };
          }

          if (isUnknownVariable(rightDataType)) {
            return { type: "UnknownVariable", varName: rightDataType.varName };
          }

          throw Error(
            "Expected both leftDatatype and rightDatatype to be equal and be number"
          );
        }
      }
    } else if (exp.type === Token.Bang) {
      const argumentExp = this.getDataTypeOfExpression(exp.argument);

      if (isUnknownVariable(argumentExp)) {
        return { type: "UnknownVariable", varName: argumentExp.varName };
      }

      if (argumentExp !== LiteralDataType.Boolean) {
        throw Error(
          "Argument to Bang Uniary Exp can only be datatype of Boolean"
        );
      }

      return LiteralDataType.Boolean;
    } else if (
      exp.type === Token.Star ||
      exp.type === Token.Slash ||
      exp.type == Token.VerticalBar ||
      exp.type === Token.Caret ||
      exp.type === Token.Ampersand
    ) {
      const leftDataType = this.getDataTypeOfExpression(exp.left);
      const rightDataType = this.getDataTypeOfExpression(exp.right);

      if (
        leftDataType === LiteralDataType.Number &&
        rightDataType === LiteralDataType.Number
      ) {
        return LiteralDataType.Number;
      } else {
        if (isUnknownVariable(leftDataType)) {
          return { type: "UnknownVariable", varName: leftDataType.varName };
        }

        if (isUnknownVariable(rightDataType)) {
          return { type: "UnknownVariable", varName: rightDataType.varName };
        }

        throw Error(
          "Expected both leftDatatype and rightDatatype to be equal and be number"
        );
      }
    } else if (
      exp.type === Token.StrictEquality ||
      exp.type === Token.StrictNotEqual
    ) {
      const leftDataType = this.getDataTypeOfExpression(exp.left);
      const rightDataType = this.getDataTypeOfExpression(exp.right);

      if (leftDataType === rightDataType) {
        exp.datatype = clone(leftDataType);

        return LiteralDataType.Boolean;
      } else {
        if (isUnknownVariable(leftDataType)) {
          return { type: "UnknownVariable", varName: leftDataType.varName };
        }

        if (isUnknownVariable(rightDataType)) {
          return { type: "UnknownVariable", varName: rightDataType.varName };
        }

        throw Error("Expected both leftDatatype and rightDatatype to be equal");
      }
    } else if (
      exp.type === Token.LessThan ||
      exp.type === Token.LessThanOrEqual ||
      exp.type === Token.GreaterThan ||
      exp.type === Token.GreaterThanOrEqual
    ) {
      const leftDataType = this.getDataTypeOfExpression(exp.left);
      const rightDataType = this.getDataTypeOfExpression(exp.right);

      if (
        leftDataType === LiteralDataType.Number &&
        rightDataType === LiteralDataType.Number
      ) {
        return LiteralDataType.Boolean;
      } else {
        if (isUnknownVariable(leftDataType)) {
          return { type: "UnknownVariable", varName: leftDataType.varName };
        }

        if (isUnknownVariable(rightDataType)) {
          return { type: "UnknownVariable", varName: rightDataType.varName };
        }

        throw Error(
          "Expected both leftDatatype and rightDatatype to be equal and be number"
        );
      }
    } else if (exp.type === "FunctionCall") {
      const leftDatatype = this.getDataTypeOfExpression(exp.left);

      if (isFunctionDatatype(leftDatatype)) {
        const passedArgumentsDatatype = exp.arguments.reduce(
          (acc: DataType[], curr) => {
            acc.push(this.getDataTypeOfExpression(curr));
            return acc;
          },
          []
        );

        const requiredArgumentsDatatype = Object.values(leftDatatype.arguments);

        let unknownVarName: string | null = null;

        for (let i = 0; i <= passedArgumentsDatatype.length - 1; i++) {
          const passedDatatype = passedArgumentsDatatype[i];
          const requiredDatatype = requiredArgumentsDatatype[i];

          if (isUnknownVariable(passedDatatype)) {
            unknownVarName = passedDatatype.varName;
            continue;
          } else {
            if (deepEqual(passedDatatype, requiredDatatype, { strict: true })) {
              continue;
            } else {
              throw Error(
                "Passed Arguments and required arguments does not match"
              );
            }
          }
        }

        if (unknownVarName !== null) {
          return { type: "UnknownVariable", varName: unknownVarName };
        }

        return leftDatatype.returnType;
      } else {
        if (isUnknownVariable(leftDatatype)) {
          return { type: "UnknownVariable", varName: leftDatatype.varName };
        }

        throw Error(
          `Expected the type of datatype of left in function call to be Function datatype but instead got ${leftDatatype}`
        );
      }
    } else if (exp.type === "BoxMemberAccess") {
      const leftDatatype = this.getDataTypeOfExpression(exp.left);

      if (isUnknownVariable(leftDatatype)) {
        return { type: "UnknownVariable", varName: leftDatatype.varName };
      }

      const memberAccessDatatype = this.getDataTypeOfExpression(exp.right);

      if (isUnknownVariable(memberAccessDatatype)) {
        return {
          type: "UnknownVariable",
          varName: memberAccessDatatype.varName,
        };
      }

      if (memberAccessDatatype !== LiteralDataType.Number)
        throw Error(
          "It is not supported to memberAcessDatatype to be anything other than number"
        );

      if (isArrayDatatype(leftDatatype)) {
        return leftDatatype.baseType;
      } else {
        throw Error(
          `Expected left datatype to be Array but instead got ${leftDatatype}`
        );
      }
    } else if (exp.type === "DotMemberAccess") {
      const leftDatatype = this.getDataTypeOfExpression(exp.left);

      if (isUnknownVariable(leftDatatype)) {
        return { type: "UnknownVariable", varName: leftDatatype.varName };
      }

      if (isObjectDatatype(leftDatatype)) {
        const keyDatatype = leftDatatype.keys[exp.right];

        if (keyDatatype === undefined) {
          throw Error(`There is no key with name ${exp.right}`);
        }

        if (isUnknownVariable(keyDatatype)) {
          return {
            type: "UnknownVariable",
            varName: keyDatatype.varName,
          };
        }

        return keyDatatype;
      } else {
        throw Error(
          `Expected left datatype to be object but instead got ${leftDatatype}`
        );
      }
    } else {
      throw Error(
        `Finding datatype for this expression is not yet supported \n ${exp} `
      );
    }
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
  // Removes the curAst
  // Will not work if the curAst is null and if we are removing the last element
  // then it will set the curPos to null
  removeCurAst() {
    if (this.curPos === null) {
      throw Error("Cannot call removeCurAst when curPos is null");
    } else {
      const value = this.curPos;
      if (value === this.asts.length - 1) {
        this.curPos = null;
      }

      this.asts.splice(value, 1);
    }
  }
  // If the curPos is null then it will add ast at the end of array and set the curPos to asts.length - 1
  // If not then the curPos won't change
  addAst(ast: Ast) {
    const value = this.curPos;

    if (value === null) {
      this.curPos = this.asts.push(ast) - 1;
    } else {
      this.asts.splice(value, 0, ast);
    }
  }
}
