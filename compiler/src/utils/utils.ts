import { Token } from "../lexer/tokens";
import {
  AmpersandBinaryExp,
  ArrayDatatype,
  ArrayLiteralExp,
  Ast,
  BangUninaryExp,
  BinaryExp,
  BooleanLiteralExp,
  BoxMemberAccessExp,
  CaretBinaryExp,
  // CharLiteralExp,
  DataType,
  DotMemberAccessExp,
  Expression,
  FunctionCall,
  FunctionDatatype,
  GreaterThanBinaryExp,
  GreaterThanOrEqualBinaryExp,
  IdentifierExp,
  LessThanBinaryExp,
  LessThanOrEqualBinaryExp,
  LiteralDataType,
  MinusBinaryExp,
  MinusUninaryExp,
  NumberLiteralExp,
  ObjectDatatype,
  ObjectLiteralExp,
  PlusBinaryExp,
  PlusUninaryExp,
  SlashBinaryExp,
  StarBinaryExp,
  StrictEqualityBinaryExp,
  StrictNotEqualBinaryExp,
  StringLiteralExp,
  UninaryExp,
  VerticalBarBinaryExp,
} from "../parser/ast";

/**
 * Finds the datatype of Exp. It assumes the exp to be typechecked and it
 * does not verify it
 *
 * @param exp - Ast which has been typechecked
 * @return Datatype of exp
 */
export const getDatatypeOfTypeCheckedExp = (exp: Expression): DataType => {
  // if (isCharLiteralexp(exp)) return LiteralDataType.Char;
  if (isStringLiteralExp(exp)) return LiteralDataType.String;
  if (isIdentifierLiteralExp(exp)) return exp.datatype;
  if (isNumberLiteralExp(exp)) return LiteralDataType.Number;
  if (isBooleanLiteralExp(exp)) return LiteralDataType.Boolean;
  if (isObjectLiteralExp(exp)) return exp.datatype;
  if (isArrayLiteralExp(exp)) return exp.datatype;
  if (isFunctionCallExp(exp)) {
    const leftDatatype = getDatatypeOfTypeCheckedExp(exp.left);

    if (isFunctionDatatype(leftDatatype)) {
      return leftDatatype.returnType;
    } else {
      throw Error("Expected leftDatatype to be function datatype");
    }
  }
  if (isPlusUninaryExp(exp) || isMinusUninaryExp(exp)) {
    return LiteralDataType.Number;
  }
  if (isBangUniaryExp(exp)) {
    return LiteralDataType.Boolean;
  }
  if (
    isPlusBinaryExp(exp) ||
    isMinusBinaryExp(exp) ||
    isStarBinaryExp(exp) ||
    isSlashBinaryExp(exp) ||
    isVerticalBarBinaryExp(exp) ||
    isCaretBinaryExp(exp) ||
    isAmpersandBinaryExp(exp)
  ) {
    return LiteralDataType.Number;
  }

  if (
    isStrictEqualityBinaryExp(exp) ||
    isStrictNotEqualBinaryExp(exp) ||
    isLessThanBinaryExp(exp) ||
    isLessThanOrEqualBinaryExp(exp) ||
    isGreaterThanBinaryExp(exp) ||
    isGreaterThanOrEqualBinaryExp(exp)
  ) {
    return LiteralDataType.Boolean;
  }
  if (isDotMemberAccessExp(exp)) {
    const leftDatatype = getDatatypeOfTypeCheckedExp(exp.left);

    if (isObjectDatatype(leftDatatype)) {
      const elementDatatype = leftDatatype.keys[exp.right];

      if (elementDatatype === undefined)
        throw Error("Did not expect elementDatatype to be undefined");

      return elementDatatype;
    } else {
      throw Error("Expected leftDatatype to ObjectDatatype ");
    }
  }
  if (isBoxMemberAccessExp(exp)) {
    const leftDatatype = getDatatypeOfTypeCheckedExp(exp.left);

    if (isArrayDatatype(leftDatatype)) {
      return leftDatatype.baseType;
    } else {
      throw Error("Expected leftDatatype to be Array");
    }
  }

  throw Error(`It is not supported for getting datatype for exp ${exp}`);
};

// export const isCharLiteralexp = (exp: Expression): exp is CharLiteralExp => {
//   return exp.type === "char";
// };

export const isStringLiteralExp = (
  exp: Expression
): exp is StringLiteralExp => {
  return exp.type === "string";
};

export const isIdentifierLiteralExp = (
  exp: Expression
): exp is IdentifierExp => {
  return exp.type === "identifier";
};

export const isNumberLiteralExp = (
  exp: Expression
): exp is NumberLiteralExp => {
  return exp.type === "number";
};

export const isBooleanLiteralExp = (
  exp: Expression
): exp is BooleanLiteralExp => {
  return exp.type === "boolean";
};

export const isObjectLiteralExp = (
  exp: Expression
): exp is ObjectLiteralExp => {
  return exp.type === "object";
};

export const isArrayLiteralExp = (exp: Expression): exp is ArrayLiteralExp => {
  return exp.type === "array";
};

export const isUniaryExp = (exp: Expression): exp is UninaryExp => {
  return (
    isPlusUninaryExp(exp) || isMinusUninaryExp(exp) || isBangUniaryExp(exp)
  );
};

export const isPlusUninaryExp = (exp: Expression): exp is PlusUninaryExp => {
  if (
    exp.type === Token.Plus &&
    (exp as PlusUninaryExp).argument !== undefined
  ) {
    return true;
  }

  return false;
};

export const isMinusUninaryExp = (exp: Expression): exp is MinusUninaryExp => {
  if (
    exp.type === Token.Minus &&
    (exp as MinusUninaryExp).argument !== undefined
  ) {
    return true;
  }

  return false;
};

export const isBangUniaryExp = (exp: Expression): exp is BangUninaryExp => {
  if (exp.type === Token.Bang) {
    return true;
  }

  return false;
};

export const isBinaryExp = (exp: Expression): exp is BinaryExp => {
  return (
    isPlusBinaryExp(exp) ||
    isMinusBinaryExp(exp) ||
    isStarBinaryExp(exp) ||
    isSlashBinaryExp(exp) ||
    isVerticalBarBinaryExp(exp) ||
    isCaretBinaryExp(exp) ||
    isAmpersandBinaryExp(exp) ||
    isStrictEqualityBinaryExp(exp) ||
    isStrictNotEqualBinaryExp(exp) ||
    isLessThanBinaryExp(exp) ||
    isLessThanOrEqualBinaryExp(exp) ||
    isGreaterThanBinaryExp(exp) ||
    isGreaterThanOrEqualBinaryExp(exp)
  );
};

export const isPlusBinaryExp = (exp: Expression): exp is PlusBinaryExp => {
  if (exp.type === Token.Plus && (exp as PlusBinaryExp).left !== undefined) {
    return true;
  }

  return false;
};

export const isMinusBinaryExp = (exp: Expression): exp is MinusBinaryExp => {
  if (exp.type === Token.Minus && (exp as MinusBinaryExp).left !== undefined) {
    return true;
  }

  return false;
};

export const isStarBinaryExp = (exp: Expression): exp is StarBinaryExp => {
  if (exp.type === Token.Star) {
    return true;
  }

  return false;
};

export const isSlashBinaryExp = (exp: Expression): exp is SlashBinaryExp => {
  return exp.type === Token.Slash;
};

export const isVerticalBarBinaryExp = (
  exp: Expression
): exp is VerticalBarBinaryExp => {
  return exp.type === Token.VerticalBar;
};

export const isCaretBinaryExp = (exp: Expression): exp is CaretBinaryExp => {
  return exp.type === Token.Caret;
};

export const isAmpersandBinaryExp = (
  exp: Expression
): exp is AmpersandBinaryExp => {
  return exp.type === Token.Ampersand;
};

export const isStrictEqualityBinaryExp = (
  exp: Expression
): exp is StrictEqualityBinaryExp => {
  return exp.type === Token.StrictEquality;
};

export const isStrictNotEqualBinaryExp = (
  exp: Expression
): exp is StrictNotEqualBinaryExp => {
  return exp.type === Token.StrictNotEqual;
};

export const isLessThanBinaryExp = (
  exp: Expression
): exp is LessThanBinaryExp => {
  return exp.type === Token.LessThan;
};

export const isLessThanOrEqualBinaryExp = (
  exp: Expression
): exp is LessThanOrEqualBinaryExp => {
  return exp.type === Token.LessThanOrEqual;
};

export const isGreaterThanBinaryExp = (
  exp: Expression
): exp is GreaterThanBinaryExp => {
  return exp.type === Token.GreaterThan;
};

export const isGreaterThanOrEqualBinaryExp = (
  exp: Expression
): exp is GreaterThanOrEqualBinaryExp => {
  return exp.type === Token.GreaterThanOrEqual;
};

export const isBoxMemberAccessExp = (
  exp: Expression
): exp is BoxMemberAccessExp => {
  return exp.type === "BoxMemberAccess";
};

export const isDotMemberAccessExp = (
  exp: Expression
): exp is DotMemberAccessExp => {
  return exp.type === "DotMemberAccess";
};

export const isFunctionCallExp = (exp: Expression): exp is FunctionCall => {
  return exp.type === "FunctionCall";
};

export const isArrayDatatype = (
  datatype: DataType
): datatype is ArrayDatatype => {
  return typeof datatype === "object" && datatype.type === "ArrayDataType";
};

export const isObjectDatatype = (
  datatype: DataType
): datatype is ObjectDatatype => {
  return typeof datatype === "object" && datatype.type === "ObjectDataType";
};

export const isFunctionDatatype = (
  datatype: DataType
): datatype is FunctionDatatype => {
  return typeof datatype === "object" && datatype.type === "FunctionDataType";
};
