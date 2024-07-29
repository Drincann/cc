import { describe, it } from "node:test"
import assert from 'assert/strict'
import { ArithTokenizer } from "../src/tokenizer/index.mjs"

describe("ArithTokenizer", () => {
  describe("#next()", () => {
    it(
      "expression: '1 + 2'",
      () => {
        const tokenizer = ArithTokenizer.fromExpression('1 + 2')
        assert.deepEqual(tokenizer.next(), { type: 'Number', value: 1 })
        assert.deepEqual(tokenizer.next(), { type: 'Add', value: undefined })
        assert.deepEqual(tokenizer.next(), { type: 'Number', value: 2 })
        assert.deepEqual(tokenizer.next(), undefined)
      }
    )

    it(
      "expression with float: '1 + 2.3 * 4.5'",
      () => {
        const tokenizer = ArithTokenizer.fromExpression('1 + 2.3 * 4.5')
        assert.deepEqual(tokenizer.next(), { type: 'Number', value: 1 })
        assert.deepEqual(tokenizer.next(), { type: 'Add', value: undefined })
        assert.deepEqual(tokenizer.next(), { type: 'Number', value: 2.3 })
        assert.deepEqual(tokenizer.next(), { type: 'Multiply', value: undefined })
        assert.deepEqual(tokenizer.next(), { type: 'Number', value: 4.5 })
        assert.deepEqual(tokenizer.next(), undefined)
      }
    )

    it(
      "expression with parentheses: '((1 + 2) * 3) / 9 - 1'",
      () => {
        const tokenizer = ArithTokenizer.fromExpression('((1 + 2) * 3) / 9 - 1')
        assert.deepEqual(tokenizer.next(), { type: 'LeftParen', value: undefined })
        assert.deepEqual(tokenizer.next(), { type: 'LeftParen', value: undefined })
        assert.deepEqual(tokenizer.next(), { type: 'Number', value: 1 })
        assert.deepEqual(tokenizer.next(), { type: 'Add', value: undefined })
        assert.deepEqual(tokenizer.next(), { type: 'Number', value: 2 })
        assert.deepEqual(tokenizer.next(), { type: 'RightParen', value: undefined })
        assert.deepEqual(tokenizer.next(), { type: 'Multiply', value: undefined })
        assert.deepEqual(tokenizer.next(), { type: 'Number', value: 3 })
        assert.deepEqual(tokenizer.next(), { type: 'RightParen', value: undefined })
        assert.deepEqual(tokenizer.next(), { type: 'Divide', value: undefined })
        assert.deepEqual(tokenizer.next(), { type: 'Number', value: 9 })
        assert.deepEqual(tokenizer.next(), { type: 'Subtract', value: undefined })
        assert.deepEqual(tokenizer.next(), { type: 'Number', value: 1 })
      }
    )

  }) // suite next
}) // suite ClangTokenizer

function array(size: number) {
  return Array.from({ length: size })
}