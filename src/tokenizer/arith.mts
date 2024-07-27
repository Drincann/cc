import { decNumber, isDecLiteralStart, isNotEOF, parseDec } from "./utils.mjs"

export interface Token<TokenTypeGeneric extends TokenType> {
  type: TokenTypeGeneric
  value: TokenValue<TokenTypeGeneric>
}

type TokenValue<TokenTypeGeneric extends TokenType> =
  TokenTypeGeneric extends 'Number' ? number :
  undefined

type TokenType =
  | 'Number'
  | 'Add'
  | 'Subtract'
  | 'Multiply'
  | 'Divide'
  | 'LeftParen'
  | 'RightParen'

export class Tokenizer {
  private expression: string
  private cursor: number = 0

  private constructor(expression: string) {
    this.expression = expression
  }

  static fromExpression(expression: string): Tokenizer {
    return new Tokenizer(expression)
  }

  public next(): Token<TokenType> | undefined {
    let current: string = this.expression[this.cursor]
    while (isNotEOF(current)) {
      current = this.expression[this.cursor]

      if (isDecLiteralStart(current)) {
        const start = this.cursor
        this.untilNot(decNumber)
        const literal = this.expression.substring(start, this.cursor)
        return /* new Token */ {
          value: parseDec(literal),
          type: 'Number'
        }
      }

      if (current === '+') {
        this.cursor++
        return { type: 'Add', value: undefined }
      }

      if (current === '-') {
        this.cursor++
        return { type: 'Subtract', value: undefined }
      }

      if (current === '*') {
        this.cursor++
        return { type: 'Multiply', value: undefined }
      }

      if (current === '/') {
        this.cursor++
        return { type: 'Divide', value: undefined }
      }

      if (current === '(') {
        this.cursor++
        return { type: 'LeftParen', value: undefined }
      }

      if (current === ')') {
        this.cursor++
        return { type: 'RightParen', value: undefined }
      }

      this.cursor++
    }

    return undefined
  }
  private untilNot(shouldContinue: (char: string) => boolean) {
    while (
    /* */isNotEOF(this.expression[this.cursor])
      && shouldContinue(this.expression[this.cursor])
    ) {
      this.cursor++
    }
  }
}