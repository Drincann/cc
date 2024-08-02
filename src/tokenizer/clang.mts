import assert from "assert"
import { parseDec, parseHex, parseOct, isDigitWithUnderscore, isDigit, isOctDigitWithUnderscore, isOctDigit, isHexDigitWithUnderscore, isHexDigit, isIdentifierStart, isNumberLiteralStart, isIdentifier, isEOF, isStringLiteralStart, getEscape, getCurrentLine, isDoubleQuote, isSingleQuote, isNotEOL, isNotEOF } from "./utils.mjs"

interface Identifier<TokenTypeGeneric extends TokenType> {
  name: string
  token: Token<TokenTypeGeneric>
}

export type Token<TokenTypeGeneric extends TokenType = TokenType> = {
  line: number
  type: TokenTypeGeneric
  value: TokenValueType<TokenTypeGeneric>
  original: string
}

type TokenValueType<TokenTypeGeneric extends TokenType> =
  /*                             TokenType => ValueType */
  TokenTypeGeneric extends 'Identifier' ? string :
  TokenTypeGeneric extends 'Number' ? number :
  TokenTypeGeneric extends 'String' ? string :
  TokenTypeGeneric extends 'Comment' ? string :
  undefined

export type TokenType =
  | 'Identifier' | 'Number' | 'String' | 'Comment' | 'Assign'
  | 'Increment' | 'Decrement' | 'Add' | 'Subtract' | 'Multiply' | 'Divide' | 'Mod'
  | 'Equal' | 'NotEqual' | 'LessThan' | 'LessThanEqual' | 'GreaterThan' | 'GreaterThanEqual'
  | 'ShiftLeft' | 'ShiftRight'
  | 'LogicOr' | 'LogicAnd' | 'LogicNot' | 'BitwiseOr' | 'BitwiseAnd' | 'BitwiseNot' | 'BitwiseXor'
  | 'LeftParen' | 'RightParen'
  | 'LeftBracket' | 'RightBracket'
  | 'LeftBrace' | 'RightBrace'
  | 'Conditional'
  | 'Colon'
  | 'Semicolon'
  | 'Comma'
  // keywords
  | 'Return' | 'If' | 'Else' | 'While' | 'Enum'
  | 'Int' | 'Char' | 'Void' | 'SizeOf'
  // system calls
  | 'Open' | 'Read' | 'Close' | 'Printf' | 'Malloc' | 'Memset' | 'Memcmp' | 'Exit'

type KeyWordsTokenType = 'Return' | 'If' | 'Else' | 'While' | 'Enum' | 'Int' | 'Char' | 'Void' | 'SizeOf'

const keywordsTokenMap: Record<string, KeyWordsTokenType> = {
  'return': 'Return', 'if': 'If', 'else': 'Else', 'while': 'While', 'enum': 'Enum',
  'int': 'Int', 'char': 'Char', 'void': 'Void', 'sizeof': 'SizeOf'
}

export class Tokenizer {
  private code: string
  private nextPosition: number = 0
  private tokenScanStart: number = 0

  private meta: {
    line: number
    symbols: (Identifier<'Identifier' | KeyWordsTokenType>)[]
  } =
    {
      line: 1,
      symbols: []
    }

  private constructor(code: string) {
    this.code = code
  }

  public static fromCode(code: string): Tokenizer {
    return new Tokenizer(code)
  }

  public next(): Token<any> | undefined {
    let current: string | undefined
    this.tokenScanStart = this.nextPosition
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

      if (current === '=') {
        if (this.code[this.nextPosition] === '=') {
          this.nextPosition++;
          return {
            line: this.meta.line,
            type: 'Equal',
            value: undefined,
            original: this.code.substring(this.tokenScanStart, this.nextPosition)
          };
        } else {
          return {
            line: this.meta.line,
            type: 'Assign',
            value: undefined,
            original: this.code.substring(this.tokenScanStart, this.nextPosition)
          };
        }
      }

      if (current === '+') {
        if (this.code[this.nextPosition] === '+') {
          this.nextPosition++;
          return {
            line: this.meta.line,
            type: 'Increment',
            value: undefined,
            original: this.code.substring(this.tokenScanStart, this.nextPosition)

          };
        } else {
          return {
            line: this.meta.line,
            type: 'Add',
            value: undefined,
            original: this.code.substring(this.tokenScanStart, this.nextPosition)
          };
        }
      }

      if (current === '-') {
        if (this.code[this.nextPosition] === '-') {
          this.nextPosition++;
          return {
            line: this.meta.line,
            type: 'Decrement',
            value: undefined,
            original: this.code.substring(this.tokenScanStart, this.nextPosition)
          };
        } else {
          return {
            line: this.meta.line,
            type: 'Subtract',
            value: undefined,
            original: this.code.substring(this.tokenScanStart, this.nextPosition)
          };
        }
      }

      if (current === '*') {
        return {
          line: this.meta.line,
          type: 'Multiply',
          value: undefined,
          original: this.code.substring(this.tokenScanStart, this.nextPosition)
        };
      }

      if (current === '/') {
        return {
          line: this.meta.line,
          type: 'Divide',
          value: undefined,
          original: this.code.substring(this.tokenScanStart, this.nextPosition)
        };
      }

      if (current === '%') {
        return {
          line: this.meta.line,
          type: 'Mod',
          value: undefined,
          original: this.code.substring(this.tokenScanStart, this.nextPosition)
        };
      }

      if (current === '!') {
        if (this.code[this.nextPosition] === '=') {
          this.nextPosition++;
          return {
            line: this.meta.line,
            type: 'NotEqual',
            value: undefined,
            original: this.code.substring(this.tokenScanStart, this.nextPosition)
          };
        } else {
          return {
            line: this.meta.line,
            type: 'LogicNot',
            value: undefined,
            original: this.code.substring(this.tokenScanStart, this.nextPosition)
          }
        }
      }

      if (current === '<') {
        if (this.code[this.nextPosition] === '=') {
          this.nextPosition++;
          return {
            line: this.meta.line,
            type: 'LessThanEqual',
            value: undefined,
            original: this.code.substring(this.tokenScanStart, this.nextPosition)
          };
        } else if (this.code[this.nextPosition] === '<') {
          this.nextPosition++;
          return {
            line: this.meta.line,
            type: 'ShiftLeft',
            value: undefined,
            original: this.code.substring(this.tokenScanStart, this.nextPosition)
          };
        } else {
          return {
            line: this.meta.line,
            type: 'LessThan',
            value: undefined,
            original: this.code.substring(this.tokenScanStart, this.nextPosition)
          };
        }
      }

      if (current === '>') {
        if (this.code[this.nextPosition] === '=') {
          this.nextPosition++
          return {
            line: this.meta.line,
            type: 'GreaterThanEqual',
            value: undefined,
            original: this.code.substring(this.tokenScanStart, this.nextPosition)
          };
        } else if (this.code[this.nextPosition] === '>') {
          this.nextPosition++
          return {
            line: this.meta.line,
            type: 'ShiftRight',
            value: undefined,
            original: this.code.substring(this.tokenScanStart, this.nextPosition)
          };
        } else {
          return {
            line: this.meta.line,
            type: 'GreaterThan',
            value: undefined,
            original: this.code.substring(this.tokenScanStart, this.nextPosition)
          };
        }
      }

      if (current === '&') {
        if (this.code[this.nextPosition] === '&') {
          this.nextPosition++
          return {
            line: this.meta.line,
            type: 'LogicAnd',
            value: undefined,
            original: this.code.substring(this.tokenScanStart, this.nextPosition)
          };
        } else {
          return {
            line: this.meta.line,
            type: 'BitwiseAnd',
            value: undefined,
            original: this.code.substring(this.tokenScanStart, this.nextPosition)
          };
        }
      }

      if (current === '|') {
        if (this.code[this.nextPosition] === '|') {
          this.nextPosition++
          return {
            line: this.meta.line,
            type: 'LogicOr',
            value: undefined,
            original: this.code.substring(this.tokenScanStart, this.nextPosition)
          };
        } else {
          return {
            line: this.meta.line,
            type: 'BitwiseOr',
            value: undefined,
            original: this.code.substring(this.tokenScanStart, this.nextPosition)
          };
        }
      }

      if (current === '^') {
        return {
          line: this.meta.line,
          type: 'BitwiseXor',
          value: undefined,
          original: this.code.substring(this.tokenScanStart, this.nextPosition)
        };
      }

      if (current === '~') {
        return {
          line: this.meta.line,
          type: 'BitwiseNot',
          value: undefined,
          original: this.code.substring(this.tokenScanStart, this.nextPosition)
        };
      }

      if (current === '(') {
        return {
          line: this.meta.line,
          type: 'LeftParen',
          value: undefined,
          original: this.code.substring(this.tokenScanStart, this.nextPosition)
        };
      }

      if (current === ')') {
        return {
          line: this.meta.line,
          type: 'RightParen',
          value: undefined,
          original: this.code.substring(this.tokenScanStart, this.nextPosition)
        };
      }

      if (current === '[') {
        return {
          line: this.meta.line,
          type: 'LeftBracket',
          value: undefined,
          original: this.code.substring(this.tokenScanStart, this.nextPosition)
        };
      }

      if (current === ']') {
        return {
          line: this.meta.line,
          type: 'RightBracket',
          value: undefined,
          original: this.code.substring(this.tokenScanStart, this.nextPosition)
        };
      }

      if (current === '{') {
        return {
          line: this.meta.line,
          type: 'LeftBrace',
          value: undefined,
          original: this.code.substring(this.tokenScanStart, this.nextPosition)
        };
      }

      if (current === '}') {
        return {
          line: this.meta.line,
          type: 'RightBrace',
          value: undefined,
          original: this.code.substring(this.tokenScanStart, this.nextPosition)
        };
      }

      if (current === '?') {
        return {
          line: this.meta.line,
          type: 'Conditional',
          value: undefined,
          original: this.code.substring(this.tokenScanStart, this.nextPosition)
        };
      }

      if (current === ':') {
        return {
          line: this.meta.line,
          type: 'Colon',
          value: undefined,
          original: this.code.substring(this.tokenScanStart, this.nextPosition)
        };
      }

      if (current === ';') {
        return {
          line: this.meta.line,
          type: 'Semicolon',
          value: undefined,
          original: this.code.substring(this.tokenScanStart, this.nextPosition)
        }
      }

      if (current === ',') {
        return {
          line: this.meta.line,
          type: 'Comma',
          value: undefined,
          original: this.code.substring(this.tokenScanStart, this.nextPosition)
        };
      }
    } // end while
    return undefined
  }

  private skipMacro() {
    this.until(new Set(['\n', '\0']))
  }

  private parseNextIdentifier(): Token<'Identifier' | KeyWordsTokenType> | undefined {
    const start = this.nextPosition - 1

    let end = this.nextPosition
    let current = this.code[end]
    while (isIdentifier(current)) {
      end++
      current = this.code[end]
    }
    this.nextPosition = end

    const name = this.code.substring(start, end)
    return this.insertSymbol(name)
  }

  private parseNextNumberLiteral(): Token<'Number'> | undefined {
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
        type: 'Number',
        value: parseDec('0' + value),
        original: this.code.substring(this.tokenScanStart, this.nextPosition)
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
          type: 'Number',
          value: parseHex(value),
          original: this.code.substring(this.tokenScanStart, this.nextPosition)
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
          type: 'Number',
          value: parseOct(value),
          original: this.code.substring(this.tokenScanStart, this.nextPosition)
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
          type: 'Number',
          value: parseDec(value),
          original: this.code.substring(this.tokenScanStart, this.nextPosition)
        }
      }

      return /* new Token */ {
        line: this.meta.line,
        type: 'Number',
        value: 0,
        original: this.code.substring(this.tokenScanStart, this.nextPosition)
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
        type: 'Number',
        value: parseDec(value),
        original: this.code.substring(this.tokenScanStart, this.nextPosition)
      }
    }
  }

  private parseNextStringLiteral(): Token<'String'> | undefined {
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

  private parseNextComment(): Token<'Comment'> | undefined {
    const start = this.nextPosition - 1
    this.until(new Set(['\n', '\0']))

    return {
      type: 'Comment',
      line: this.meta.line,
      value: this.code.substring(start + 2, this.nextPosition),
      original: this.code.substring(this.tokenScanStart, this.nextPosition)
    }
  }

  /**
   * @param start the position of the first double quote
   */
  private parseDoubleQuoteStringLiteral(start: number): Token<'String'> {
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
      type: 'String',
      line: this.meta.line,
      value: literal,
      original: this.code.substring(this.tokenScanStart, this.nextPosition)
    }
  }

  /**
   * @param start the position of the first single quote
   */
  private parseSingleQuoteStringLiteral(start: number): Token<'String'> {
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
        type: 'String',
        line: this.meta.line,
        value: escape,
        original: this.code.substring(this.tokenScanStart, this.nextPosition)
      }
    } else {
      if (this.code[literalStart + 1] !== "'") {
        throw new Error("TokenizerError: unterminated string literal at line " + this.meta.line + ". near: " + getCurrentLine(this.code, start))
      }

      this.next
      return /* new Token */ {
        type: 'String',
        line: this.meta.line,
        value: this.code[literalStart],
        original: this.code.substring(this.tokenScanStart, this.nextPosition)
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

  private insertSymbol(name: string): Token<'Identifier' | KeyWordsTokenType> {
    let token
    if (keywordsTokenMap[name] !== undefined) {
      token = {
        type: keywordsTokenMap[name],
        value: undefined,
        line: this.meta.line,
        original: this.code.substring(this.tokenScanStart, this.nextPosition)
      } as const
    } else {
      token = {
        type: 'Identifier',
        value: name,
        line: this.meta.line,
        original: this.code.substring(this.tokenScanStart, this.nextPosition)
      } as const
    }


    this.meta.symbols.push({ name, token })
    return token
  }
}
