import { convertToTokens } from "./lexer";
import { KeywordTokens, Token } from "./tokens";

test("Testing Token", () => {
  const input = `
  ;
  :
  .
  ,
  {
  }
  (
  )
  [
  ]
  |
  ^
  &
  <
  <=
  >
  >=
  !
  !=
  !==
  /
  /=
  *
  *=
  -
  -=
  +
  +=
  ===
  ==
  =
  =>
  =>=
  ====
  ===+
  ==-
  =-
  ////
  /====
  ****
  *===
  ----
  -====
  +++++
  +====
  !====
  !*
  !=*
  <*
  <=*
  >*
  >=*`;

  const output = convertToTokens(input);

  expect(output).toEqual([
    Token.SemiColon,
    Token.Colon,
    Token.Dot,
    Token.Comma,
    Token.AngleOpenBracket,
    Token.AngleCloseBracket,
    Token.CurveOpenBracket,
    Token.CurveCloseBracket,
    Token.BoxOpenBracket,
    Token.BoxCloseBracket,
    Token.VerticalBar,
    Token.Caret,
    Token.Ampersand,
    Token.LessThan,
    Token.LessThanOrEqual,
    Token.GreaterThan,
    Token.GreaterThanOrEqual,
    Token.Bang,
    Token.NotEqual,
    Token.StrictNotEqual,
    Token.Slash,
    Token.SlashAssign,
    Token.Star,
    Token.StarAssign,
    Token.Minus,
    Token.MinusAssign,
    Token.Plus,
    Token.PlusAssign,
    Token.StrictEquality,
    Token.Equality,
    Token.Assign,
    Token.FunctionArrow,
    Token.Illegal,
    Token.Illegal,
    Token.Illegal,
    Token.Illegal,
    Token.Illegal,
    Token.Illegal,
    Token.Illegal,
    Token.Illegal,
    Token.Illegal,
    Token.Illegal,
    Token.Illegal,
    Token.Illegal,
    Token.Illegal,
    Token.Illegal,
    Token.Illegal,
    Token.Illegal,
    Token.Illegal,
    Token.Illegal,
    Token.Illegal,
    Token.Illegal,
  ]);
});

test("Testing Literal Token", () => {
  const input = `
  "Hello World!"
   23232
   true
   false
  `;

  const output = convertToTokens(input);
  expect(output).toEqual<typeof output>([
    { type: "string", value: "Hello World!" },
    { type: "number", value: 23232 },
    { type: "boolean", value: true },
    { type: "boolean", value: false },
  ]);
});

test("Testing keyword Token", () => {
  const input = `
  const
  let
  if
  else
  while
  do
  break
  continue
  function
  return
  import
  from
  export
  `;

  const output = convertToTokens(input);
  expect(output).toEqual<typeof output>([
    KeywordTokens.Const,
    KeywordTokens.Let,
    KeywordTokens.If,
    KeywordTokens.Else,
    KeywordTokens.While,
    KeywordTokens.Do,
    KeywordTokens.Break,
    KeywordTokens.Continue,
    KeywordTokens.Function,
    KeywordTokens.Return,
    KeywordTokens.Import,
    KeywordTokens.From,
    KeywordTokens.Export,
  ]);
});

test("Testing Identifier Token", () => {
  const input = `
  hello1
  _hello1
  $hello1
  hello$world1
  hello_world1
  `;

  const output = convertToTokens(input);
  expect(output).toEqual<typeof output>([
    { type: "identifier", value: "hello1" },
    { type: "identifier", value: "_hello1" },
    { type: "identifier", value: "$hello1" },
    { type: "identifier", value: "hello$world1" },
    { type: "identifier", value: "hello_world1" },
  ]);
});
