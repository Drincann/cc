import { VirtualMachineError } from "./error.mjs"
import { shallowCopy, signExtendTo16From5, to5Bits } from "./utils.mjs"

export enum Register {
  R0 = 0, R1, R2, R3, R4, R5, R6, R7,
  PC, COND, COUNT
}

type Opcode =
  | 'ADD' | 'AND' | 'NOT' // add, bitwise and, and bitwise not

  | 'LD' | 'ST' // load and store
  | 'LDR' | 'STR' // load and store register
  | 'LDI' | 'STI' // load and store indirect
  | 'LEA' // load effective address

  | 'BR' // branch
  | 'JMP' // jump
  | 'JSR' // jump register
  | 'RTI' // return from interrupt
  | 'TRAP' // execute trap

  | 'RES' // reserved (unused)

interface HeapDump {
  memory: Uint16Array;
  registers: Record<Register, number>;
}

export class LC3VirtualMachine {
  private memory: Uint16Array = new Uint16Array(65536)

  private running: boolean = false

  private registers: Record<Register, number> = {
    [Register.R0]: 0, [Register.R1]: 0, [Register.R2]: 0, [Register.R3]: 0,
    [Register.R4]: 0, [Register.R5]: 0, [Register.R6]: 0, [Register.R7]: 0,
    [Register.PC]: 0, [Register.COND]: 0, [Register.COUNT]: 0
  };

  public constructor() {
    this.reset()
  }

  public reset() {
    this.running = false
    this.memory.fill(0)
    Object.keys(this.registers).forEach(k => this.registers[k as unknown as Register] = 0)
  }

  public program(code: Uint16Array | LC3Instruction[]) {
    if (!(code instanceof Uint16Array)) {
      code = new Uint16Array([
        0,
        ...code.map(i => i.serialize())
      ])
    }

    if (code.length < 2) {
      throw new VirtualMachineError("Program is empty")
    }

    const origin = code[0]
    if (0xffff - origin + 1 < code.length - 1) {
      throw new VirtualMachineError("Program too large: " + code.length)
    }

    this.memory.set(code.slice(1), origin)
  }

  public snapshot(): HeapDump {
    return {
      memory: shallowCopy(this.memory),
      registers: shallowCopy(this.registers)
    }
  }

  public run() {
    this.running = true
    while (this.running) {
      this.runNext()
    }
  }

  public async runAsync(stop?: () => void): Promise<void> {
    this.running = true
    return new Promise(resolve => {
      Promise.resolve().then(() => {
        this.runNext()

        if (this.running) {
          this.runAsync(stop ?? resolve)
          return
        }

        stop?.()
      })
    })
  }

  private runNext() {
    const inst = this.memory[this.registers[Register.PC]++]
    this.getImpl(inst)(
      ...this.extractOperands(inst)
    )
  }

  private getImpl(inst: number): (...args: number[]) => void {
    const opcode = uint16(inst) >> 12
    if (opcode === 0) {
      return () => this.running = false
    }
    if (opcode === 1) {
      return this.add.bind(this) as any
    }

    throw new VirtualMachineError(`Invalid opcode: ${opcode}`)
  }

  private extractOperands(inst: number): number[] {
    const opcode = inst >> 12
    if (opcode === 0) {
      return []
    }
    if (opcode === 1) {
      return [
        (inst & 0b0000_111_000_0_00_000) >> 9, // dest
        (inst & 0b0000_000_111_0_00_000) >> 6, // src1
        (inst & 0b0000_000_000_1_00_000) >> 5, // mode
        (inst & 0b0000_000_000_1_00_000) >> 5 === 0 // src2 or imm
          ? /* register mode */ (inst & 0b0000_000_000_0_00_111)
          : /* immediate mode */ signExtendTo16From5(inst & 0b0000_000_000_0_11_111)
      ]
    }

    throw new VirtualMachineError(`Invalid opcode: ${opcode}`)
  }



  private add(dest: Register, src1: Register, mode: 0 | 1, src2OrImm: Register | number) {
    if (mode === 0) {
      this.registers[dest] = uint16(this.registers[src1] + this.registers[src2OrImm as Register])
    } else {
      this.registers[dest] = uint16(this.registers[src1] + src2OrImm)
    }
  }
}

function uint16(n: number): number {
  return n & 0xffff
}

export class LC3Instruction {
  public serialize(): number {
    return this.serialized
  }

  public constructor(public type: Opcode, private serialized: number) { }

  public static ADD(dest: Register, src1: Register, mode: 'IMM' | 'REG', src2OrImm: Register | number): LC3Instruction {
    return new LC3Instruction(
      'ADD',
      0x1 << 12
      | (dest << 9)
      | (src1 << 6)
      | ((mode === 'IMM' ? 1 : 0) << 5)
      | (mode === 'IMM'
        ? to5Bits(src2OrImm)
        : src2OrImm)
    )
  }
}
