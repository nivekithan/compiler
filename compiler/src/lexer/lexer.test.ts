import { convertToTokens } from "./lexer";
import { Token } from "./tokens";

test("Testing Token", () => {
  const input = `
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
