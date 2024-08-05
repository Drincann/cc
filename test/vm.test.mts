import { describe, it } from "node:test"
import assert from 'assert/strict'
import { VirtualMachine } from "../src/vm/vm.mjs"

describe("VirtualMachine", () => {
  describe("#run()", () => {
    it(
      "init",
      () => {
        const vm = new VirtualMachine(1024);
        vm.program([]).run()

        assert.deepEqual(
          vm.snapshot(),
          {
            stack: array(1024).fill(0),
            registers: {
              pc: 0,
              ax: 0,
              bp: 0,
              sp: 0
            }
          }
        )
      }
    )

  }) // suite run
}) // suite ClangTokenizer

function array(size: number) {
  return Array.from({ length: size })
}