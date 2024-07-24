import { describe, it } from "node:test"
import assert from 'assert/strict'
import { ClangTokenizer } from '../src/tokenizer.mjs'
import { TokenType } from "../src/tokenizer.mjs"
import { link } from "fs"

describe("ClangTokenizer", () => {
  describe("#next()", () => {

    describe("identifier", () => {
      it(
        "tokenize a single identifier",
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
        "tokenize an identifier with underscore",
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
        "tokenize multiple identifiers",
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

          token = tokenizer.next()
          assert.equal(token, undefined)
        }
      )

      it(
        "should not tokenize a keyword", () => {
          // pass
        }
      )
    })


    describe("number", () => {
      it(
        "0 is a decimal number",
        () => {
          const tokenizer = ClangTokenizer.fromCode("0")
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: "0",
            line: 1,
          })
        }
      )

      it(
        "123 is a decimal number",
        () => {
          const tokenizer = ClangTokenizer.fromCode("123")
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: "123",
            line: 1,
          })
        }
      )

      it(
        "1.23 is a floating point number",
        () => {
          const tokenizer = ClangTokenizer.fromCode("1.23")
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: "1.23",
            line: 1,
          })
        }
      )

      it(
        "0.123 is a floating point number",
        () => {
          const tokenizer = ClangTokenizer.fromCode("0.123")
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: "0.123",
            line: 1,
          })
        }
      )

      it(
        ".123 is a floating point number",
        () => {
          const tokenizer = ClangTokenizer.fromCode(".123")
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: "0.123",
            line: 1,
          })
        }
      )

      it(
        "support underscore in number",
        () => {
          const tokenizer = ClangTokenizer.fromCode("1_2_3 1.2_3 .12__3")
          let token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: "123",
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: "1.23",
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: "0.123",
            line: 1,
          })
        }
      )

      it(
        "0x123abcdef is a hexadecimal number",
        () => {
          const tokenizer = ClangTokenizer.fromCode("0x123abcdef")
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: "0x123abcdef",
            line: 1,
          })
        }
      )

      it(
        "0x123abcdefg is not a hexadecimal number",
        () => {
          const tokenizer = ClangTokenizer.fromCode("0x123abcdefg")
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: "0x123abcdef",
            line: 1,
          })
        }
      )

      it(
        "01234567 is an octal number",
        () => {
          const tokenizer = ClangTokenizer.fromCode("01234567")
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: "01234567",
            line: 1,
          })
        }
      )

      it(
        "012345678 is not an octal number",
        () => {
          const tokenizer = ClangTokenizer.fromCode("012345678")
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: "01234567",
            line: 1,
          })
        }
      )

      it(
        "081 is not an octal number",
        () => {
          const tokenizer = ClangTokenizer.fromCode("081")
          let token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: "0",
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: "81",
            line: 1,
          })
        })

      it(
        "0x is not a hexadecimal number",
        () => {
          const tokenizer = ClangTokenizer.fromCode("0x")
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: "0",
            line: 1,
          })
        }
      )

      it(
        "tokenize multiple numbers",
        () => {
          const tokenizer = ClangTokenizer.fromCode(" 123   0x456 0x7af89 0.00001 079")
          let token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: "123",
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: "0x456",
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: "0x7af89",
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: "0.00001",
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: "07",
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: "9",
            line: 1,
          })
        }
      )
    })
  })
})
