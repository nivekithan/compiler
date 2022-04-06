import { IdentifierToken, KeywordTokens, Token, Tokens } from "../lexer/tokens";
import {
  Ast,
  BinaryExp,
  CondBlockDeclaration,
  ConstVariableDeclaration,
  DataType,
  DoWhileLoopDeclaration,
  Expression,
  IdentifierAst,
  ImportDeclaration,
  LetVariableDeclaration,
  LiteralDataType,
  ReAssignment,
  ReAssignmentPath,
  ReturnExp,
  UninaryExp,
  VariableDeclaration,
  WhileLoopDeclaration,
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

  savedPos: number | null | "NOT SAVED";

  constructor(content: Tokens[]) {
    this.content = content;
    this.curPos = 0;
    this.savedPos = "NOT SAVED";
  }

  getNextAst(): Ast {
    const curToken = this.getCurToken();

    if (curToken === null) return { type: "EOF" };
    if (curToken === KeywordTokens.Import) return this.parseImportDeclaration();
    if (curToken === KeywordTokens.Const || curToken === KeywordTokens.Let)
      return this.parseVariableDeclaration();

    if (curToken === KeywordTokens.If) return this.parseCondBlock();
    if (curToken === KeywordTokens.Else) return this.parseCondBlock();
    if (curToken === KeywordTokens.While) return this.parseWhileLoop();
    if (curToken === KeywordTokens.Do) return this.parseDoWhileLoop();
    if (curToken === KeywordTokens.Export) return this.parseExportDeclaration();
    if (curToken === KeywordTokens.Function)
      return this.parseFunctionDeclaration();
    if (curToken === KeywordTokens.Return) return this.parseReturnExp();

    if (
      curToken === KeywordTokens.Break ||
      curToken === KeywordTokens.Continue
    ) {
      this.next(); // consumes Break or Continue;
      this.skipSemiColon();
      return { type: curToken };
    }

    if (isIdentifier(curToken)) {
      const reAssignmentStatement = this.tryParseReassignment();

      if (reAssignmentStatement !== null) return reAssignmentStatement;
    }

    const nakedExp = this.parseExpression();
    this.skipSemiColon();

    return nakedExp;
  }

  /**
   * Expects the curToken to be of KeyWord.Return
   */
  parseReturnExp(): ReturnExp {
    this.assertCurToken(KeywordTokens.Return);
    this.next(); // consumes Return

    const isSemiColon = this.isCurToken(Token.SemiColon);

    if (isSemiColon) {
      this.next(); // consumes ;
      return { type: "ReturnExpression", exp: null };
    } else {
      const exp = this.parseExpression();

      this.skipSemiColon();

      return { type: "ReturnExpression", exp };
    }
  }

  /**
   * Expects curToken to be of type FunctionDeclaration
   */
  parseFunctionDeclaration(): Ast {
    this.assertCurToken(KeywordTokens.Function);
    this.next(); // consumes function

    const functionIdentifier = this.getCurToken();

    if (functionIdentifier === null || !isIdentifier(functionIdentifier))
      throw Error("Expected identifier name after the function");

    this.next(); // consumes identifier

    const functionName = functionIdentifier.value;

    this.assertCurToken(Token.CurveOpenBracket);
    this.next();

    const functionArguments: [string, DataType][] = [];

    while (this.getCurToken() !== Token.CurveCloseBracket) {
      const argumentIdentifier = this.getCurToken();

      if (argumentIdentifier === null || !isIdentifier(argumentIdentifier))
        throw Error("Expected argument name");

      const argumentName = argumentIdentifier.value;

      this.next(); // consumes Identifier

      this.assertCurToken(Token.Colon);
      this.next(); // consumes :

      const argumentType = this.parseType();

      functionArguments.push([argumentName, argumentType]);

      if (this.isCurToken(Token.Comma)) {
        this.next(); // consumes ,
      } else {
        this.assertCurToken(Token.CurveCloseBracket);
      }
    }

    this.next(); // consumes )

    const isColon = this.isCurToken(Token.Colon);

    let returnType: DataType = LiteralDataType.NotCalculated;

    if (isColon) {
      this.next(); // consumes :

      returnType = this.parseType();
    }

    this.assertCurToken(Token.AngleOpenBracket);
    this.next(); // consumes {

    const asts: Ast[] = [];

    while (this.getCurToken() !== Token.AngleCloseBracket) {
      const ast = this.getNextAst();
      asts.push(ast);
    }

    this.next(); // consumes }

    this.skipSemiColon();

    return {
      type: "FunctionDeclaration",
      arguments: functionArguments,
      blocks: asts,
      name: functionName,
      returnType,
      export: false,
    };
  }

  /**
   * Expects the curToken to be Keyword.Expect
   */
  parseExportDeclaration(): Ast {
    this.assertCurToken(KeywordTokens.Export);
    this.next(); // consumes Export

    const nextAst = this.getNextAst();

    if (
      nextAst.type === "constVariableDeclaration" ||
      nextAst.type === "letVariableDeclaration" ||
      nextAst.type === "FunctionDeclaration"
    ) {
      if (nextAst.export) {
        throw Error("Cannot export already exported variable declaration");
      }

      nextAst.export = true;

      return nextAst;
    } else {
      throw Error("Can only use export keyword with variable declaration");
    }
  }

  /**
   * Expects the curToken to be KeyWord.Do
   *
   */

  parseDoWhileLoop(): DoWhileLoopDeclaration {
    this.assertCurToken(KeywordTokens.Do);
    this.next(); // consumes Do

    this.assertCurToken(Token.AngleOpenBracket);
    this.next(); // consumes {

    const asts: Ast[] = [];

    while (!this.isCurToken(Token.AngleCloseBracket)) {
      const ast = this.getNextAst();

      if (ast.type === "EOF")
        throw Error(`Expected AngleCloseBracket before EOF`);

      asts.push(ast);
    }

    this.next(); // consumes }

    this.assertCurToken(KeywordTokens.While);
    this.next(); // consumes While

    this.assertCurToken(Token.CurveOpenBracket);
    this.next(); // consumes (

    const condExp = this.parseExpression();

    this.assertCurToken(Token.CurveCloseBracket);
    this.next(); // consumes )

    this.skipSemiColon();
    return { type: "DoWhileLoopDeclaration", blocks: asts, condition: condExp };
  }

  /**
   * Expects the curToken to be KeyWord.While
   *
   */

  parseWhileLoop(): WhileLoopDeclaration {
    this.assertCurToken(KeywordTokens.While);
    this.next(); // consume While

    this.assertCurToken(Token.CurveOpenBracket);
    this.next(); // consumes (

    const condExp = this.parseExpression();

    this.assertCurToken(Token.CurveCloseBracket);
    this.next(); // consumes )

    this.assertCurToken(Token.AngleOpenBracket);
    this.next(); // consumes {

    const asts: Ast[] = [];

    while (!this.isCurToken(Token.AngleCloseBracket)) {
      const ast = this.getNextAst();

      if (ast.type === "EOF") {
        throw Error(`Expected AngleCloseBracket "}" before end of file"`);
      }

      asts.push(ast);
    }

    this.next(); // consumes }
    this.skipSemiColon();

    return { type: "WhileLoopDeclaration", blocks: asts, condition: condExp };
  }

  /**
   * Parse condition Block, expects curToken to be
   * Keyword.If or Keyword.Else
   *
   */

  parseCondBlock(): CondBlockDeclaration {
    const curToken = this.getCurToken();

    let blockType: CondBlockDeclaration["type"];

    if (curToken === KeywordTokens.If) {
      this.next(); // consumes if
      blockType = "IfBlockDeclaration";
    } else if (curToken === KeywordTokens.Else) {
      this.next(); // consumes else

      const curToken = this.getCurToken();

      if (curToken === KeywordTokens.If) {
        this.next(); // consumes if
        blockType = "ElseIfBlockDeclaration";
      } else {
        blockType = "ElseBlockDeclaration";
      }
    } else {
      throw Error(
        `Expected curToken to be either Keyword.If or Keyword.Else but instead got ${curToken}`
      );
    }

    let condExp: Expression | undefined = undefined;

    if (blockType !== "ElseBlockDeclaration") {
      this.assertCurToken(Token.CurveOpenBracket);
      this.next(); // consumes (

      condExp = this.parseExpression();

      this.assertCurToken(Token.CurveCloseBracket);
      this.next(); // consumes )
    }

    this.assertCurToken(Token.AngleOpenBracket);
    this.next(); // consumes {

    const asts: Ast[] = [];

    while (this.getCurToken() !== Token.AngleCloseBracket) {
      const ast = this.getNextAst();

      if (ast.type === "EOF") {
        throw Error(`Expected AngleCloseBracket "}" before end of file"`);
      }

      asts.push(ast);
    }

    this.next(); // consumes }
    this.skipSemiColon();

    if (condExp !== undefined) {
      return { type: blockType, blocks: asts, condition: condExp };
    } else {
      return { type: "ElseBlockDeclaration", blocks: asts };
    }
  }

  /**
   * Expects the curToken to be Identifier
   *
   * Tries to parse as Reassignment statement, if the syntax does not suit
   * of reassignment then it will revert the parserState and returns null
   *
   */
  tryParseReassignment(): ReAssignment | null {
    this.saveState();

    try {
      const path = this.parseReAssignmentPath();

      const assignmentOperator = this.getCurToken();

      if (
        assignmentOperator === Token.Assign ||
        assignmentOperator === Token.PlusAssign ||
        assignmentOperator === Token.StarAssign ||
        assignmentOperator === Token.SlashAssign ||
        assignmentOperator === Token.MinusAssign
      ) {
        this.next(); // consumes AssignmentOperator

        const exp = this.parseExpression();

        this.skipSemiColon();
        this.deleteSavedState();
        return { type: "ReAssignment", path, exp, assignmentOperator };
      } else {
        throw Error(
          `Expected token to be Assignment operator but instead got ${this.getCurToken()}`
        );
      }
    } catch (err) {
      this.revertToSavedState();
      return null;
    }
  }

  /**
   * Expect curToken to be Keyword.Const
   *
   */

  parseVariableDeclaration(): VariableDeclaration {
    const curToken = this.getCurToken();

    if (curToken !== KeywordTokens.Const && curToken !== KeywordTokens.Let)
      throw Error("Expected curToken be keyword.const or keyword.let");

    this.next(); // consumes const or let

    const identifierToken = this.getCurToken();

    if (identifierToken === null || !isIdentifier(identifierToken))
      throw Error("Expected Identifier token next to Keyword.const");

    this.next(); // consumes identifier

    const isColonToken = this.isCurToken(Token.Colon);

    let datatype: DataType = LiteralDataType.NotCalculated;

    if (isColonToken) {
      this.next(); // consumes :
      const explicitDataType = this.parseType();
      datatype = explicitDataType;
    }

    this.assertCurToken(Token.Assign);
    this.next(); // consumes =

    const exp = this.parseExpression();

    const constVariableDeclarationAst:
      | ConstVariableDeclaration
      | LetVariableDeclaration = {
      type:
        curToken === KeywordTokens.Const
          ? "constVariableDeclaration"
          : "letVariableDeclaration",
      identifierName: identifierToken.value,
      datatype,
      exp,
      export: false,
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
        dataType: LiteralDataType.NotCalculated,
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

  /**
   * Expects the curToken to be Identifier
   */
  parseReAssignmentPath(): ReAssignmentPath {
    const curToken = this.getCurToken();

    if (curToken !== null && isIdentifier(curToken)) {
      const whileCondChecker = () => {
        const curToken = this.getCurToken();
        return (
          curToken !== null &&
          (curToken === Token.Dot ||
            curToken === Token.BoxOpenBracket ||
            isIdentifier(curToken))
        );
      };

      let leftPath: ReAssignmentPath | null = null;

      while (whileCondChecker()) {
        const curToken = this.getCurToken();

        if (curToken === null) break;

        if (isIdentifier(curToken)) {
          if (leftPath !== null)
            throw Error("When curToken is Identifier leftPath must be null");

          leftPath = { type: "IdentifierPath", name: curToken.value };
          this.next(); // consumes Identifier
          continue;
        }

        if (leftPath === null)
          throw Error(
            "If curToken is not Identifier then leftPath cannot be null"
          );

        if (curToken === Token.Dot) {
          this.next(); // consumes .

          const identifierToken = this.getCurToken();

          if (identifierToken !== null && isIdentifier(identifierToken)) {
            const identifierName = identifierToken.value;

            leftPath = {
              type: "DotMemberPath",
              leftPath,
              rightPath: identifierName,
            };
            this.next(); // consumes identifier
            continue;
          }

          throw Error(
            `Expected Identifier token but instead got ${this.getCurToken()}`
          );
        }

        if (curToken === Token.BoxOpenBracket) {
          this.next(); // consumes [

          const identExp = this.parseExpression();

          this.assertCurToken(Token.BoxCloseBracket);
          this.next(); // consumes ]

          leftPath = { type: "BoxMemberPath", leftPath, accessExp: identExp };
          continue;
        }
      }

      if (leftPath === null) throw Error("LeftPath Cannot be null");

      return leftPath;
    }

    throw Error("Expected curToken to be Identifier");
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
      return { type: "identifier", name: curToken.value, datatype : LiteralDataType.NotCalculated };
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
    } else if (curToken === Token.AngleOpenBracket) {
      this.next(); // consumes {
      const keys: [string, Expression][] = [];

      while (this.getCurToken() !== Token.AngleCloseBracket) {
        const key = this.getCurToken();

        if (key !== null && isIdentifier(key)) {
          const keyName = key.value;

          this.next(); // consumes identifier

          this.assertCurToken(Token.Colon);
          this.next(); // consumes :

          const keyExp = this.parseExpression();

          keys.push([keyName, keyExp]);

          const isComma = this.isCurToken(Token.Comma);

          if (isComma) {
            this.next(); // consumes ,
          } else {
            this.assertCurToken(Token.AngleCloseBracket);
          }
        }
      }

      this.next(); // consumes }

      return { type: "object", keys };
    } else if (curToken === Token.BoxOpenBracket) {
      this.next(); // consumes [

      const exps: Expression[] = [];

      while (this.getCurToken() !== Token.BoxCloseBracket) {
        const exp = this.parseExpression();

        const isComma = this.isCurToken(Token.Comma);

        exps.push(exp);

        if (isComma) {
          this.next(); // consumes ,
        } else {
          this.assertCurToken(Token.BoxCloseBracket);
        }
      }

      this.next(); // consumes ]

      return { type: "array", exps };
    }

    return null;
  }

  parseNonPrefixExp(left: Expression): Expression | null {
    debugger;
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

    if (curToken === Token.BoxOpenBracket) {
      this.next(); // consumes [

      const memberAccessExp = this.parseExpression();

      this.assertCurToken(Token.BoxCloseBracket);
      this.next(); // consumes ]

      return { type: "BoxMemberAccess", left, right: memberAccessExp };
    }

    if (curToken === Token.Dot) {
      this.next(); // consumes .

      const curToken = this.getCurToken();

      if (curToken === null) throw Error("Expected Identifier after Dot");

      if (isIdentifier(curToken)) {
        const identifierName = curToken.value;

        this.next(); // consumes Identifier

        return { type: "DotMemberAccess", left, right: identifierName };
      }
    }

    if (curToken === Token.CurveOpenBracket) {
      this.next(); // consumes (

      const args: Expression[] = [];

      while (this.getCurToken() !== Token.CurveCloseBracket) {
        const argExp = this.parseExpression();

        args.push(argExp);

        const isComma = this.isCurToken(Token.Comma);

        if (isComma) {
          this.next(); // consumes ,
        } else {
          this.assertCurToken(Token.CurveCloseBracket);
        }
      }

      this.next(); // consumes )

      return { type: "FunctionCall", left, arguments: args };
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

  parseType(precedence: number = 1): DataType {
    let prefixType = this.parsePrefixType();

    if (prefixType === null)
      throw Error(
        `There is no prefix type function associated with token ${this.getCurToken()}`
      );

    while (
      (() => {
        const nextToken = this.getCurToken();

        return (
          nextToken !== null &&
          precedence < this.getNonPrefixTypePrecedence(nextToken)
        );
      })()
    ) {
      const infixType = this.parseNonPrefixType(prefixType);

      if (infixType !== null) {
        prefixType = infixType;
      } else {
        break;
      }
    }

    return prefixType;
  }

  parsePrefixType(): DataType | null {
    const curToken = this.getCurToken();

    if (curToken === null) return null;

    if (isIdentifier(curToken)) {
      const identifierName = curToken.value;

      if (identifierName === "string") {
        this.next(); // consumes string
        return LiteralDataType.String;
      } else if (identifierName === "boolean") {
        this.next(); // consumes boolean
        return LiteralDataType.Boolean;
      } else if (identifierName === "number") {
        this.next(); // consumes number
        return LiteralDataType.Number;
      } else {
        this.next(); // consumes Datatype
        return { type: "IdentifierDatatype", name: identifierName };
      }
    } else if (curToken === Token.CurveOpenBracket) {
      this.next(); // consumes (

      const groupedType = this.parseType();

      this.next(); // consumes )
      return groupedType;
    } else if (curToken === Token.AngleOpenBracket) {
      this.next(); // consumes {

      const keys: { [name: string]: DataType | undefined } = {};

      while (this.getCurToken() !== Token.AngleCloseBracket) {
        const curAst = this.getCurToken();

        if (curAst !== null && isIdentifier(curAst)) {
          const identifierName = curAst.value;

          this.next(); // consumes identifier

          this.assertCurToken(Token.Colon);
          this.next(); // consumes :

          const datatype = this.parseType();

          if (keys[identifierName] !== undefined)
            throw Error(`There is already an key with name ${identifierName}`);

          keys[identifierName] = datatype;

          const isComma = this.isCurToken(Token.Comma);

          if (isComma) {
            this.next(); // consumes ,
          } else {
            this.assertCurToken(Token.AngleCloseBracket);
          }
        }
      }

      this.next(); // consumes }
      return { type: "ObjectDataType", keys };
    }

    return null;
  }

  parseNonPrefixType(left: DataType): DataType | null {
    const curToken = this.getCurToken();

    if (curToken === null) return null;

    if (curToken === Token.BoxOpenBracket) {
      this.next(); // consumes [

      this.assertCurToken(Token.BoxCloseBracket);
      this.next(); // consumes ]

      return { type: "ArrayDataType", baseType: left };
    }

    return null;
  }

  getPrefixTypePrecedence(token: Tokens): number {
    return 1;
  }

  getNonPrefixTypePrecedence(token: Tokens): number {
    const nonPrefixPrecedence: { [index: string]: number | undefined } = {
      [Token.BoxOpenBracket]: 20,
      [Token.Dot]: 20,
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

  saveState() {
    this.savedPos = this.curPos;
  }

  revertToSavedState() {
    if (this.savedPos === "NOT SAVED") {
      throw Error("Cannot Call revertState without calling saveState");
    } else {
      this.curPos = this.savedPos;
      this.savedPos = "NOT SAVED";
    }
  }

  deleteSavedState() {
    if (this.savedPos === "NOT SAVED") {
      throw Error("Cannot call deleteSavedState without calling saveState");
    } else {
      this.savedPos = "NOT SAVED";
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
