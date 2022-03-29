import { IdentifierToken, KeywordTokens, Token, Tokens } from "../lexer/tokens";
import {
  Ast,
  BinaryExp,
  ConstVariableDeclaration,
  DataType,
  Expression,
  IdentifierAst,
  ImportDeclaration,
  UninaryExp,
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

    while (
      (() => {
        const nextToken = this.getCurToken();

        return (
          nextToken !== Token.SemiColon &&
          nextToken !== null &&
          precedence < this.getNonPrefixPrecedence(nextToken)
        );
      })()
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
    } else if (
      curToken === Token.Plus ||
      curToken === Token.Minus ||
      curToken === Token.Bang
    ) {
      return this.parseGenericUninaryExpression(curToken);
    } else if (curToken === Token.CurveOpenBracket) {
      this.next(); // consumes (

      const groupedExp = this.parseExpression();

      this.assertCurToken(Token.CurveCloseBracket);
      this.next(); // consumes )

      return groupedExp;
    }

    return null;
  }

  parseNonPrefixExp(left: Expression): Expression | null {
    const curToken = this.getCurToken();

    if (curToken === null) return null;

    if (
      curToken === Token.Plus ||
      curToken === Token.Minus ||
      curToken === Token.Star ||
      curToken === Token.Slash ||
      curToken === Token.VerticalBar ||
      curToken === Token.Caret ||
      curToken === Token.Ampersand ||
      curToken === Token.StrictEquality ||
      curToken === Token.StrictNotEqual ||
      curToken === Token.LessThan ||
      curToken === Token.LessThanOrEqual ||
      curToken === Token.GreaterThan ||
      curToken === Token.GreaterThanOrEqual
    ) {
      return this.parseGenericBinaryExpression(curToken, left);
    }

    return null;
  }

  parseGenericUninaryExpression(token: UninaryExp["type"]): UninaryExp {
    this.next(); // consumes token

    const nextExp = this.parseExpression(this.getPrefixPrecedence(token));
    return { type: token, argument: nextExp };
  }

  parseGenericBinaryExpression(
    token: BinaryExp["type"],
    left: Expression
  ): BinaryExp {

    this.next(); // consumes token
    const nextExp = this.parseExpression(this.getNonPrefixPrecedence(token));
    return { type: token, left, right: nextExp };
  }

  getPrefixPrecedence(token: Tokens): number {
    const prefixPrecendance: { [index: string]: number | undefined } = {
      [Token.Plus]: 17,
      [Token.Minus]: 17,
      [Token.Bang]: 17,
    };

    if (typeof token === "string") {
      const precedence = prefixPrecendance[token];

      if (precedence === undefined) return 1;

      return precedence;
    } else {
      return 1;
    }
  }

  getNonPrefixPrecedence(token: Tokens): number {
    const nonPrefixPrecedence: { [index: string]: number | undefined } = {
      [Token.BoxOpenBracket]: 20,
      [Token.Dot]: 20,
      [Token.CurveOpenBracket]: 20,

      [Token.Star]: 15,
      [Token.Slash]: 15,

      [Token.Plus]: 14,
      [Token.Minus]: 14,

      [Token.LessThan]: 12,
      [Token.LessThanOrEqual]: 12,
      [Token.GreaterThan]: 12,
      [Token.GreaterThanOrEqual]: 12,

      [Token.StrictEquality]: 11,
      [Token.StrictNotEqual]: 11,

      [Token.Ampersand]: 10,
      [Token.Caret]: 9,
      [Token.VerticalBar]: 8,
    };

    if (typeof token === "string") {
      const precedence = nonPrefixPrecedence[token];

      if (precedence === undefined) return 1;

      return precedence;
    } else {
      return 1;
    }
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