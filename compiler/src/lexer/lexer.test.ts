import { convertToTokens } from "./lexer";
import { Token } from "./tokens";

test("Testing Token", () => {
  const input = "===";

  const output = convertToTokens(input);

  expect(output).toEqual([Token.Assign, Token.Assign, Token.Assign]);
});
