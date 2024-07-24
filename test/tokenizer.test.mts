import { describe, it } from "node:test"
import assert from 'assert/strict'
import { ClangTokenizer } from '../src/tokenizer.mjs'
import { TokenType } from "../src/tokenizer.mjs"

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
            value: 0,
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
            value: 123,
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
            value: 1.23,
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
            value: 0.123,
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
            value: 0.123,
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
            value: 123,
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: 1.23,
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: 0.123,
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
            value: 0x123abcdef,
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
            value: 0x123abcdef,
            line: 1,
          })
        }
      )

      it(
        "00 is an octal number",
        () => {
          const tokenizer = ClangTokenizer.fromCode("00")
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: 0o0,
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
            value: 0o1234567,
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
            value: 0o1234567,
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
            value: 0,
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: 81,
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
            value: 0,
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
            value: 123,
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: 0x456,
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: 0x7af89,
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: 0.00001,
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: 0o7,
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.Number,
            value: 9,
            line: 1,
          })
        }
      )
    }) // suite number

    describe("string", () => {
      it(
        "tokenize a double quote string",
        () => {
          const tokenizer = ClangTokenizer.fromCode('"abc"')
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.String,
            value: "abc",
            line: 1,
          })
        }
      )

      it(
        "escape double quote",
        () => {
          const tokenizer = ClangTokenizer.fromCode('"c\\"d"')
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.String,
            value: 'c"d',
            line: 1,
          })
        })

      it(
        "handle escape at the start of string",
        () => {
          const tokenizer = ClangTokenizer.fromCode('"\\"def"')
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.String,
            value: '"def',
            line: 1,
          })
        }
      )

      it(
        "handle escape at the end of string",
        () => {
          const tokenizer = ClangTokenizer.fromCode('"abc\\""')
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.String,
            value: 'abc"',
            line: 1,
          })
        }
      )

      it(
        "handle whitespace in string",
        () => {
          const tokenizer = ClangTokenizer.fromCode('"a b c"')
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.String,
            value: 'a b c',
            line: 1,
          })
        }
      )

      it(
        "handle \\r \\0 \\t \\n escape in double quote string",
        () => {
          const tokenizer = ClangTokenizer.fromCode('"\\r\\0\\t\\n"')
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.String,
            value: '\r\0\t\n',
            line: 1,
          })
        }
      )

      it(
        "handle \\r \\0 \\t \\n escape in single quote string",
        () => {
          let tokenizer = ClangTokenizer.fromCode("'\0'")
          let token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.String,
            value: '\0',
            line: 1,
          })

          tokenizer = ClangTokenizer.fromCode("'\r'")
          token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.String,
            value: '\r',
            line: 1,
          })

          tokenizer = ClangTokenizer.fromCode("'\t'")
          token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.String,
            value: '\t',
            line: 1,
          })

          tokenizer = ClangTokenizer.fromCode("'\n'")
          token = tokenizer.next()
          assert.deepEqual(token, {
            type: TokenType.String,
            value: '\n',
            line: 1,
          })
        }
      )

      it(
        "assert throw on unterminated double quote string",
        () => {
          const tokenizer = ClangTokenizer.fromCode('"abc')
          // tokenizer.next()
          assert.throws(() => tokenizer.next(), new Error("TokenizerError: unterminated string literal at line 1. near: \"abc"))
        }
      )

      it(
        "assert throw on unterminated single quote string",
        () => {
          const tokenizer = ClangTokenizer.fromCode("'abc")
          assert.throws(() => tokenizer.next(), new Error("TokenizerError: unterminated string literal at line 1. near: 'abc"))
        }
      )

    }) // suite string
  }) // suite next
}) // suite ClangTokenizer
