import { Token, Tokens } from "./tokens";

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

          if (this.isCurrentCharWhiteSpaceOrEOF()) {
            return Token.StrictEquality;
          } else {
            this.consumeTillWhiteSpaceOrEOF();
            return Token.Illegal;
          }
        }

        if (this.isCurrentCharWhiteSpaceOrEOF()) {
          return Token.Equality;
        } else {
          this.consumeTillWhiteSpaceOrEOF();
          return Token.Illegal;
        }
      } else if (curChar === ">") {
        this.next(); // consumes >

        if (this.isCurrentCharWhiteSpaceOrEOF()) {
          return Token.FunctionArrow;
        } else {
          this.consumeTillWhiteSpaceOrEOF();
          return Token.Illegal;
        }
      }

      if (this.isCurrentCharWhiteSpaceOrEOF()) {
        return Token.Assign;
      } else {
        this.consumeTillWhiteSpaceOrEOF();
        return Token.Illegal;
      }
    } else if (curChar === "+") {
      this.next(); // consumes +

      const curChar = this.getCurrentChar();

      if (curChar === "=") {
        this.next(); // consumes =

        if (this.isCurrentCharWhiteSpaceOrEOF()) {
          return Token.PlusAssign;
        } else {
          this.consumeTillWhiteSpaceOrEOF();
          return Token.Illegal;
        }
      }

      if (this.isCurrentCharWhiteSpaceOrEOF()) {
        return Token.Plus;
      } else {
        this.consumeTillWhiteSpaceOrEOF();
        return Token.Illegal;
      }
    } else if (curChar === "-") {
      this.next(); // consumes -

      const curChar = this.getCurrentChar();

      if (curChar === "=") {
        this.next(); // consumes =

        if (this.isCurrentCharWhiteSpaceOrEOF()) {
          return Token.MinusAssign;
        } else {
          this.consumeTillWhiteSpaceOrEOF();
          return Token.Illegal;
        }
      }

      if (this.isCurrentCharWhiteSpaceOrEOF()) {
        return Token.Minus;
      } else {
        this.consumeTillWhiteSpaceOrEOF();
        return Token.Illegal;
      }
    } else if (curChar === "*") {
      this.next(); // consumes *

      const curChar = this.getCurrentChar();

      if (curChar === "=") {
        this.next(); // consumes =

        if (this.isCurrentCharWhiteSpaceOrEOF()) {
          return Token.StarAssign;
        } else {
          this.consumeTillWhiteSpaceOrEOF();
          return Token.Illegal;
        }
      }

      if (this.isCurrentCharWhiteSpaceOrEOF()) {
        return Token.Star;
      } else {
        this.consumeTillWhiteSpaceOrEOF();
        return Token.Illegal;
      }
    } else if (curChar === "/") {
      this.next(); // consumes /

      const curChar = this.getCurrentChar();

      if (curChar === "=") {
        this.next(); // consumes =

        if (this.isCurrentCharWhiteSpaceOrEOF()) {
          return Token.SlashAssign;
        } else {
          this.consumeTillWhiteSpaceOrEOF();
          return Token.Illegal;
        }
      }

      if (this.isCurrentCharWhiteSpaceOrEOF()) {
        return Token.Slash;
      } else {
        this.consumeTillWhiteSpaceOrEOF();
        return Token.Illegal;
      }
    } else if (curChar === "!") {
      this.next(); // consumes !

      const curChar = this.getCurrentChar();

      if (curChar === "=") {
        this.next(); // consumes =
        const curChar = this.getCurrentChar();

        if (curChar === "=") {
          this.next(); // consumes =

          if (this.isCurrentCharWhiteSpaceOrEOF()) {
            return Token.StrictNotEqual;
          } else {
            this.consumeTillWhiteSpaceOrEOF();
            return Token.Illegal;
          }
        }

        if (this.isCurrentCharWhiteSpaceOrEOF()) {
          return Token.NotEqual;
        } else {
          this.consumeTillWhiteSpaceOrEOF();
          return Token.Illegal;
        }
      }

      if (this.isCurrentCharWhiteSpaceOrEOF()) {
        return Token.Bang;
      } else {
        this.consumeTillWhiteSpaceOrEOF();
        return Token.Illegal;
      }
    } else if (curChar === "<") {
      this.next(); // consumes <

      const curChar = this.getCurrentChar();

      if (curChar === "=") {
        this.next(); // consumes =

        if (this.isCurrentCharWhiteSpaceOrEOF()) {
          return Token.LessThanOrEqual;
        } else {
          this.consumeTillWhiteSpaceOrEOF();
          return Token.Illegal;
        }
      }

      if (this.isCurrentCharWhiteSpaceOrEOF()) {
        return Token.LessThan;
      } else {
        this.consumeTillWhiteSpaceOrEOF();
        return Token.Illegal;
      }
    } else if (curChar === ">") {
      this.next(); // consumes >

      const curChar = this.getCurrentChar();

      if (curChar === "=") {
        this.next(); // consumes =

        if (this.isCurrentCharWhiteSpaceOrEOF()) {
          return Token.GreaterThanOrEqual;
        } else {
          this.consumeTillWhiteSpaceOrEOF();
          return Token.Illegal;
        }
      }

      if (this.isCurrentCharWhiteSpaceOrEOF()) {
        return Token.GreaterThan;
      } else {
        this.consumeTillWhiteSpaceOrEOF();
        return Token.Illegal;
      }
    }

    this.consumeTillWhiteSpaceOrEOF();

    return Token.Illegal;
  }
}

 const isWhitespaceCharacter = (character: string | number): boolean => {
  return /\s/.test(
    typeof character === "number"
      ? String.fromCharCode(character)
      : character.charAt(0)
  );
};
