export type Tokens = Token;

export enum Token {
  // Assignment operators
  Assign = "Assign", // =
  PlusAssign = "PlusAssign", // +4=
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
