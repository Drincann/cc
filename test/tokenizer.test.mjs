import { describe, it } from "node:test"
import assert from 'assert/strict'
import { ClangTokenizer } from '../src/tokenizer.mjs'
import { TokenType } from "../src/tokenizer.mjs"

describe("ClangTokenizer", () => {
  describe("#next()", () => {
    describe("identifier", () => {
      it(
        "should tokenize a single identifier",
        () => {
          const tokenizer = ClangTokenizer.fromCode("a")
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Identifier,
            value: "a",
            line: 1,
          })
        }
      )

      it(
        "should tokenize an identifier with underscore",
        () => {
          const tokenizer = ClangTokenizer.fromCode("abc_123")
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Identifier,
            value: "abc_123",
            line: 1,
          })
        }
      )

      it(
        "should tokenize multiple identifiers",
        () => {
          const tokenizer = ClangTokenizer.fromCode("abc_123	__1  _z3z")
          let token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Identifier,
            value: "abc_123",
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Identifier,
            value: "__1",
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Identifier,
            value: "_z3z",
            line: 1,
          })
        }
      )

      it(
        "should not tokenize a keyword", () => {
          // pass
        }
      )
    })
  })
})
