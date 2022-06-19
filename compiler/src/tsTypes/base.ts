import { KeywordTokens, Token } from "../lexer/tokens";
import { Ast, Expression } from "./ast";

export interface WhileLoopDeclaration<ExpType, BlockType> {
  type: "WhileLoopDeclaration";
  condition: ExpType;
  blocks: BlockType[];
}

export interface DoWhileLoopDeclaration<ExpType, BlockType> {
  type: "DoWhileLoopDeclaration";
  condition: ExpType;
  blocks: BlockType[];
}

export interface ImportDeclaration<DataType> {
  type: "importDeclaration";
  from: string;
  importedIdentifires: IdentifierAst<DataType>[];
}

export interface IdentifierAst<DataType> {
  type: "identifier";
  name: string;
  dataType: DataType;
}

export interface IfBlockDeclaration<ExpType, BlockType> {
  type: "IfBlockDeclaration";
  condition: ExpType;
  blocks: BlockType[];
}

export interface ElseBlockDeclaration<BlockType> {
  type: "ElseBlockDeclaration";
  blocks: BlockType[];
}

export interface ElseIfBlockDeclaration<ExpType, BlockType> {
  type: "ElseIfBlockDeclaration";
  condition: ExpType;
  blocks: BlockType[];
}

export interface ConstVariableDeclaration<ExpType, DataType> {
  type: "constVariableDeclaration";
  identifierName: string;
  exp: ExpType;
  datatype: DataType;
  export: boolean;
}

export interface LetVariableDeclaration<ExpType, DataType> {
  type: "letVariableDeclaration";
  identifierName: string;
  exp: ExpType;
  datatype: DataType;
  export: boolean;
}

export interface FunctionDeclaration<BLockType, DataType> {
  type: "FunctionDeclaration";
  name: string;
  arguments: [string, DataType][];
  returnType: DataType;
  blocks: BLockType[];
  export: boolean;
}

export interface ReAssignment<ExpType, DataType> {
  type: "ReAssignment";
  path: ReAssignmentPath<ExpType, DataType>;
  assignmentOperator:
    | Token.Assign
    | Token.PlusAssign
    | Token.StarAssign
    | Token.SlashAssign
    | Token.MinusAssign;
  exp: ExpType;
}

// LHS of Reassignment statement
export type ReAssignmentPath<ExpType, DataType> =
  | IdentifierPath
  | DotMemberPath<ExpType, DataType>
  | BoxMemberPath<ExpType, DataType>;

export type IdentifierPath = { type: "IdentifierPath"; name: string };

export type DotMemberPath<ExpType, DataType> = {
  type: "DotMemberPath";
  leftPath: ReAssignmentPath<ExpType, DataType>;
  leftDataType: DataType;
  rightPath: string;
};

export interface BoxMemberPath<ExpType, DataType> {
  type: "BoxMemberPath";
  leftPath: ReAssignmentPath<ExpType, DataType>;
  leftBaseType: DataType;
  accessExp: ExpType;
}

export interface BreakStatement {
  type: KeywordTokens.Break;
}
export interface ContinueStatement {
  type: KeywordTokens.Continue;
}

export interface CharLiteralExp {
  type: "char";
  value: string; // string.length has to be one
}
export interface StringLiteralExp {
  type: "string";
  value: string;
}
export interface NumberLiteralExp {
  type: "number";
  value: number;
}
export interface BooleanLiteralExp {
  type: "boolean";
  value: boolean;
}
export interface IdentifierExp<DataType> {
  type: "identifier";
  name: string;
  datatype: DataType;
}
export interface ObjectLiteralExp<ExpType, DataType> {
  type: "object";
  keys: [string, ExpType][];
  datatype: DataType;
}
export interface ArrayLiteralExp<ExpType, DataType> {
  type: "array";
  exps: ExpType[];
  datatype: DataType;
}

export interface PlusUninaryExp<ExpType> {
  type: Token.Plus;
  argument: ExpType;
}
export interface MinusUninaryExp<ExpType> {
  type: Token.Minus;
  argument: ExpType;
}
export interface BangUninaryExp<ExpType> {
  type: Token.Bang;
  argument: ExpType;
}

export interface PlusBinaryExp<ExpType> {
  type: Token.Plus;
  left: ExpType;
  right: ExpType;
}

export interface MinusBinaryExp<ExpType> {
  type: Token.Minus;
  left: ExpType;
  right: ExpType;
}
export interface StarBinaryExp<ExpType> {
  type: Token.Star;
  left: ExpType;
  right: ExpType;
}

export interface SlashBinaryExp<ExpType> {
  type: Token.Slash;
  left: ExpType;
  right: ExpType;
}
export interface VerticalBarBinaryExp<ExpType> {
  type: Token.VerticalBar;
  left: ExpType;
  right: ExpType;
}
export interface CaretBinaryExp<ExpType> {
  type: Token.Caret;
  left: ExpType;
  right: ExpType;
}
export interface AmpersandBinaryExp<ExpType> {
  type: Token.Ampersand;
  left: ExpType;
  right: ExpType;
}
export interface StrictEqualityBinaryExp<ExpType, DataType> {
  type: Token.StrictEquality;
  left: ExpType;
  right: ExpType;
}
export interface StrictNotEqualBinaryExp<ExpType, DataType> {
  type: Token.StrictNotEqual;
  left: ExpType;
  right: ExpType;
}
export interface LessThanBinaryExp<ExpType> {
  type: Token.LessThan;
  left: ExpType;
  right: ExpType;
}
export interface LessThanOrEqualBinaryExp<ExpType> {
  type: Token.LessThanOrEqual;
  left: ExpType;
  right: ExpType;
}
export interface GreaterThanBinaryExp<ExpType> {
  type: Token.GreaterThan;
  left: ExpType;
  right: ExpType;
}
export interface GreaterThanOrEqualBinaryExp<ExpType> {
  type: Token.GreaterThanOrEqual;
  left: ExpType;
  right: ExpType;
}

export interface BoxMemberAccessExp<ExpType> {
  type: "BoxMemberAccess";
  left: ExpType;
  right: ExpType;
}

export interface DotMemberAccessExp<ExpType> {
  type: "DotMemberAccess";
  left: ExpType;
  right: string;
}

export interface FunctionCall<ExpType> {
  type: "FunctionCall";
  left: ExpType;
  arguments: ExpType[];
}

export interface ReturnExp<Expression> {
  type: "ReturnExpression";
  exp: Expression | null;
}

export interface BooleanDataType {
  type: "BooleanDataType";
}

export interface NumberDatatype {
  type: "NumberDatatype";
}

export interface CharDatatype {
  type: "CharDatatype";
}

export interface UnknownDatatype {
  type: "UnknownDatatype";
}

export interface NotCalculatedDatatype {
  type: "NotCalculatedDatatype";
}

export interface StringDatatype {
  type: "StringDatatype";
  length: number;
}

export interface UnknownVariable {
  type: "UnknownVariable";
  varName: string;
}

export interface IdentifierDatatype {
  type: "IdentifierDatatype";
  name: string;
}

export interface ArrayDatatype<DataType> {
  type: "ArrayDataType";
  baseType: DataType;
  numberOfElements?: number; // Counting starts of 1
}

export interface ObjectDatatype<DataType> {
  type: "ObjectDataType";
  keys: { [name: string]: DataType | undefined };
}

export interface FunctionDatatype<DataType> {
  type: "FunctionDataType";
  arguments: { [index: string]: DataType | undefined };
  returnType: DataType;
}

export interface TypeCheckedIfBlockDeclaration<ExpType, BlockType> {
  type: "typeCheckedIfBlockDeclaration";
  ifBlock: IfBlockDeclaration<ExpType, BlockType>;
  elseIfBlocks: ElseIfBlockDeclaration<ExpType, BlockType>[];
  elseBlock?: ElseBlockDeclaration<BlockType>;
}
