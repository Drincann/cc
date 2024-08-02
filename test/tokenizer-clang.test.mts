import { describe, it } from "node:test"
import assert from 'assert/strict'
import { ClangTokenizer } from "../src/tokenizer/index.mjs"

describe("ClangTokenizer", () => {
  describe("#next()", () => {

    describe("identifier", () => {
      it(
        "tokenize a single identifier",
        () => {
          const tokenizer = ClangTokenizer.fromCode("a")
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Identifier',
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
            type: 'Identifier',
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
            type: 'Identifier',
            value: "abc_123",
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Identifier',
            value: "__1",
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Identifier',
            value: "_z3z",
            line: 1,
          })

          token = tokenizer.next()
          assert.equal(token, undefined)
        }
      )

      it(
        "tokenize multiple identifiers with \\n",
        () => {
          const tokenizer = ClangTokenizer.fromCode("abc_123	\n__1\n  _z3z")
          let token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Identifier',
            value: "abc_123",
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Identifier',
            value: "__1",
            line: 2,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Identifier',
            value: "_z3z",
            line: 3,
          })

          token = tokenizer.next()
          assert.equal(token, undefined)

        }
      )

      it(
        "tokenize keyword", () => {
          const tokenizer = ClangTokenizer.fromCode("return if else while enum \nint char void sizeof\n")

          assert.deepEqual(
            array(9).map(tokenizer.next.bind(tokenizer)),
            [
              { type: 'Return', value: undefined, line: 1 },
              { type: 'If', value: undefined, line: 1 },
              { type: 'Else', value: undefined, line: 1 },
              { type: 'While', value: undefined, line: 1 },
              { type: 'Enum', value: undefined, line: 1 },
              { type: 'Int', value: undefined, line: 2 },
              { type: 'Char', value: undefined, line: 2 },
              { type: 'Void', value: undefined, line: 2 },
              { type: 'SizeOf', value: undefined, line: 2 },
            ]
          )
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
            type: 'Number',
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
            type: 'Number',
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
            type: 'Number',
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
            type: 'Number',
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
            type: 'Number',
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
            type: 'Number',
            value: 123,
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Number',
            value: 1.23,
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Number',
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
            type: 'Number',
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
            type: 'Number',
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
            type: 'Number',
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
            type: 'Number',
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
            type: 'Number',
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
            type: 'Number',
            value: 0,
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Number',
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
            type: 'Number',
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
            type: 'Number',
            value: 123,
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Number',
            value: 0x456,
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Number',
            value: 0x7af89,
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Number',
            value: 0.00001,
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Number',
            value: 0o7,
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Number',
            value: 9,
            line: 1,
          })
        }
      )

      it(
        "tokenize multiple numbers with \\n",
        () => {
          const tokenizer = ClangTokenizer.fromCode(" 123   \n0x456 0x7af89\n 0.00001 079")
          let token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Number',
            value: 123,
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Number',
            value: 0x456,
            line: 2,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Number',
            value: 0x7af89,
            line: 2,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Number',
            value: 0.00001,
            line: 3,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Number',
            value: 0o7,
            line: 3,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Number',
            value: 9,
            line: 3,
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
            type: 'String',
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
            type: 'String',
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
            type: 'String',
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
            type: 'String',
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
            type: 'String',
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
            type: 'String',
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
            type: 'String',
            value: '\0',
            line: 1,
          })

          tokenizer = ClangTokenizer.fromCode("'\r'")
          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'String',
            value: '\r',
            line: 1,
          })

          tokenizer = ClangTokenizer.fromCode("'\t'")
          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'String',
            value: '\t',
            line: 1,
          })

          tokenizer = ClangTokenizer.fromCode("'\n'")
          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'String',
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

    describe("comment", () => {
      it(
        "empty comment",
        () => {
          const tokenizer = ClangTokenizer.fromCode("//\n// \n //\n // ")
          let token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Comment',
            value: "",
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Comment',
            value: " ",
            line: 2,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Comment',
            value: "",
            line: 3,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Comment',
            value: " ",
            line: 4,
          })
        }
      )

      it(
        "empty comment",
        () => {
          const tokenizer = ClangTokenizer.fromCode("//\n1\n")
          let token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Comment',
            value: "",
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Number',
            value: 1,
            line: 2,
          })
        }
      )
    }) // suite comment

    describe("division", () => {
      it("division and comment",
        () => {
          const tokenizer = ClangTokenizer.fromCode(" / // ")
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Divide',
            value: undefined,
            line: 1,
          })

          assert.deepEqual(tokenizer.next(), {
            type: 'Comment',
            value: " ",
            line: 1,
          })
        }
      )

      it("division and comment - 1",
        () => {
          const tokenizer = ClangTokenizer.fromCode("///")
          const token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Comment',
            value: "/",
            line: 1,
          })
        }
      )
    })

    describe("others", () => {
      it("all",
        () => {
          const tokenizer = ClangTokenizer.fromCode(" = \n+++---*/%!=< <=> >=<<>>|||&&&!~^([{)]}?:;,")
          const actual = array(33).map(tokenizer.next.bind(tokenizer))
          assert.deepEqual(
            actual,
            [
              { type: 'Assign', value: undefined, line: 1 },
              { type: 'Increment', value: undefined, line: 2 },
              { type: 'Add', value: undefined, line: 2 },
              { type: 'Decrement', value: undefined, line: 2 },
              { type: 'Subtract', value: undefined, line: 2 },
              { type: 'Multiply', value: undefined, line: 2 },
              { type: 'Divide', value: undefined, line: 2 },
              { type: 'Mod', value: undefined, line: 2 },
              { type: 'NotEqual', value: undefined, line: 2 },
              { type: 'LessThan', value: undefined, line: 2 },
              { type: 'LessThanEqual', value: undefined, line: 2 },
              { type: 'GreaterThan', value: undefined, line: 2 },
              { type: 'GreaterThanEqual', value: undefined, line: 2 },
              { type: 'ShiftLeft', value: undefined, line: 2 },
              { type: 'ShiftRight', value: undefined, line: 2 },
              { type: 'LogicOr', value: undefined, line: 2 },
              { type: 'BitwiseOr', value: undefined, line: 2 },
              { type: 'LogicAnd', value: undefined, line: 2 },
              { type: 'BitwiseAnd', value: undefined, line: 2 },
              { type: 'LogicNot', value: undefined, line: 2 },
              { type: 'BitwiseNot', value: undefined, line: 2 },
              { type: 'BitwiseXor', value: undefined, line: 2 },
              { type: 'LeftParen', value: undefined, line: 2 },
              { type: 'LeftBracket', value: undefined, line: 2 },
              { type: 'LeftBrace', value: undefined, line: 2 },
              { type: 'RightParen', value: undefined, line: 2 },
              { type: 'RightBracket', value: undefined, line: 2 },
              { type: 'RightBrace', value: undefined, line: 2 },
              { type: 'Conditional', value: undefined, line: 2 },
              { type: 'Colon', value: undefined, line: 2 },
              { type: 'Semicolon', value: undefined, line: 2 },
              { type: 'Comma', value: undefined, line: 2 },
              undefined
            ],
          )
        })
    }) // suite others

    describe("use cases", () => {
      it(
        "assign",
        () => {
          const tokenizer = ClangTokenizer.fromCode("a = 123;")
          let token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Identifier',
            value: "a",
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Assign',
            value: undefined,
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Number',
            value: 123,
            line: 1,
          })

          token = tokenizer.next()
          assert.deepEqual(token, {
            type: 'Semicolon',
            value: undefined,
            line: 1,
          })

          token = tokenizer.next()
          assert.equal(token, undefined)
        }
      )

    }) // suite use cases
  }) // suite next
}) // suite ClangTokenizer

function array(size: number) {
  return Array.from({ length: size })
}