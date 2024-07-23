import assert from "assert"

export enum TokenType {
  Identifier,
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

      if (current === ' ') {
        continue
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
    }

    return undefined;
  }

  private skipMacro() {
    this.until(new Set(['\n', '\0']))
  }

  private parseNextIdentifier(): Token {
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

