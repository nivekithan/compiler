import { convertToTokens } from "./lexer";
import { Token } from "./tokens";

test("Testing Token", () => {
  const input = `
  ===
  ==
  =
  =>
  =>=
  ====
  ===+
  ==-
  =-
  `;

  const output = convertToTokens(input);


  expect(output).toEqual([
    Token.StrictEquality,
    Token.Equality,
    Token.Assign,
    Token.FunctionArrow,
    Token.Illegal,
    Token.Illegal,
    Token.Illegal,
    Token.Illegal,
    Token.Illegal,
  ]);
});
