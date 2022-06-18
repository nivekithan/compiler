import { KeywordTokens, Token } from "../lexer/tokens";
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
  IdentifierDatatype,
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
  StringDatatype,
  StringLiteralExp,
  UnknownVariable,
  VerticalBarBinaryExp,
  WhileLoopDeclaration,
} from "./base";

export type Ast =
  | ImportDeclaration<DataType>
  | VariableDeclarationAst
  | IdentifierAst<DataType>
  | ReAssignment<Expression, DataType>
  | Expression
  | BreakStatement
  | ContinueStatement
  | CondBlockDeclarationAst
  | WhileLoopDeclaration<Expression, Ast>
  | DoWhileLoopDeclaration<Expression, Ast>
  | FunctionDeclaration<Ast, DataType>
  | ReturnExp<Expression>
  | { type: "EOF" };

export type CondBlockDeclarationAst =
  | IfBlockDeclaration<Expression, Ast>
  | ElseBlockDeclaration<Ast>
  | ElseIfBlockDeclaration<Expression, Ast>;

export type VariableDeclarationAst =
  | ConstVariableDeclaration<Expression, DataType>
  | LetVariableDeclaration<Expression, DataType>;

export type Expression =
  | StringLiteralExp
  | IdentifierExp<DataType>
  | NumberLiteralExp
  | BooleanLiteralExp
  | ObjectLiteralExp<Expression, DataType>
  | ArrayLiteralExp<Expression, DataType>
  | UninaryExp
  | BinaryExp
  | BoxMemberAccessExp<Expression>
  | DotMemberAccessExp<Expression>
  | FunctionCall<Expression>;

export type UninaryExp =
  | PlusUninaryExp<Expression>
  | MinusUninaryExp<Expression>
  | BangUninaryExp<Expression>;

export type BinaryExp =
  | PlusBinaryExp<Expression>
  | MinusBinaryExp<Expression>
  | StarBinaryExp<Expression>
  | SlashBinaryExp<Expression>
  | VerticalBarBinaryExp<Expression>
  | CaretBinaryExp<Expression>
  | AmpersandBinaryExp<Expression>
  | StrictEqualityBinaryExp<Expression, DataType>
  | StrictNotEqualBinaryExp<Expression, DataType>
  | LessThanBinaryExp<Expression>
  | LessThanOrEqualBinaryExp<Expression>
  | GreaterThanBinaryExp<Expression>
  | GreaterThanOrEqualBinaryExp<Expression>;

export type DataType =
  | LiteralDataType
  | IdentifierDatatype
  | StringDatatype
  | ArrayDatatype<DataType>
  | ObjectDatatype<DataType>
  | FunctionDatatype<DataType>
  | UnknownVariable;
