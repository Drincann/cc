import { describe, it } from "node:test"
import assert from 'assert/strict'
import { ClangToken, ClangTokenizer } from "../src/tokenizer/index.mjs"
import { ClangParser } from "../src/parser/index.mjs"

describe("ClangParser", () => {
  describe("#parse()", () => {

    describe(
      "1",
      () => {
        const code = `
        int staticVar = 1;
        int main(char* args) {
          int localVar = 2;
          if (localVar == 2) {
        }

          return localVar;
        }
        `
        const parser = ClangParser.fromCode(code)
        console.log(parser.parse())
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
