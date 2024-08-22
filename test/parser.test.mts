import { describe, it } from "node:test"
import assert from 'assert/strict'
import { ClangToken } from "../src/tokenizer/index.mjs"
import { ClangParser } from "../src/parser/index.mjs"

describe("ClangParser", () => {
  describe("#parse()", () => {

    it(
      "variable definition and arithmetic expression",
      () => {
        const code = `
        int staticVar = 2 + 3 * 4 / (5 * 6 + 7 * 8);
        `
        const parser = ClangParser.fromCode(code)
        const root = parser.parse()
        assert.equal(root.type, 'program')
        const defs = root.definitions
        assert.equal(defs.length, 1)
        const def = defs[0]
        assert.equal(def.type, 'variable')
        assert.equal(def.name, 'staticVar')
        assert.equal(def.parent, root)
        assert.equal(def.varType, 'int')
        const expression = def.expression
        assert.equal(expression?.type, 'binary-expression')
        assignable(expression, {
          type: 'binary-expression',
          left: { type: 'number-literal', value: 2 },
          operator: {
            type: 'Add',
            original: ' +'
          },
          right: {
            type: 'binary-expression',
            left: { type: 'number-literal', value: 3 },
            operator: {
              type: 'Multiply',
              original: ' *'
            },
            right: {
              type: 'binary-expression',
              left: { type: 'number-literal', value: 4 },
              operator: {
                type: 'Divide',
                original: ' /'
              },
              right: {
                type: 'binary-expression',
                left: {
                  type: 'binary-expression',
                  left: { type: 'number-literal', value: 5 },
                  operator: {
                    type: 'Multiply',
                    original: ' *'
                  },
                  right: { type: 'number-literal', value: 6 }
                },
                operator: {
                  type: 'Add',
                  original: ' +'
                },
                right: {
                  type: 'binary-expression',
                  left: { type: 'number-literal', value: 7 },
                  operator: {
                    type: 'Multiply',
                    original: ' *'
                  },
                  right: { type: 'number-literal', value: 8 }
                }
              }
            }
          }
        })
      }
    )

  }) // suite next
}) // suite ClangTokenizer

function array(size: number) {
  return Array.from({ length: size })
}

function pick(obj: Record<string, any> | undefined, keys: string[]) {
  if (obj === undefined) return obj
  return keys.reduce((acc, key) => {
    acc[key] = obj[key]
    return acc
  }, {} as Record<string, any>)
}

function iterate(next: () => ClangToken | undefined): ClangToken[] {
  const arr: ClangToken[] = []
  let value: ClangToken | undefined;
  // @ts-ignorek
  while ((value = next()) !== undefined) arr.push(pick(value, ['type', 'value']))
  return arr
}

function assignable(obj: Record<string, any>, isAssignableTo: Record<string, any>) {
  for (const key in isAssignableTo) {
    if (typeof isAssignableTo[key] === 'object') {
      assignable(obj[key], isAssignableTo[key])
      continue
    }
    if (typeof isAssignableTo[key] === 'undefined') {
      assert.equal(obj[key], isAssignableTo[key])
    }
    if (typeof isAssignableTo[key] === 'function') {
      continue
    }
    if (Array.isArray(isAssignableTo[key])) {
      assert.equal(obj[key].length, isAssignableTo[key].length)
      for (let i = 0; i < isAssignableTo[key].length; i++) {
        assignable(obj[key][i], isAssignableTo[key][i])
      }
      continue
    }

    assert.equal(obj[key], isAssignableTo[key])
  }
}