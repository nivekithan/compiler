import { KeywordTokens, Token, Tokens } from "./tokens";

// Given an a string will return Lexer tokens
export const convertToTokens = (content: string): Tokens[] => {
  const Lexer = new LexerFactory(content);
  const tokens: Tokens[] = [];

  while (true) {
    const nextToken = Lexer.getNextToken();
    if (nextToken === Token.EOF) {
      break;
    }
    tokens.push(nextToken);
  }

  return tokens;
};

class LexerFactory {
  private content: string[];
  private curPos: number | null;

  constructor(content: string) {
    this.content = Array.from(content);
    this.curPos = 0;
  }

  getCurrentChar(): string | null {
    if (this.curPos === null) return null;

    return this.content[this.curPos];
  }

  next() {
    if (this.curPos === null)
      throw Error("Cannot call Lexer.next when Lexer.curPos is null");

    if (this.curPos >= this.content.length - 1) {
      this.curPos = null;
      return;
    }

    this.curPos++;
  }

  isCurrentCharWhiteSpaceOrEOF(): boolean {
    const curChar = this.getCurrentChar();

    if (curChar === null) return true;

    return isWhitespaceCharacter(curChar);
  }

  skipWhiteSpace() {
    let activeChar = this.getCurrentChar();

    if (activeChar === null) return;

    while (isWhitespaceCharacter(activeChar)) {
      this.next();
      const curChar = this.getCurrentChar();

      if (curChar === null) {
        break;
      }

      activeChar = curChar;
    }
  }

  consumeTillWhiteSpaceOrEOF() {
    let activeChar = this.getCurrentChar();

    if (activeChar === null) return;

    while (!isWhitespaceCharacter(activeChar)) {
      this.next();
      const curChar = this.getCurrentChar();

      if (curChar === null) {
        break;
      }

      activeChar = curChar;
    }
  }

  // Expect curChar to be "
  // Ends after consuming ending "
  readString(): string {
    const startChar = this.getCurrentChar();
    const chars: string[] = [];

    if (startChar !== '"') throw Error('Expected " as the curChar');

    this.next(); // consumes "

    while (this.getCurrentChar() !== '"') {
      const curChar = this.getCurrentChar();

      if (curChar === null) throw Error('Expected " before EOF');

      chars.push(curChar);
      this.next();
    }

    this.next(); // consumes "
    return chars.join("");
  }

  // Expect curChar to be LatinChar or $ or _, else it will return null
  // Ends at first non latinChar or $ or _ or numbers
  readIdentifier(): string | null {
    const startChar = this.getCurrentChar();
    const chars: string[] = [];

    if (
      startChar === null ||
      !(isLatinCharacter(startChar) || startChar === "$" || startChar === "_")
    )
      return null;

    while (true) {
      const curChar = this.getCurrentChar();
      if (
        curChar === null ||
        !(
          isLatinCharacter(curChar) ||
          curChar === "$" ||
          curChar === "_" ||
          isNumberCharacter(curChar)
        )
      ) {
        break;
      }

      this.next();
      chars.push(curChar);
    }

    return chars.join("");
  }
  // Expect curChar to start at start of number
  // Ends after consuming whole number
  readNumber(): number {
    const startChar = this.getCurrentChar();
    const chars: string[] = [];

    if (startChar === null || !isNumberCharacter(startChar))
      throw Error("Expected digit as curChar");

    while (true) {
      const curChar = this.getCurrentChar();

      if (curChar === null || isWhitespaceCharacter(curChar)) break;

      if (isNumberCharacter(curChar)) {
        this.next();
        chars.push(curChar);
      } else {
        break;
      }
    }

    return parseInt(chars.join(""), 10);
  }

  getNextToken(): Tokens {
    this.skipWhiteSpace();
    const curChar = this.getCurrentChar();

    if (curChar === null) return Token.EOF;

    if (curChar === "=") {
      this.next(); // consumes =

      const curChar = this.getCurrentChar();

      if (curChar === "=") {
        this.next(); // consumes =
        const curChar = this.getCurrentChar();

        if (curChar === "=") {
          this.next(); // consumes =

          return Token.StrictEquality;
        }

        return Token.Equality;
      } else if (curChar === ">") {
        this.next(); // consumes >

        return Token.FunctionArrow;
      }

      return Token.Assign;
    } else if (curChar === "+") {
      this.next(); // consumes +

      const curChar = this.getCurrentChar();

      if (curChar === "=") {
        this.next(); // consumes =

        return Token.PlusAssign;
      }
      return Token.Plus;
    } else if (curChar === "-") {
      this.next(); // consumes -

      const curChar = this.getCurrentChar();

      if (curChar === "=") {
        this.next(); // consumes =

        return Token.MinusAssign;
      }

      return Token.Minus;
    } else if (curChar === "*") {
      this.next(); // consumes *

      const curChar = this.getCurrentChar();

      if (curChar === "=") {
        this.next(); // consumes =

        return Token.StarAssign;
      }

      return Token.Star;
    } else if (curChar === "/") {
      this.next(); // consumes /

      const curChar = this.getCurrentChar();

      if (curChar === "=") {
        this.next(); // consumes =

        return Token.SlashAssign;
      }

      return Token.Slash;
    } else if (curChar === "!") {
      this.next(); // consumes !

      const curChar = this.getCurrentChar();

      if (curChar === "=") {
        this.next(); // consumes =
        const curChar = this.getCurrentChar();

        if (curChar === "=") {
          this.next(); // consumes =

          return Token.StrictNotEqual;
        }

        return Token.NotEqual;
      }

      return Token.Bang;
    } else if (curChar === "<") {
      this.next(); // consumes <

      const curChar = this.getCurrentChar();

      if (curChar === "=") {
        this.next(); // consumes =

        return Token.LessThanOrEqual;
      }

      return Token.LessThan;
    } else if (curChar === ">") {
      this.next(); // consumes >

      const curChar = this.getCurrentChar();

      if (curChar === "=") {
        this.next(); // consumes =

        return Token.GreaterThanOrEqual;
      }

      return Token.GreaterThan;
    } else if (curChar === ";") {
      this.next(); // consumes ;
      return Token.SemiColon;
    } else if (curChar === ":") {
      this.next(); // consumes :
      return Token.Colon;
    } else if (curChar === ".") {
      this.next(); // consumes .
      return Token.Dot;
    } else if (curChar === ",") {
      this.next(); // consumes ,
      return Token.Comma;
    } else if (curChar === "{") {
      this.next(); // consumes {
      return Token.AngleOpenBracket;
    } else if (curChar === "}") {
      this.next(); // consumes }
      return Token.AngleCloseBracket;
    } else if (curChar === "(") {
      this.next(); // consumes (
      return Token.CurveOpenBracket;
    } else if (curChar === ")") {
      this.next(); // consumes )
      return Token.CurveCloseBracket;
    } else if (curChar === "[") {
      this.next(); // consumes [
      return Token.BoxOpenBracket;
    } else if (curChar === "]") {
      this.next(); // consumes ]
      return Token.BoxCloseBracket;
    } else if (curChar === "|") {
      this.next(); // consumes |
      return Token.VerticalBar;
    } else if (curChar === "^") {
      this.next(); // consumes ^
      return Token.Caret;
    } else if (curChar === "&") {
      this.next(); // consumes &
      return Token.Ampersand;
    } else if (curChar === '"') {
      const stringValue = this.readString();
      return { type: "string", value: stringValue };
    } else if (isNumberCharacter(curChar)) {
      const numberValue = this.readNumber();
      return { type: "number", value: numberValue };
    } else {
      const ident = this.readIdentifier();
      if (ident !== null) {
        const maybeBoolean = isBoolean(ident);

        if (maybeBoolean !== null) {
          return { type: "boolean", value: maybeBoolean };
        }

        const maybeKeyword = isKeyWord(ident);

        if (maybeKeyword !== null) {
          return maybeKeyword;
        }

        return { type: "identifier", value: ident };
      }
    }

    this.consumeTillWhiteSpaceOrEOF();

    return Token.Illegal;
  }
}

const isLatinCharacter = (character: string | number): boolean => {
  return /[a-zA-Z]/.test(
    typeof character === "number"
      ? String.fromCharCode(character)
      : character.charAt(0)
  );
};

const isWhitespaceCharacter = (character: string | number): boolean => {
  return /\s/.test(
    typeof character === "number"
      ? String.fromCharCode(character)
      : character.charAt(0)
  );
};

const isNumberCharacter = (character: string | number): boolean => {
  return /\d/.test(
    typeof character === "number"
      ? String.fromCharCode(character)
      : character.charAt(0)
  );
};

const booleanLookupTable: { [index: string]: boolean } = {
  true: true,
  false: false,
};
// ident has name of boolean (i.e either "true" or "false"), then it will
// return respective boolean value, if it is not then it will return null
const isBoolean = (ident: string): boolean | null => {
  return typeof booleanLookupTable[ident] === "boolean"
    ? booleanLookupTable[ident]
    : null;
};

const keyworkLookupTable: { [index: string]: KeywordTokens | undefined } = {
  const: KeywordTokens.Const,
  let: KeywordTokens.Let,
  if: KeywordTokens.If,
  else: KeywordTokens.Else,
  while: KeywordTokens.While,
  do: KeywordTokens.Do,
  break: KeywordTokens.Break,
  continue: KeywordTokens.Continue,
  function: KeywordTokens.Function,
  return: KeywordTokens.Return,
  import: KeywordTokens.Import,
  from: KeywordTokens.From,
  export: KeywordTokens.Export,
};

// ident has name of keyword (i.e "const", "let"), then it will
// return respective keyword value, if it is not then it will return null
const isKeyWord = (ident: string): KeywordTokens | null => {
  const maybeKeyword = keyworkLookupTable[ident];

  return typeof maybeKeyword === "undefined" ? null : maybeKeyword;
};
