import { KeywordTokens, Token } from "../lexer/tokens";

export type Ast =
  | ImportDeclaration
  | VariableDeclaration
  | IdentifierAst
  | ReAssignment
  | Expression
  | BreakStatement
  | ContinueStatement
  | CondBlockDeclaration
  | WhileLoopDeclaration
  | DoWhileLoopDeclaration
  | FunctionDeclaration
  | ReturnExp
  | { type: "EOF" };

export type WhileLoopDeclaration = {
  type: "WhileLoopDeclaration";
  condition: Expression;
  blocks: Ast[];
};

export type DoWhileLoopDeclaration = {
  type: "DoWhileLoopDeclaration";
  condition: Expression;
  blocks: Ast[];
};

export type ImportDeclaration = {
  type: "importDeclaration";
  from: string;
  importedIdentifires: IdentifierAst[];
};

export type CondBlockDeclaration =
  | IfBlockDeclaration
  | ElseBlockDeclaration
  | ElseIfBlockDeclaration
  | TypeCheckedIfBlockDeclaration;

export type IfBlockDeclaration = {
  type: "IfBlockDeclaration";
  condition: Expression;
  blocks: Ast[];
};

export type ElseBlockDeclaration = {
  type: "ElseBlockDeclaration";
  blocks: Ast[];
};

export type ElseIfBlockDeclaration = {
  type: "ElseIfBlockDeclaration";
  condition: Expression;
  blocks: Ast[];
};

export type TypeCheckedIfBlockDeclaration = {
  type: "typeCheckedIfBlockDeclaration";
  ifBlock: IfBlockDeclaration;
  elseIfBlocks: ElseIfBlockDeclaration[];
  elseBlock?: ElseBlockDeclaration;
};

export type VariableDeclaration =
  | ConstVariableDeclaration
  | LetVariableDeclaration;

export type ConstVariableDeclaration = {
  type: "constVariableDeclaration";
  identifierName: string;
  exp: Expression;
  datatype: DataType;
  export: boolean;
};

export type LetVariableDeclaration = {
  type: "letVariableDeclaration";
  identifierName: string;
  exp: Expression;
  datatype: DataType;
  export: boolean;
};

export type IdentifierAst = {
  type: "identifier";
  name: string;
  dataType: DataType;
};

export type ReAssignment = {
  type: "ReAssignment";
  path: ReAssignmentPath;
  assignmentOperator:
    | Token.Assign
    | Token.PlusAssign
    | Token.StarAssign
    | Token.SlashAssign
    | Token.MinusAssign;
  exp: Expression;
};

// LHS of Reassignment statement
export type ReAssignmentPath = IdentifierPath | DotMemberPath | BoxMemberPath;

export type IdentifierPath = { type: "IdentifierPath"; name: string };
export type DotMemberPath = {
  type: "DotMemberPath";
  leftPath: ReAssignmentPath;
  leftDataType: DataType;
  rightPath: string;
};
export type BoxMemberPath = {
  type: "BoxMemberPath";
  leftPath: ReAssignmentPath;
  leftBaseType: DataType;
  accessExp: Expression;
};

export type BreakStatement = { type: KeywordTokens.Break };
export type ContinueStatement = { type: KeywordTokens.Continue };

export type Expression =
  | CharLiteralExp
  | StringLiteralExp
  | IdentifierExp
  | NumberLiteralExp
  | BooleanLiteralExp
  | ObjectLiteralExp
  | ArrayLiteralExp
  | UninaryExp
  | BinaryExp
  | BoxMemberAccessExp
  | DotMemberAccessExp
  | FunctionCall;

export type StringLiteralExp = { type: "string"; value: string };
export type CharLiteralExp = { type: "char"; value: string };
export type NumberLiteralExp = { type: "number"; value: number };
export type BooleanLiteralExp = { type: "boolean"; value: boolean };
export type IdentifierExp = {
  type: "identifier";
  name: string;
  datatype: DataType;
};
export type ObjectLiteralExp = {
  type: "object";
  keys: [string, Expression][];
  datatype: DataType;
};
export type ArrayLiteralExp = {
  type: "array";
  exps: Expression[];
  datatype: DataType;
};

export type UninaryExp = PlusUninaryExp | MinusUninaryExp | BangUninaryExp;

export type PlusUninaryExp = { type: Token.Plus; argument: Expression };
export type MinusUninaryExp = { type: Token.Minus; argument: Expression };
export type BangUninaryExp = { type: Token.Bang; argument: Expression };

export type BinaryExp =
  | PlusBinaryExp
  | MinusBinaryExp
  | StarBinaryExp
  | SlashBinaryExp
  | VerticalBarBinaryExp
  | CaretBinaryExp
  | AmpersandBinaryExp
  | StrictEqualityBinaryExp
  | StrictNotEqualBinaryExp
  | LessThanBinaryExp
  | LessThanOrEqualBinaryExp
  | GreaterThanBinaryExp
  | GreaterThanOrEqualBinaryExp;

export type PlusBinaryExp = {
  type: Token.Plus;
  left: Expression;
  right: Expression;
};

export type MinusBinaryExp = {
  type: Token.Minus;
  left: Expression;
  right: Expression;
};
export type StarBinaryExp = {
  type: Token.Star;
  left: Expression;
  right: Expression;
};

export type SlashBinaryExp = {
  type: Token.Slash;
  left: Expression;
  right: Expression;
};
export type VerticalBarBinaryExp = {
  type: Token.VerticalBar;
  left: Expression;
  right: Expression;
};
export type CaretBinaryExp = {
  type: Token.Caret;
  left: Expression;
  right: Expression;
};
export type AmpersandBinaryExp = {
  type: Token.Ampersand;
  left: Expression;
  right: Expression;
};
export type StrictEqualityBinaryExp = {
  type: Token.StrictEquality;
  left: Expression;
  right: Expression;
  datatype?: DataType;
};
export type StrictNotEqualBinaryExp = {
  type: Token.StrictNotEqual;
  left: Expression;
  right: Expression;
  datatype?: DataType;
};
export type LessThanBinaryExp = {
  type: Token.LessThan;
  left: Expression;
  right: Expression;
};
export type LessThanOrEqualBinaryExp = {
  type: Token.LessThanOrEqual;
  left: Expression;
  right: Expression;
};
export type GreaterThanBinaryExp = {
  type: Token.GreaterThan;
  left: Expression;
  right: Expression;
};
export type GreaterThanOrEqualBinaryExp = {
  type: Token.GreaterThanOrEqual;
  left: Expression;
  right: Expression;
};

export type BoxMemberAccessExp = {
  type: "BoxMemberAccess";
  left: Expression;
  right: Expression;
};

export type DotMemberAccessExp = {
  type: "DotMemberAccess";
  left: Expression;
  right: string;
};

export type FunctionCall = {
  type: "FunctionCall";
  left: Expression;
  arguments: Expression[];
};

export type DataType =
  | LiteralDataType
  | IdentifierDatatype
  | ArrayDatatype
  | ObjectDatatype
  | FunctionDatatype
  | UnknownVariable;

export enum LiteralDataType {
  Boolean = "Boolean",
  String = "String",
  Number = "Number",
  Unknown = "Unknown",
  NotCalculated = "NotCalculated",
  Char = "Char",
}

export type UnknownVariable = {
  type: "UnknownVariable";
  varName: string;
};

export type IdentifierDatatype = {
  type: "IdentifierDatatype";
  name: string;
};

export type ArrayDatatype = {
  type: "ArrayDataType";
  baseType: DataType;
  numberOfElements?: number; // Counting starts of 1
};

export type ObjectDatatype = {
  type: "ObjectDataType";
  keys: { [name: string]: DataType | undefined };
};

export type FunctionDatatype = {
  type: "FunctionDataType";
  arguments: { [index: string]: DataType | undefined };
  returnType: DataType;
};

export type FunctionDeclaration = {
  type: "FunctionDeclaration";
  name: string;
  arguments: [string, DataType][];
  returnType: DataType;
  blocks: Ast[];
  export: boolean;
};

export type ReturnExp = {
  type: "ReturnExpression";
  exp: Expression | null;
};
