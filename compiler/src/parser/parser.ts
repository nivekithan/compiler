import { IdentifierToken, KeywordTokens, Token, Tokens } from "../lexer/tokens";
import {
  Ast,
  ConstVariableDeclaration,
  DataType,
  Expression,
  IdentifierAst,
  ImportDeclaration,
} from "./ast";

export const convertToAst = (tokens: Tokens[]): Ast[] => {
  const Parser = new ParserFactory(tokens);
  const asts: Ast[] = [];

  while (true) {
    const ast = Parser.getNextAst();

    if (ast.type === "EOF") {
      break;
    }

    asts.push(ast);
  }

  return asts;
};
export class ParserFactory {
  content: Tokens[];
  curPos: number | null;

  constructor(content: Tokens[]) {
    this.content = content;
    this.curPos = 0;
  }

  getNextAst(): Ast {
    const curToken = this.getCurToken();

    if (curToken === null) return { type: "EOF" };
    if (curToken === KeywordTokens.Import) return this.parseImportDeclaration();
    if (curToken === KeywordTokens.Const)
      return this.parseVariableDeclaration();

    throw Error(`This token cannot be parsed: ${curToken}`);
  }

  /**
   * Expect curToken to be Keyword.Const
   *
   */

  parseVariableDeclaration(): ConstVariableDeclaration {
    const curToken = this.getCurToken();

    if (curToken !== KeywordTokens.Const)
      throw Error("Expected curToken be keyword.const");

    this.next(); // consumes const

    const identifierToken = this.getCurToken();

    if (identifierToken === null || !isIdentifier(identifierToken))
      throw Error("Expected Identifier token next to Keyword.const");

    this.next(); // consumes identifier

    this.assertCurToken(Token.Assign);
    this.next(); // consumes =

    const exp = this.parseExpression();

    const constVariableDeclarationAst: ConstVariableDeclaration = {
      type: "constVariableDeclaration",
      identifierName: identifierToken.value,
      datatype: DataType.NotCalculated,
      exp,
    };

    this.skipSemiColon();

    return constVariableDeclarationAst;
  }

  /**
   * Expect curToken to be KeyWord.Import
   */

  parseImportDeclaration(): ImportDeclaration {
    const curToken = this.getCurToken();

    if (curToken !== KeywordTokens.Import)
      throw Error("Expected curToken to be KeyWord.Import");

    this.next(); // consumes import
    this.assertCurToken(Token.AngleOpenBracket);
    this.next(); // consumes {

    const identifiers: IdentifierAst[] = [];

    while (this.getCurToken() !== Token.AngleCloseBracket) {
      const curToken = this.getCurToken();
      if (curToken === null || !isIdentifier(curToken))
        throw Error(
          `Expected token to be Identifier but instead got ${curToken}`
        );

      const identifierName = curToken.value;
      const identifierAst: IdentifierAst = {
        type: "identifier",
        name: identifierName,
        dataType: DataType.NotCalculated,
      };
      identifiers.push(identifierAst);

      this.next(); // consumes Identifier

      const isCurTokenComma = this.isCurToken(Token.Comma);

      if (isCurTokenComma) {
        this.next(); // consumes Comma
      } else {
        this.assertCurToken(Token.AngleCloseBracket);
      }
    }

    this.next(); // consume AngleCloseBracket
    this.assertCurToken(KeywordTokens.From);
    this.next(); // consumes From

    const fileNameToken = this.getCurToken();

    if (fileNameToken === null || !isStringLiteral(fileNameToken))
      throw Error(
        "Expected token to be String literal but instead got " + fileNameToken
      );

    const fileName = fileNameToken.value;
    this.next(); // consume stringLiteral
    this.skipSemiColon();
    return {
      type: "importDeclaration",
      from: fileName,
      importedIdentifires: identifiers,
    };
  }

  parseExpression(precedence: number = 1): Expression {
    let prefixExp = this.parsePrefixExp();

    if (prefixExp === null)
      throw Error(
        `There is no prefix token associated with token ${this.getCurToken()}`
      );

    const nextToken = this.getCurToken();

    while (
      nextToken !== Token.SemiColon &&
      nextToken !== null &&
      precedence > this.getNonPrefixPrecedence(nextToken)
    ) {
      const nonPrefixExp = this.parseNonPrefixExp(prefixExp);

      if (nonPrefixExp !== null) {
        prefixExp = nonPrefixExp;
      }
    }

    return prefixExp;
  }

  parsePrefixExp(): Expression | null {
    const curToken = this.getCurToken();

    if (curToken === null) return null;

    if (isStringLiteral(curToken)) {
      this.next(); // consumes StringLiteral
      return curToken;
    } else if (isIdentifier(curToken)) {
      this.next(); // consumes Identifier
      return { type: "identifier", name: curToken.value };
    } else if (isNumberLiteral(curToken)) {
      this.next(); // consumes NumberLiteral
      return { type: "number", value: curToken.value };
    } else if (isBooleanLiteral(curToken)) {
      this.next(); // consumes Boolean
      return { type: "boolean", value: curToken.value };
    }

    return null;
  }

  parseNonPrefixExp(left: Expression): Expression | null {
    return null;
  }

  getNonPrefixPrecedence(token: Tokens): number {
    return 1;
  }

  skipSemiColon() {
    const isSemiColon = this.isCurToken(Token.SemiColon);

    if (isSemiColon) {
      this.next(); // consumes ;
    }
  }

  next() {
    if (this.curPos === null || this.curPos >= this.content.length - 1) {
      this.curPos = null;
    } else {
      this.curPos++;
    }
  }

  assertCurToken(token: Tokens) {
    const isCurToken = this.isCurToken(token);

    if (!isCurToken)
      throw Error(
        `Expected curToken to be ${token} but got ${this.getCurToken()}`
      );
  }

  isCurToken(token: Tokens): boolean {
    const curToken = this.getCurToken();

    if (curToken === null) return false;

    return curToken === token;
  }

  getCurToken(): Tokens | null {
    if (this.curPos === null) return null;

    const token = this.content[this.curPos];

    if (token === undefined)
      throw Error("Expected this.curPos always in bounds of this.content");

    return token;
  }
}

const isIdentifier = (token: Tokens): token is IdentifierToken => {
  if (typeof token === "object" && token.type === "identifier") return true;
  return false;
};

const isStringLiteral = (
  token: Tokens
): token is { type: "string"; value: string } => {
  if (typeof token === "object" && token.type === "string") return true;
  return false;
};

const isNumberLiteral = (
  token: Tokens
): token is { type: "number"; value: number } => {
  if (typeof token === "object" && token.type === "number") return true;
  return false;
};

const isBooleanLiteral = (
  token: Tokens
): token is { type: "boolean"; value: boolean } => {
  if (typeof token === "object" && token.type === "boolean") return true;
  return false;
};
