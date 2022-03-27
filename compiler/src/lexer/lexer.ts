import { Token, Tokens } from "./tokens";

// Given an a string will return Lexer tokens
export const convertToTokens = (content: string): Tokens[] => {
  const chars = Array.from(content);
  const tokens: Tokens[] = [];

  for (const char of chars) {
    if (char == "=") {
      tokens.push(Token.Assign);
    }
  }

  return tokens;
};
