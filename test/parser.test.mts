import util from 'util'
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
        assert.equal(def.type, 'variable-definition')
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

    it(
      "recursive cross call",
      () => {
        const code = `
        int callB(int param);
        int callA(int param) {
          return callB(param) + 1;
        }

        int callB(int param) {
          return param;
        }
        `

        const parser = ClangParser.fromCode(code)
        const root = parser.parse()
        assert.equal(root.type, 'program')
        const defs = root.definitions
        assert.equal(defs.length, 3)
        const declB = defs[0]
        const defA = defs[1]
        const defB = defs[2]
        assignable(declB, {
          type: 'function-declaration',
          name: 'callB',
          returnType: 'int',
          parameters: [{ type: 'parameter', name: 'param', varType: 'int' }]
        }, 'root.definitions[0]')
        assignable(defA, {
          type: 'function-definition',
          name: 'callA',
          returnType: 'int',
          parameters: [{ type: 'parameter', name: 'param', varType: 'int' }],
          body: {
            type: 'function-body',
            statements: [{
              type: 'return',
              expression: {
                type: 'binary-expression',
                operator: { type: 'Add', original: ' +' },
                left: {
                  type: 'function-call',
                  arguments: [{ type: 'identifier', reference: { type: 'parameter', name: 'param', varType: 'int' } }],
                  function: { type: 'function-declaration', name: 'callB' }
                },
                right: { type: 'number-literal', value: 1 }
              }
            }]
          }
        }, 'root.definitions[1]')
        assignable(defB, {
          type: 'function-definition',
          name: 'callB',
          returnType: 'int',
          parameters: [{ type: 'parameter', name: 'param', varType: 'int' }],
          body: {
            type: 'function-body',
            statements: [{
              type: 'return',
              expression: { type: 'identifier', reference: { type: 'parameter', name: 'param', varType: 'int' } }
            }]
          }
        }, 'root.definitions[2]')
      }
    )

    it(
      'recursive call',
      () => {
        const code = `
        int main(char* args) {
          return main(args);
        }`

        const parser = ClangParser.fromCode(code)
        const root = parser.parse()

        assert.equal(root.type, 'program')
        const defs = root.definitions
        assert.equal(defs.length, 1)
        const mainFun = defs[0]
        assert.equal(mainFun.type, 'function-definition')
        assert.equal(mainFun.body?.statements[0].type, 'return')
        assert.equal(mainFun.body?.statements[0].expression.type, 'function-call')
        assert.equal(mainFun.body?.statements[0].expression.function, mainFun.declaration)
      }
    )

    it(
      'no referenced directly or indirectly in its own initializer',
      () => {
        const code = `
        int a = a;
        `

        const parser = ClangParser.fromCode(code)
        try {
          const root = parser.parse()
        } catch (e) {
          assert.equal((e as any)?.message?.includes('Undefined identifier: a'), true)
          return // pass
        }
        assert.fail('should throw error')
      }
    )

    it(
      'function declaration and definition set each other',
      () => {
        const code = `
        void fun();
        void fun() { }
        `

        const parser = ClangParser.fromCode(code)
        const root = parser.parse()
        assert.equal(root.type, 'program')
        const defs = root.definitions
        assert.equal(defs.length, 2)
        const decl = defs[0]
        const def = defs[1]
        assert.equal(decl.type, 'function-declaration')
        assert.equal(def.type, 'function-definition')
        assert.equal(decl.definition, def)
        assert.equal(def.declaration, decl)
      }
    )

    it(
      'function declaration and definition parameters type not match',
      () => {
        const code = `
        void fun(int a, int b);
        void fun(int a, char b) { }
        `

        const parser = ClangParser.fromCode(code)
        try {
          parser.parse()

        } catch (e) {
          assert.equal((e as any)?.message?.includes('parameter list does not match the previous declaration'), true)
          return // pass
        }
        assert.fail('should throw error')
      }
    )

    it(
      'function declaration and definition parameters name not match is allowed',
      () => {
        const code = `
        void fun(int a, int b);
        void fun(int c, int d) { }
        `

        const parser = ClangParser.fromCode(code)
        parser.parse()
        // pass
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

function assignable(obj: Record<string, any>, isAssignableTo: Record<string, any>, path = '$') {
  for (const key in isAssignableTo) {
    if (typeof isAssignableTo[key] === 'object') {
      assignable(obj[key], isAssignableTo[key], `${path}.${key}`)
      continue
    }
    if (typeof isAssignableTo[key] === 'undefined') {
      assert.equal(obj[key], isAssignableTo[key], `key: ${path}.${key}, excepted <${isAssignableTo[key]}>, got <${obj[key]}>`)
    }
    if (typeof isAssignableTo[key] === 'function') {
      continue
    }
    if (Array.isArray(isAssignableTo[key])) {
      assert.equal(obj[key].length, isAssignableTo[key].length)
      for (let i = 0; i < isAssignableTo[key].length; i++) {
        assignable(obj[key][i], isAssignableTo[key][i], `${path}.${key}[${i}]`)
      }
      continue
    }

    assert.equal(obj[key], isAssignableTo[key], `key: ${path}.${key}, excepted <${isAssignableTo[key]}>, got ${obj[key]}>`)
  }
}