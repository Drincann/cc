import { describe, it } from "node:test"
import assert from 'assert/strict'
import { LC3Instruction, LC3VirtualMachine, Register } from "../src/vm/lc3.mjs"

describe("VirtualMachine", () => {
  describe("#run()", () => {
    it(
      "imm as negative number",
      () => {
        const vm = new LC3VirtualMachine()
        vm.program(
          [
            LC3Instruction.ADD(Register.R0, Register.R1, 'IMM', -1)
          ]
        )
        vm.run()
        const dump = vm.snapshot()
        assert.equal(dump.registers[Register.R0], 65535)
      }
    )
  }) // suite run
}) // suite ClangTokenizer

function array(size: number) {
  return Array.from({ length: size })
}
