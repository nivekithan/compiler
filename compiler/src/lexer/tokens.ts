export type Tokens = Token | LiteralToken | KeywordTokens | IdentifierToken;

export enum Token {
  // Assignment operators
  Assign = "Assign", // =
  PlusAssign = "PlusAssign", // +=
  MinusAssign = "MinusAssign", // -=
  StarAssign = "StarAssign", // *=
  SlashAssign = "SlashAssign", // /=

  // Comparison operators
  Equality = "Equality", // ==
  StrictEquality = "StrictEquality", // ===

  NotEqual = "NotEqual", // !=
  StrictNotEqual = "StrictNotEqual", // !==

  LessThan = "LessThan", // <
  LessThanOrEqual = "LessThanOrEqual", // <=

  GreaterThan = "GreaterThan", // >
  GreaterThanOrEqual = "GreatherThanOrEqual", // >=

  SemiColon = "SemiColon", // ;
  Colon = "Colon", // :
  Dot = "Dot", // .
  Comma = "Comma", // ,
  FunctionArrow = "FunctionArrow", // =>

  AngleOpenBracket = "AngleOpenBracket", // {
  AngleCloseBracket = "AngleCloseBracket", // }

  CurveOpenBracket = "CurveOpenBracket", // (
  CurveCloseBracket = "CurveCloseBracket", // )

  BoxOpenBracket = "BoxOpenBracket", //  [
  BoxCloseBracket = "BoxCloseBracket", // ]

  Bang = "Bang", // !

  Plus = "Plus", // +
  Minus = "Minus", // -
  Star = "Star", // *
  Slash = "Slash", // /

  VerticalBar = "VerticalBer", // |
  Caret = "Caret", // ^
  Ampersand = "Ampersand", // &

  Illegal = "Illegal", // Unknown token
  EOF = "EOF", // End of File
}

export type LiteralToken =
  | { type: "string"; value: string }
  | { type: "number"; value: number }
  | { type: "boolean"; value: boolean };

export type IdentifierToken = { type: "identifier"; value: string };

export enum KeywordTokens {
  Const = "Const",
  Let = "Let",
  If = "If",
  Else = "Else",
  While = "While",
  Do = "Do",
  Break = "Break",
  Continue = "Continue",
  Function = "Function",
  Return = "Return",
  Import = "Import",
  From = "From",
  Export = "Export",
}

