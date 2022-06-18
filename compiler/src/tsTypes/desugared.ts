import { Token } from "../lexer/tokens";
import {
  isAmpersandBinaryExp,
  isArrayDatatype,
  isArrayLiteralExp,
  isBangUniaryExp,
  isBooleanLiteralExp,
  isBoxMemberAccessExp,
  isCaretBinaryExp,
  isCharLiteralExp,
  isDotMemberAccessExp,
  isFunctionCallExp,
  isFunctionDatatype,
  isGreaterThanBinaryExp,
  isGreaterThanOrEqualBinaryExp,
  isIdentifierLiteralExp,
  isLessThanBinaryExp,
  isLessThanOrEqualBinaryExp,
  isMinusBinaryExp,
  isMinusUninaryExp,
  isNumberLiteralExp,
  isObjectDatatype,
  isObjectLiteralExp,
  isPlusBinaryExp,
  isPlusUninaryExp,
  isSlashBinaryExp,
  isStarBinaryExp,
  isStrictEqualityBinaryExp,
  isStrictNotEqualBinaryExp,
  isVerticalBarBinaryExp,
} from "./all";
import {
  AmpersandBinaryExp,
  ArrayDatatype,
  ArrayLiteralExp,
  BangUninaryExp,
  BooleanDataType,
  BooleanLiteralExp,
  BoxMemberAccessExp,
  BreakStatement,
  CaretBinaryExp,
  CharDatatype,
  CharLiteralExp,
  ConstVariableDeclaration,
  ContinueStatement,
  DotMemberAccessExp,
  DoWhileLoopDeclaration,
  FunctionCall,
  FunctionDatatype,
  FunctionDeclaration,
  GreaterThanBinaryExp,
  GreaterThanOrEqualBinaryExp,
  IdentifierAst,
  IdentifierExp,
  ImportDeclaration,
  LessThanBinaryExp,
  LessThanOrEqualBinaryExp,
  LetVariableDeclaration,
  MinusBinaryExp,
  MinusUninaryExp,
  NumberDatatype,
  NumberLiteralExp,
  ObjectDatatype,
  ObjectLiteralExp,
  PlusBinaryExp,
  PlusUninaryExp,
  ReAssignment,
  ReturnExp,
  SlashBinaryExp,
  StarBinaryExp,
  StrictEqualityBinaryExp,
  StrictNotEqualBinaryExp,
  StringLiteralExp,
  TypeCheckedIfBlockDeclaration,
  VerticalBarBinaryExp,
  WhileLoopDeclaration,
} from "./base";

export type DeSugaredAst =
  | ImportDeclaration<DeSugaredDatatype>
  | DeSugaredVariableDecalaration
  | IdentifierAst<DeSugaredDatatype>
  | ReAssignment<DeSugaredExpression, DeSugaredDatatype>
  | DeSugaredExpression
  | BreakStatement
  | ContinueStatement
  | WhileLoopDeclaration<DeSugaredExpression, DeSugaredAst>
  | DoWhileLoopDeclaration<DeSugaredExpression, DeSugaredAst>
  | FunctionDeclaration<DeSugaredAst, DeSugaredDatatype>
  | ReturnExp<DeSugaredExpression>
  | TypeCheckedIfBlockDeclaration<DeSugaredExpression, DeSugaredAst>
  | { type: "EOF" };

export type DeSugaredVariableDecalaration =
  | ConstVariableDeclaration<DeSugaredExpression, DeSugaredDatatype>
  | LetVariableDeclaration<DeSugaredExpression, DeSugaredDatatype>;

export type DeSugaredExpression =
  | CharLiteralExp
  | IdentifierExp<DeSugaredDatatype>
  | NumberLiteralExp
  | BooleanLiteralExp
  | ObjectLiteralExp<DeSugaredExpression, DeSugaredDatatype>
  | ArrayLiteralExp<DeSugaredExpression, DeSugaredDatatype>
  | UninaryExp
  | BinaryExp
  | BoxMemberAccessExp<DeSugaredExpression>
  | DotMemberAccessExp<DeSugaredExpression>
  | FunctionCall<DeSugaredExpression>;

export type UninaryExp =
  | PlusUninaryExp<DeSugaredExpression>
  | MinusUninaryExp<DeSugaredExpression>
  | BangUninaryExp<DeSugaredExpression>;

export type BinaryExp =
  | PlusBinaryExp<DeSugaredExpression>
  | MinusBinaryExp<DeSugaredExpression>
  | StarBinaryExp<DeSugaredExpression>
  | SlashBinaryExp<DeSugaredExpression>
  | VerticalBarBinaryExp<DeSugaredExpression>
  | CaretBinaryExp<DeSugaredExpression>
  | AmpersandBinaryExp<DeSugaredExpression>
  | StrictEqualityBinaryExp<DeSugaredExpression, DeSugaredDatatype>
  | StrictNotEqualBinaryExp<DeSugaredExpression, DeSugaredDatatype>
  | LessThanBinaryExp<DeSugaredExpression>
  | LessThanOrEqualBinaryExp<DeSugaredExpression>
  | GreaterThanBinaryExp<DeSugaredExpression>
  | GreaterThanOrEqualBinaryExp<DeSugaredExpression>;

export type DeSugaredDatatype =
  | NumberDatatype
  | BooleanDataType
  | CharDatatype
  | ArrayDatatype<DeSugaredDatatype>
  | ObjectDatatype<DeSugaredDatatype>
  | FunctionDatatype<DeSugaredDatatype>;

export const getDataTypeOfDeSugaredExpression = (
  exp: DeSugaredExpression
): DeSugaredDatatype => {
  if (isNumberLiteralExp(exp)) {
    return { type: "NumberDatatype" };
  } else if (isBooleanLiteralExp(exp)) {
    return { type: "BooleanDataType" };
  } else if (isCharLiteralExp(exp)) {
    return { type: "CharDatatype" };
  } else if (isArrayLiteralExp(exp)) {
    return exp.datatype;
  } else if (isObjectLiteralExp(exp)) {
    return exp.datatype;
  } else if (isIdentifierLiteralExp(exp)) {
    return exp.datatype;
  } else if (isBoxMemberAccessExp(exp)) {
    const leftDataType = getDataTypeOfDeSugaredExpression(exp.left);

    if (!isArrayDatatype(leftDataType))
      throw new Error(
        `Expected left of BoxMemberAccess to be ArrayDataType but instead got ${leftDataType.type}`
      );

    return leftDataType.baseType;
  } else if (isDotMemberAccessExp(exp)) {
    const leftDataType = getDataTypeOfDeSugaredExpression(exp.left);

    if (!isObjectDatatype(leftDataType))
      throw new Error(
        `Expected left of DotMemberAccess to be ObjectDatatype but instead got ${leftDataType.type}`
      );

    const expDataType = leftDataType.keys[exp.right];

    if (expDataType === undefined)
      throw new Error(
        `Expected right of DotMemberAccess to be valid key, but instead got ${exp.right} `
      );

    return expDataType;
  } else if (isFunctionCallExp(exp)) {
    const leftDatatype = getDataTypeOfDeSugaredExpression(exp.left);

    if (!isFunctionDatatype(leftDatatype)) {
      throw new Error(
        `Expected left of FunctionCall to be functionDatatype but instead got ${leftDatatype.type}`
      );
    }

    return leftDatatype.returnType;
  } else if (isPlusUninaryExp(exp) || isMinusUninaryExp(exp)) {
    return { type: "NumberDatatype" };
  } else if (isBangUniaryExp(exp)) {
    return { type: "BooleanDataType" };
  } else if (
    isPlusBinaryExp(exp) ||
    isMinusBinaryExp(exp) ||
    isStarBinaryExp(exp) ||
    isSlashBinaryExp(exp) ||
    isVerticalBarBinaryExp(exp) ||
    isCaretBinaryExp(exp) ||
    isAmpersandBinaryExp(exp)
  ) {
    return { type: "NumberDatatype" };
  }

  if (
    isStrictEqualityBinaryExp(exp) ||
    isStrictNotEqualBinaryExp(exp) ||
    isGreaterThanBinaryExp(exp) ||
    isGreaterThanOrEqualBinaryExp(exp) ||
    isLessThanBinaryExp(exp) ||
    isLessThanOrEqualBinaryExp(exp)
  ) {
    return { type: "BooleanDataType" };
  }

  throw new Error(
    `It is not yet supported to get Datatype of expression ${exp}`
  );
};
