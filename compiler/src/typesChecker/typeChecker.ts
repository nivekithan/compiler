import deepEqual = require("deep-equal");
import { Token } from "../lexer/tokens";
import {
  Ast,
  DataType,
  Expression,
  LiteralDataType,
  MinusUninaryExp,
  PlusUninaryExp,
} from "../parser/ast";
import { Closure } from "./closure";

/**
 * Mutates the passed ast
 */
export const typeCheckAst = (asts: Ast[]): Ast[] => {
  const TypeChecker = new TypeCheckerFactory(asts);
  TypeChecker.typeCheck();
  return asts;
};

class TypeCheckerFactory {
  asts: Ast[];
  curPos: number | null;

  closure: Closure;

  constructor(asts: Ast[]) {
    this.asts = asts;
    this.curPos = 0;
    this.closure = new Closure();
  }

  typeCheck() {
    while (this.curPos !== null) {
      const curAst = this.getCurAst();

      if (curAst === null) return;

      if (
        curAst.type === "constVariableDeclaration" ||
        curAst.type === "letVariableDeclaration"
      )
        this.typeCheckVariableDeclaration();
    }
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

  getDataTypeOfExpression(exp: Expression): DataType {
    if (exp.type === "number") {
      return LiteralDataType.Number;
    } else if (exp.type === "boolean") {
      return LiteralDataType.Boolean;
    } else if (exp.type === "string") {
      return LiteralDataType.String;
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
