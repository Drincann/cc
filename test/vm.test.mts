import { describe, it } from "node:test"
import assert from 'assert/strict'
import { ConditionFlag, LC3Instruction, LC3VirtualMachine, Register, Trap } from "../src/vm/lc3.mjs"
import { visitParameterList } from "typescript"

describe("VirtualMachine", () => {
  describe("ADD", () => {
    it(
      "register mode",
      () => {
        const vm = new LC3VirtualMachine()
        vm.program(
          [
            LC3Instruction.ADD(Register.R0, Register.R1, 'REG', Register.R2),
            LC3Instruction.TRAP(Trap.HALT)
          ]
        )
        vm.setRegister(Register.R1, 0x1234)
        vm.setRegister(Register.R2, 0x5678)
        vm.run()
        const dump = vm.snapshot()
        assert.equal(dump.registers[Register.R0], 0x68ac)
        assert.equal(dump.registers[Register.COND], ConditionFlag.POSTIVE)
      }
    )

    it(
      "immediate mode",
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
        vm.setMemory(0x3001 + 10, 0x7fff)
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
        vm.setMemory(0x3001 - 10,/*neg*/ 0x8000)
        vm.run()
        const dump = vm.snapshot()
        assert.equal(dump.registers[Register.R0], 0x8000)
        assert.equal(dump.registers[Register.COND], ConditionFlag.NEGATIVE)
      }
    )
  })

  describe("AND", () => {
    it(
      "register mode",
      () => {
        const vm = new LC3VirtualMachine()
        vm.program(
          [
            LC3Instruction.AND(Register.R0, Register.R1, 'REG', Register.R2),
            LC3Instruction.TRAP(Trap.HALT)
          ]
        )
        vm.setRegister(Register.R1, 0b0000_1000_0100_0001)
        vm.setRegister(Register.R2, 0b0000_0100_0100_0100)

        vm.run()
        const dump = vm.snapshot()
        assert.equal(dump.registers[Register.R0], 0b0000_0000_0100_0000)
        assert.equal(dump.registers[Register.COND], ConditionFlag.POSTIVE)
      }
    )

    it(
      "immediate mode",
      () => {
        const vm = new LC3VirtualMachine()
        vm.program(
          [
            LC3Instruction.AND(Register.R0, Register.R1, 'IMM', 0b0000_1000_0100_0001),
            LC3Instruction.AND(Register.R2, Register.R1, 'IMM', 0b0000_1000_0101_0001),
            LC3Instruction.TRAP(Trap.HALT)
          ]
        )
        vm.setRegister(Register.R1, 0b0000_1000_0100_0001)

        vm.run()
        const dump = vm.snapshot()
        assert.equal(dump.registers[Register.R0], 0b0000_0000_0000_0001)
        assert.equal(dump.registers[Register.R2], 0b0000_1000_0100_0001)
        assert.equal(dump.registers[Register.COND], ConditionFlag.POSTIVE)
      }
    )
  })
}) // suite ClangTokenizer

function array(size: number) {
  return Array.from({ length: size })
}
