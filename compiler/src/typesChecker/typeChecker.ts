import deepEqual = require("deep-equal");
import { KeywordTokens, Token } from "../lexer/tokens";
import {
  ArrayDatatype,
  Ast,
  DataType,
  Expression,
  LiteralDataType,
  MinusUninaryExp,
  ObjectDatatype,
  PlusUninaryExp,
  ReAssignmentPath,
} from "../parser/ast";
import { Closure } from "./closure";

/**
 * Mutates the passed ast
 */
export const typeCheckAst = (asts: Ast[]): Ast[] => {
  const TypeChecker = new TypeCheckerFactory(asts, new Closure(null, false));
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

  constructor(asts: Ast[], closure: Closure) {
    this.asts = asts;
    this.curPos = 0;
    this.closure = closure;
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

    const LowerOrderClosure = new Closure(this.closure, true);
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

    const LowerOrderClosure = new Closure(this.closure, true);
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

    const expectedDatatype = curAst.datatype;
    const expressionDatatype = this.getDataTypeOfExpression(curAst.exp);

    if (
      expectedDatatype === LiteralDataType.NotCalculated ||
      expectedDatatype === LiteralDataType.Unknown
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

    this.next();
  }

  /**
   * Expects the curAst to be of type a ReAssignment
   */
  typeCheckReAssignment() {
    const curAst = this.getCurAst();

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

    const expDataType = this.getDataTypeOfExpression(curAst.exp);

    if (!deepEqual(dataTypeOfPath, expDataType, { strict: true })) {
      throw Error(
        `Cannot reassign a variable of datatype ${dataTypeOfPath} with exp whose datatype is ${expDataType} `
      );
    }

    if (curAst.assignmentOperator !== Token.Assign) {
      if (dataTypeOfPath !== LiteralDataType.Number)
        throw Error(`Expected datatype to be number`);
    }

    this.next(); // consumes ReAssignment
  }

  getDataTypeOfAssignmentPath(path: ReAssignmentPath): DataType {
    if (path.type === "IdentifierPath") {
      const identifierName = path.name;
      const identInfo = this.closure.getVariableInfo(identifierName);

      if (identInfo === null)
        throw Error(`There is no variable defined with name ${identifierName}`);

      return identInfo.dataType;
    } else if (path.type === "BoxMemberPath") {
      const leftDataType = this.getDataTypeOfAssignmentPath(path.leftPath);

      if (isArrayDatatype(leftDataType)) {
        const expDatatype = this.getDataTypeOfExpression(path.accessExp);

        if (expDatatype !== LiteralDataType.Number) {
          throw Error(
            "Only exp whose datatype is number can be used in accessing exp in BoxMemberPath"
          );
        }
        return leftDataType.baseType;
      } else {
        throw new Error(
          "Left datatype can only be Array Datatype in BoxMemberPath"
        );
      }
    } else if (path.type === "DotMemberPath") {
      const leftDataType = this.getDataTypeOfAssignmentPath(path.leftPath);

      if (isObjectDatatype(leftDataType)) {
        const keyName = path.rightPath;

        const keyType = leftDataType.keys[keyName];

        if (keyType === undefined) {
          throw Error(`There is no key with name ${keyName}`);
        }

        return keyType;
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
      const keys = exp.keys.reduce(
        (keys: { [name: string]: DataType }, curValue) => {
          const keyName = curValue[0];
          const keyExp = curValue[1];

          if (keys[keyName] !== undefined)
            throw Error(`There is already a key with name ${keyName}`);

          keys[keyName] = this.getDataTypeOfExpression(keyExp);
          return keys;
        },
        {}
      );

      return { type: "ObjectDataType", keys };
    } else if (exp.type === "array") {
      let baseDataType: DataType | null = null;

      exp.exps.forEach((exp) => {
        const expType = this.getDataTypeOfExpression(exp);

        if (baseDataType === null) {
          baseDataType = expType;
        } else {
          if (!deepEqual(baseDataType, expType, { strict: true }))
            throw Error(
              "Expected all expression to be of same datatype in array"
            );
        }
      });

      if (baseDataType === null)
        throw Error("Expected atleast one expression in array");

      return { type: "ArrayDataType", baseType: baseDataType };
    } else if (exp.type === "identifier") {
      const varInfo = this.closure.getVariableInfo(exp.name);

      if (varInfo === null)
        throw Error(`There is no variable with name ${exp.name}`);

      return varInfo.dataType;
    } else if (exp.type === Token.Plus) {
      if (isPlusUninaryExp(exp)) {
        const argumentExp = this.getDataTypeOfExpression(exp.argument);

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
          throw Error(
            "Expected both leftDatatype and rightDatatype to be equal and be either number or string"
          );
        }
      }
    } else if (exp.type === Token.Minus) {
      if (isMinusUninaryExp(exp)) {
        const argumentExp = this.getDataTypeOfExpression(exp.argument);

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
          throw Error(
            "Expected both leftDatatype and rightDatatype to be equal and be number"
          );
        }
      }
    } else if (exp.type === Token.Bang) {
      const argumentExp = this.getDataTypeOfExpression(exp.argument);

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
        return LiteralDataType.Boolean;
      } else {
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
        throw Error(
          "Expected both leftDatatype and rightDatatype to be equal and be number"
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

const isObjectDatatype = (dataType: DataType): dataType is ObjectDatatype => {
  return typeof dataType === "object" && dataType.type === "ObjectDataType";
};
