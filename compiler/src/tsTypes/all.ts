import { Token } from "../lexer/tokens";
import { DataType } from "./ast";
import {
  AmpersandBinaryExp,
  ArrayDatatype,
  ArrayLiteralExp,
  BangUninaryExp,
  BooleanDataType,
  BooleanLiteralExp,
  BoxMemberAccessExp,
  CaretBinaryExp,
  CharDatatype,
  CharLiteralExp,
  DotMemberAccessExp,
  FunctionCall,
  FunctionDatatype,
  GreaterThanBinaryExp,
  GreaterThanOrEqualBinaryExp,
  IdentifierDatatype,
  IdentifierExp,
  LessThanBinaryExp,
  LessThanOrEqualBinaryExp,
  MinusBinaryExp,
  MinusUninaryExp,
  NotCalculatedDatatype,
  NumberDatatype,
  NumberLiteralExp,
  ObjectDatatype,
  ObjectLiteralExp,
  PlusBinaryExp,
  PlusUninaryExp,
  SlashBinaryExp,
  StarBinaryExp,
  StrictEqualityBinaryExp,
  StrictNotEqualBinaryExp,
  StringDatatype,
  StringLiteralExp,
  UnknownDatatype,
  UnknownVariable,
  VerticalBarBinaryExp,
} from "./base";

export type AllExpression<ExpType, DataType> =
  | CharLiteralExp
  | StringLiteralExp
  | IdentifierExp<DataType>
  | NumberLiteralExp
  | BooleanLiteralExp
  | ObjectLiteralExp<ExpType, DataType>
  | ArrayLiteralExp<ExpType, DataType>
  | AllUninaryExp<ExpType>
  | AllBinaryExp<ExpType, DataType>
  | BoxMemberAccessExp<ExpType>
  | DotMemberAccessExp<ExpType>
  | FunctionCall<ExpType>;

export type AllUninaryExp<ExpType> =
  | PlusUninaryExp<ExpType>
  | MinusUninaryExp<ExpType>
  | BangUninaryExp<ExpType>;

export type AllBinaryExp<ExpType, DataType> =
  | PlusBinaryExp<ExpType>
  | MinusBinaryExp<ExpType>
  | StarBinaryExp<ExpType>
  | SlashBinaryExp<ExpType>
  | VerticalBarBinaryExp<ExpType>
  | CaretBinaryExp<ExpType>
  | AmpersandBinaryExp<ExpType>
  | StrictEqualityBinaryExp<ExpType, DataType>
  | StrictNotEqualBinaryExp<ExpType, DataType>
  | LessThanBinaryExp<ExpType>
  | LessThanOrEqualBinaryExp<ExpType>
  | GreaterThanBinaryExp<ExpType>
  | GreaterThanOrEqualBinaryExp<ExpType>;

export type AllDataType<DataType> =
  | NumberDatatype
  | BooleanDataType
  | CharDatatype
  | UnknownDatatype
  | NotCalculatedDatatype
  | StringDatatype
  | IdentifierDatatype
  | ArrayDatatype<DataType>
  | ObjectDatatype<DataType>
  | FunctionDatatype<DataType>
  | UnknownVariable;

export const isCharLiteralExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is CharLiteralExp => {
  return exp.type === "char";
};

export const isStringLiteralExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is StringLiteralExp => {
  return exp.type === "string";
};

export const isIdentifierLiteralExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is IdentifierExp<DataType> => {
  return exp.type === "identifier";
};

export const isNumberLiteralExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is NumberLiteralExp => {
  return exp.type === "number";
};

export const isBooleanLiteralExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is BooleanLiteralExp => {
  return exp.type === "boolean";
};

export const isObjectLiteralExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is ObjectLiteralExp<ExpType, DataType> => {
  return exp.type === "object";
};

export const isArrayLiteralExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is ArrayLiteralExp<ExpType, DataType> => {
  return exp.type === "array";
};

export const isUniaryExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is AllUninaryExp<ExpType> => {
  return (
    isPlusUninaryExp(exp) || isMinusUninaryExp(exp) || isBangUniaryExp(exp)
  );
};

export const isPlusUninaryExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is PlusUninaryExp<ExpType> => {
  if (
    exp.type === Token.Plus &&
    (exp as PlusUninaryExp<ExpType>).argument !== undefined
  ) {
    return true;
  }

  return false;
};

export const isMinusUninaryExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is MinusUninaryExp<ExpType> => {
  if (
    exp.type === Token.Minus &&
    (exp as MinusUninaryExp<ExpType>).argument !== undefined
  ) {
    return true;
  }

  return false;
};

export const isBangUniaryExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is BangUninaryExp<ExpType> => {
  if (exp.type === Token.Bang) {
    return true;
  }

  return false;
};

export const isBinaryExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is AllBinaryExp<ExpType, DataType> => {
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

export const isPlusBinaryExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is PlusBinaryExp<ExpType> => {
  if (
    exp.type === Token.Plus &&
    (exp as PlusBinaryExp<ExpType>).left !== undefined
  ) {
    return true;
  }

  return false;
};

export const isMinusBinaryExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is MinusBinaryExp<ExpType> => {
  if (
    exp.type === Token.Minus &&
    (exp as MinusBinaryExp<ExpType>).left !== undefined
  ) {
    return true;
  }

  return false;
};

export const isStarBinaryExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is StarBinaryExp<ExpType> => {
  if (exp.type === Token.Star) {
    return true;
  }

  return false;
};

export const isSlashBinaryExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is SlashBinaryExp<ExpType> => {
  return exp.type === Token.Slash;
};

export const isVerticalBarBinaryExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is VerticalBarBinaryExp<ExpType> => {
  return exp.type === Token.VerticalBar;
};

export const isCaretBinaryExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is CaretBinaryExp<ExpType> => {
  return exp.type === Token.Caret;
};

export const isAmpersandBinaryExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is AmpersandBinaryExp<ExpType> => {
  return exp.type === Token.Ampersand;
};

export const isStrictEqualityBinaryExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is StrictEqualityBinaryExp<ExpType, DataType> => {
  return exp.type === Token.StrictEquality;
};

export const isStrictNotEqualBinaryExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is StrictNotEqualBinaryExp<ExpType, DataType> => {
  return exp.type === Token.StrictNotEqual;
};

export const isLessThanBinaryExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is LessThanBinaryExp<ExpType> => {
  return exp.type === Token.LessThan;
};

export const isLessThanOrEqualBinaryExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is LessThanOrEqualBinaryExp<ExpType> => {
  return exp.type === Token.LessThanOrEqual;
};

export const isGreaterThanBinaryExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is GreaterThanBinaryExp<ExpType> => {
  return exp.type === Token.GreaterThan;
};

export const isGreaterThanOrEqualBinaryExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is GreaterThanOrEqualBinaryExp<ExpType> => {
  return exp.type === Token.GreaterThanOrEqual;
};

export const isBoxMemberAccessExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is BoxMemberAccessExp<ExpType> => {
  return exp.type === "BoxMemberAccess";
};

export const isDotMemberAccessExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is DotMemberAccessExp<ExpType> => {
  return exp.type === "DotMemberAccess";
};

export const isFunctionCallExp = <ExpType, DataType>(
  exp: AllExpression<ExpType, DataType>
): exp is FunctionCall<ExpType> => {
  return exp.type === "FunctionCall";
};

export const isNumberDatatype = <DataType>(
  datatype: AllDataType<DataType>
): datatype is NumberDatatype => {
  return typeof datatype === "object" && datatype.type === "NumberDatatype";
};

export const isBooleanDatatype = <DataType>(
  datatype: AllDataType<DataType>
): datatype is BooleanDataType => {
  return typeof datatype === "object" && datatype.type === "BooleanDataType";
};

export const isCharDatatype = <DataType>(
  datatype: AllDataType<DataType>
): datatype is CharDatatype => {
  return typeof datatype === "object" && datatype.type === "CharDatatype";
};

export const isNotCalculatedDatatype = <DataType>(
  datatype: AllDataType<DataType>
): datatype is NotCalculatedDatatype => {
  return (
    typeof datatype === "object" && datatype.type === "NotCalculatedDatatype"
  );
};

export const isUnknownDatatype = <DataType>(
  datatype: AllDataType<DataType>
): datatype is StringDatatype => {
  return typeof datatype === "object" && datatype.type === "UnknownDatatype";
};

export const isStringDatatype = <DataType>(
  datatype: AllDataType<DataType>
): datatype is StringDatatype => {
  return typeof datatype === "object" && datatype.type === "StringDatatype";
};

export const isArrayDatatype = <DataType>(
  datatype: AllDataType<DataType>
): datatype is ArrayDatatype<DataType> => {
  return typeof datatype === "object" && datatype.type === "ArrayDataType";
};

export const isObjectDatatype = <DataType>(
  datatype: AllDataType<DataType>
): datatype is ObjectDatatype<DataType> => {
  return typeof datatype === "object" && datatype.type === "ObjectDataType";
};

export const isFunctionDatatype = <DataType>(
  datatype: AllDataType<DataType>
): datatype is FunctionDatatype<DataType> => {
  return typeof datatype === "object" && datatype.type === "FunctionDataType";
};

export const isUnknownVariable = <DataType>(
  dataType: AllDataType<DataType>
): dataType is UnknownVariable => {
  return typeof dataType === "object" && dataType.type === "UnknownVariable";
};
