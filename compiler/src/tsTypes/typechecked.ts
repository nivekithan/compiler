import {
  AmpersandBinaryExp,
  ArrayDatatype,
  ArrayLiteralExp,
  BangUninaryExp,
  BooleanLiteralExp,
  BoxMemberAccessExp,
  BreakStatement,
  CaretBinaryExp,
  ConstVariableDeclaration,
  ContinueStatement,
  DotMemberAccessExp,
  DoWhileLoopDeclaration,
  ElseBlockDeclaration,
  ElseIfBlockDeclaration,
  FunctionCall,
  FunctionDatatype,
  FunctionDeclaration,
  GreaterThanBinaryExp,
  GreaterThanOrEqualBinaryExp,
  IdentifierAst,
  IdentifierExp,
  IfBlockDeclaration,
  ImportDeclaration,
  LessThanBinaryExp,
  LessThanOrEqualBinaryExp,
  LetVariableDeclaration,
  LiteralDataType,
  MinusBinaryExp,
  MinusUninaryExp,
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

export type TypeCheckedAst =
  | ImportDeclaration<TypeCheckedDatatype>
  | TypeCheckedVariableDecalaration
  | IdentifierAst<TypeCheckedDatatype>
  | ReAssignment<TypeCheckedExpression, TypeCheckedDatatype>
  | TypeCheckedExpression
  | BreakStatement
  | ContinueStatement
  | WhileLoopDeclaration<TypeCheckedExpression, TypeCheckedAst>
  | DoWhileLoopDeclaration<TypeCheckedExpression, TypeCheckedAst>
  | FunctionDeclaration<TypeCheckedAst, TypeCheckedDatatype>
  | ReturnExp<TypeCheckedExpression>
  | TypeCheckedIfBlockDeclaration<TypeCheckedExpression, TypeCheckedAst>
  | { type: "EOF" };

export type TypeCheckedVariableDecalaration =
  | ConstVariableDeclaration<TypeCheckedExpression, TypeCheckedDatatype>
  | LetVariableDeclaration<TypeCheckedExpression, TypeCheckedDatatype>;

export type TypeCheckedExpression =
  | StringLiteralExp
  | IdentifierExp<TypeCheckedDatatype>
  | NumberLiteralExp
  | BooleanLiteralExp
  | ObjectLiteralExp<TypeCheckedExpression, TypeCheckedDatatype>
  | ArrayLiteralExp<TypeCheckedExpression, TypeCheckedDatatype>
  | UninaryExp
  | BinaryExp
  | BoxMemberAccessExp<TypeCheckedExpression>
  | DotMemberAccessExp<TypeCheckedExpression>
  | FunctionCall<TypeCheckedExpression>;

export type UninaryExp =
  | PlusUninaryExp<TypeCheckedExpression>
  | MinusUninaryExp<TypeCheckedExpression>
  | BangUninaryExp<TypeCheckedExpression>;

export type BinaryExp =
  | PlusBinaryExp<TypeCheckedExpression>
  | MinusBinaryExp<TypeCheckedExpression>
  | StarBinaryExp<TypeCheckedExpression>
  | SlashBinaryExp<TypeCheckedExpression>
  | VerticalBarBinaryExp<TypeCheckedExpression>
  | CaretBinaryExp<TypeCheckedExpression>
  | AmpersandBinaryExp<TypeCheckedExpression>
  | StrictEqualityBinaryExp<TypeCheckedExpression, TypeCheckedDatatype>
  | StrictNotEqualBinaryExp<TypeCheckedExpression, TypeCheckedDatatype>
  | LessThanBinaryExp<TypeCheckedExpression>
  | LessThanOrEqualBinaryExp<TypeCheckedExpression>
  | GreaterThanBinaryExp<TypeCheckedExpression>
  | GreaterThanOrEqualBinaryExp<TypeCheckedExpression>;

export type TypeCheckedDatatype =
  | Exclude<
      LiteralDataType,
      LiteralDataType.NotCalculated | LiteralDataType.Unknown
    >
  | ArrayDatatype<TypeCheckedDatatype>
  | ObjectDatatype<TypeCheckedDatatype>
  | FunctionDatatype<TypeCheckedDatatype>;
