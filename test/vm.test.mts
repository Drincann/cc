import { describe, it } from "node:test"
import assert from 'assert/strict'
import { ConditionFlag, LC3Instruction, LC3VirtualMachine, Register, Trap } from "../src/vm/lc3.mjs"

describe("VirtualMachine", () => {
  describe("ADD", () => {
    it(
      "imm as negative number",
      () => {
        const vm = new LC3VirtualMachine()
        vm.program(
          [
            LC3Instruction.ADD(Register.R0, Register.R1, 'IMM', -1),
            LC3Instruction.TRAP(Trap.HALT)
          ]
        )
        vm.run()
        const dump = vm.snapshot()
        assert.equal(dump.registers[Register.R0], 65535)
        assert.equal(dump.registers[Register.COND], ConditionFlag.NEGATIVE)
      }
    )
  }) // suite ADD

  describe("LDI", () => {
    it(
      "loads a value from positive offset into a register",
      () => {
        const vm = new LC3VirtualMachine()
        vm.program(
          [
            LC3Instruction.LDI(Register.R0, 10),
            LC3Instruction.TRAP(Trap.HALT)
          ]
        )
        vm.setState(0x3001 + 10, 0x7fff)
        vm.run()
        const dump = vm.snapshot()
        assert.equal(dump.registers[Register.R0], 0x7fff)
        assert.equal(dump.registers[Register.COND], ConditionFlag.POSTIVE)
      }
    )

    it(
      "loads a value from negative offset into a register",
      () => {
        const vm = new LC3VirtualMachine()
        vm.program(
          [
            LC3Instruction.LDI(Register.R0, -10),
            LC3Instruction.TRAP(Trap.HALT)
          ]
        )
        vm.setState(0x3001 - 10,/*neg*/ 0x8000)
        vm.run()
        const dump = vm.snapshot()
        assert.equal(dump.registers[Register.R0], 0x8000)
        assert.equal(dump.registers[Register.COND], ConditionFlag.NEGATIVE)
      }
    )
  })
}) // suite ClangTokenizer

function array(size: number) {
  return Array.from({ length: size })
}
