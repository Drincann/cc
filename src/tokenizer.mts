import assert from "assert"
import { parseDec, parseHex, parseOct, isDigitWithUnderscore, isDigit, isOctDigitWithUnderscore, isOctDigit, isHexDigitWithUnderscore, isHexDigit, isIdentifierStart, isNumberLiteralStart, isIdentifier, isEOF, isStringLiteralStart, getEscape, getCurrentLine, isDoubleQuote, isSingleQuote, isNotEOL, isNotEOF } from "./utils.mjs"

interface Identifier<TokenTypeGeneric extends TokenType> {
  name: string
  token: Token<TokenTypeGeneric>
}

type Token<TokenTypeGeneric extends TokenType> = {
  line: number
  type: TokenTypeGeneric
  value: TokenValueType<TokenTypeGeneric>
}

type TokenValueType<TokenTypeGeneric extends TokenType> =
  /*                             TokenType => ValueType */
  TokenTypeGeneric extends TokenType.Identifier ? string :
  TokenTypeGeneric extends TokenType.Number ? number :
  TokenTypeGeneric extends TokenType.String ? string :
  TokenTypeGeneric extends TokenType.Comment ? string :
  never

export enum TokenType {
  Identifier, Number, String, Comment
}

export class ClangTokenizer {
  private code: string
  private nextPosition: number = 0

  private meta: {
    line: number
    symbols: { [key: string]: Identifier<any> | undefined }
  } =
    {
      line: 1,
      symbols: {}
    }

  private constructor(code: string) {
    this.code = code
  }

  public static fromCode(code: string) {
    return new ClangTokenizer(code)
  }

  public next(): Token<any> | undefined {
    let current: string | undefined
    while (current = this.code[this.nextPosition]) {
      assert(current.length === 1, "tokenizer.next(): current char should be a single character.")
      this.nextPosition++

      if (isEOF(current)) {
        break
      }

      if (current === '\n') {
        this.meta.line++
        continue
      }

      if (current === '#') {
        this.skipMacro()
        continue
      }

      if (isIdentifierStart(current)) {
        return this.parseNextIdentifier()
      }

      if (isNumberLiteralStart(current)) {
        return this.parseNextNumberLiteral()
      }

      if (isStringLiteralStart(current)) {
        return this.parseNextStringLiteral()
      }

      if (this.isCommentStart(current)) {
        return this.parseNextComment()
      }
    }

    return undefined;
  }

  private skipMacro() {
    this.until(new Set(['\n', '\0']))
  }

  private parseNextIdentifier(): Token<typeof TokenType.Identifier> | undefined {
    const start = this.nextPosition - 1

    let end = this.nextPosition
    let current = this.code[end]
    while (isIdentifier(current)) {
      end++
      current = this.code[end]
    }
    this.nextPosition = end

    const name = this.code.substring(start, end)
    if (this.symbolNotExists(name)) {
      this.insertSymbol(name)
    }

    return this.getSymbol(name)
  }

  private parseNextNumberLiteral(): Token<typeof TokenType.Number> | undefined {
    const start = this.nextPosition - 1

    if /* float */('.' === this.code[start] && isDigit(this.code[start + 1])) {
      let end = start + 1
      let current = this.code[end]
      while (isDigitWithUnderscore(current)) {
        end++
        current = this.code[end]
      }
      this.nextPosition = end

      const value = this.code.substring(start, end).replace(/_/g, '')
      return /* new Token */ {
        line: this.meta.line,
        type: TokenType.Number,
        value: parseDec('0' + value)
      }
    } else if ('0' === this.code[start]) {
      if /* hex */('0x' === this.code.substring(start, start + 2) && isHexDigit(this.code[start + 2])) {
        let end = start + 2
        let current = this.code[end]
        while (isHexDigitWithUnderscore(current)) {
          end++
          current = this.code[end]
        }
        this.nextPosition = end

        const value = this.code.substring(start, end).replace(/_/g, '')
        return /* new Token */ {
          line: this.meta.line,
          type: TokenType.Number,
          value: parseHex(value)
        }
      } else if /* oct */ ('0' === this.code[start] && isOctDigit(this.code[start + 1])) {
        let end = start + 1
        let current = this.code[end]
        while (isOctDigitWithUnderscore(current)) {
          end++
          current = this.code[end]
        }
        this.nextPosition = end

        const value = this.code.substring(start, end).replace(/_/g, '')
        return /* new Token */ {
          line: this.meta.line,
          type: TokenType.Number,
          value: parseOct(value)
        }
      } else if /* float */ ('.' === this.code[start + 1] && isDigit(this.code[start + 2])) {
        let end = start + 2
        let current = this.code[end]
        while (isDigitWithUnderscore(current)) {
          end++
          current = this.code[end]
        }
        this.nextPosition = end

        const value = this.code.substring(start, end).replace(/_/g, '')
        return /* new Token */ {
          line: this.meta.line,
          type: TokenType.Number,
          value: parseDec(value)
        }
      }

      return /* new Token */ {
        line: this.meta.line,
        type: TokenType.Number,
        value: 0
      }
    } else /* dec */ {
      let end = start + 1
      let current = this.code[end]
      while (isDigitWithUnderscore(current)) {
        end++
        current = this.code[end]
      }
      if (current === '.' && isDigit(this.code[end + 1])) {
        end++
        current = this.code[end]
        while (isDigitWithUnderscore(current)) {
          end++
          current = this.code[end]
        }
      }
      this.nextPosition = end

      const value = this.code.substring(start, end).replace(/_/g, '')
      return /* new Token */ {
        line: this.meta.line,
        type: TokenType.Number,
        value: parseDec(value)
      }
    }
  }

  private parseNextStringLiteral(): Token<TokenType.String> | undefined {
    const start = this.nextPosition - 1
    if (isDoubleQuote(this.code[start])) {
      return this.parseDoubleQuoteStringLiteral(start)
    } else if (isSingleQuote(this.code[start])) {
      return this.parseSingleQuoteStringLiteral(start)
    }

    assert(false, "tokenizer.parseNextStringLiteral(): unreachable code, should be handled by isStringLiteralStart in next()")
  }

  private isCommentStart(char: string): boolean {
    return char === '/' && this.code[this.nextPosition] === '/'
  }

  private parseNextComment(): Token<TokenType.Comment> | undefined {
    const start = this.nextPosition - 1
    this.until(new Set(['\n', '\0']))

    return {
      type: TokenType.Comment,
      line: this.meta.line,
      value: this.code.substring(start + 2, this.nextPosition)
    }
  }

  /**
   * @param start the position of the first double quote
   */
  private parseDoubleQuoteStringLiteral(start: number): Token<TokenType.String> {
    let cursor = start + 1
    let current = this.code[cursor]
    let literal = ''
    while (current !== '"' && isNotEOL(current)) {
      if (current === '\\' && this.code[cursor + 1] !== undefined) {
        const escape = getEscape(this.code[++cursor])
        if (escape === undefined) {
          throw new Error("TokenizerError: invalid escape character at line " + this.meta.line + ". near: " + getCurrentLine(this.code, start))
        }

        literal += escape
        current = this.code[++cursor]
        continue
      }

      literal += current
      current = this.code[++cursor]
    }
    if (current !== '"') {
      throw new Error("TokenizerError: unterminated string literal at line " + this.meta.line + ". near: " + getCurrentLine(this.code, start))
    }

    this.nextPosition = cursor + 1
    return /* new Token */ {
      type: TokenType.String,
      line: this.meta.line,
      value: literal
    }
  }

  /**
   * @param start the position of the first single quote
   */
  private parseSingleQuoteStringLiteral(start: number): Token<TokenType.String> {
    let literalStart = start + 1
    if (this.code[literalStart] === '\\') {
      if (this.code[literalStart + 2] !== "'") {
        throw new Error("TokenizerError: unterminated string literal at line " + this.meta.line + ". near: " + getCurrentLine(this.code, start))
      }

      const escape = getEscape(this.code[literalStart + 1])
      if (escape === undefined) {
        throw new Error("TokenizerError: invalid escape character at line " + this.meta.line + ". near: " + getCurrentLine(this.code, start))
      }

      this.nextPosition = literalStart + 3
      return /* new Token */ {
        type: TokenType.String,
        line: this.meta.line,
        value: escape
      }
    } else {
      if (this.code[literalStart + 1] !== "'") {
        throw new Error("TokenizerError: unterminated string literal at line " + this.meta.line + ". near: " + getCurrentLine(this.code, start))
      }

      this.next
      return /* new Token */ {
        type: TokenType.String,
        line: this.meta.line,
        value: this.code[literalStart]
      }
    }
  }

  private until(charSet: Set<string>) {
    let current = this.code[this.nextPosition]
    while (!charSet.has(current) && isNotEOF(current)) {
      this.nextPosition++
      current = this.code[this.nextPosition]
    }
  }

  private symbolNotExists(name: string): boolean {
    return !(name in this.meta.symbols)
  }

  private insertSymbol(name: string) {
    this.meta.symbols[name] = {
      name,
      token: {
        type: TokenType.Identifier,
        value: name,
        line: this.meta.line
      },
    }
  }

  private getSymbol(name: string): Token<typeof TokenType.Identifier> {
    return this.meta.symbols[name]!.token
  }
}
