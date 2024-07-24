import assert from "assert"

export enum TokenType {
  Identifier, Number
}

interface Identifier {
  name: string
  token: Token
}

interface Token {
  line: number
  type: TokenType
  value: string
}

export class ClangTokenizer {
  private code: string
  private nextPosition: number = 0

  private meta: {
    line: number
    symbols: { [key: string]: Identifier | undefined }
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

  public next(): Token | undefined {
    let current: string | undefined
    while (current = this.code[this.nextPosition]) {
      assert(current.length === 1, "tokenizer: current char should be a single character.")
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

      if (isNumberStart(current)) {
        return this.parseNextNumber()
      }
    }

    return undefined;
  }

  private skipMacro() {
    this.until(new Set(['\n', '\0']))
  }

  private parseNextIdentifier(): Token | undefined {
    const start = this.nextPosition - 1

    let end = this.nextPosition
    let current = this.code[end]
    while (current != undefined && isIdentifier(current)) {
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

  private parseNextNumber(): Token | undefined {
    const start = this.nextPosition - 1

    if /* float */('.' === this.code[start] && isDigit(this.code[start + 1])) {
      let end = start + 1
      let current = this.code[end]
      while (current != undefined && isDigitWithUnderscore(current)) {
        end++
        current = this.code[end]
      }
      this.nextPosition = end

      const value = this.code.substring(start, end).replace(/_/g, '')
      return /* new Token */ {
        line: this.meta.line,
        type: TokenType.Number,
        value: '0' + value
      }
    } else if ('0' === this.code[start]) {
      if /* hex */('0x' === this.code.substring(start, start + 2) && isHexDigit(this.code[start + 2])) {
        let end = start + 2
        let current = this.code[end]
        while (current != undefined && isHexDigitWithUnderscore(current)) {
          end++
          current = this.code[end]
        }
        this.nextPosition = end

        const value = this.code.substring(start, end).replace(/_/g, '')
        return /* new Token */ {
          line: this.meta.line,
          type: TokenType.Number,
          value
        }
      } else if /* oct */ ('0' === this.code[start] && isOctDigit(this.code[start + 1])) {
        let end = start + 1
        let current = this.code[end]
        while (current != undefined && isOctDigitWithUnderscore(current)) {
          end++
          current = this.code[end]
        }
        this.nextPosition = end

        const value = this.code.substring(start, end).replace(/_/g, '')
        return /* new Token */ {
          line: this.meta.line,
          type: TokenType.Number,
          value
        }
      } else if /* float */ ('.' === this.code[start + 1] && isDigit(this.code[start + 2])) {
        let end = start + 2
        let current = this.code[end]
        while (current != undefined && isDigitWithUnderscore(current)) {
          end++
          current = this.code[end]
        }
        this.nextPosition = end

        const value = this.code.substring(start, end).replace(/_/g, '')
        return /* new Token */ {
          line: this.meta.line,
          type: TokenType.Number,
          value
        }
      }

      return /* new Token */ {
        line: this.meta.line,
        type: TokenType.Number,
        value: '0'
      }
    } else /* dec */ {
      let end = start + 1
      let current = this.code[end]
      while (current != undefined && isDigitWithUnderscore(current)) {
        end++
        current = this.code[end]
      }
      if (current === '.' && isDigit(this.code[end + 1])) {
        end++
        current = this.code[end]
        while (current != undefined && isDigitWithUnderscore(current)) {
          end++
          current = this.code[end]
        }
      }
      this.nextPosition = end

      const value = this.code.substring(start, end).replace(/_/g, '')
      return /* new Token */ {
        line: this.meta.line,
        type: TokenType.Number,
        value
      }

    }
  }

  private getSymbol(name: string): Token {
    return this.meta.symbols[name]!.token
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

  private until(charSet: Set<string>) {
    let current = this.code[this.nextPosition]
    while (current != undefined && !charSet.has(current)) {
      this.nextPosition++
      current = this.code[this.nextPosition]
    }
  }

}
function isEOF(char?: string): boolean {
  return char === '\0' || char === undefined
}


function isIdentifierStart(char: string) {
  return isAlpha(char) || char === '_'
}

function isIdentifier(char: string) {
  return isAlpha(char) || isDigit(char) || char === '_'
}

function isAlpha(char: string) {
  return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')
}

function isDigit(char: string): boolean {
  return char >= '0' && char <= '9'
}

function isDigitWithUnderscore(char: string): boolean {
  return isDigit(char) || char === '_'
}

function isHexDigit(char: string): boolean {
  return (char >= '0' && char <= '9') || (char >= 'a' && char <= 'f') || (char >= 'A' && char <= 'F')
}

function isHexDigitWithUnderscore(char: string): boolean {
  return isHexDigit(char) || char === '_'
}

function isOctDigit(char: string): boolean {
  return char >= '0' && char <= '7'
}

function isOctDigitWithUnderscore(char: string): boolean {
  return isOctDigit(char) || char === '_'
}

function isNumberStart(char: string): boolean {
  return isDigit(char) || char === '.'
}
