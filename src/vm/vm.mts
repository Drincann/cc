import { VirtualMachineError } from "./error.mjs"
import { reverse, shallowCopy } from "./utils.mjs"

type InstructionArgs<Type extends InstructionType> =
  Type extends 'IMM' ? [number] :
  [undefined]

// inst code --> inst name
const instructionNames = {
  0: 'MOV',
} as const

// inst name --> inst code
const instructionCodes = reverse(instructionNames)

type InstructionType = keyof typeof instructionCodes
export class Instruction<Type extends InstructionType = InstructionType> {
  public type: Type
  public args: InstructionArgs<Type>

  private constructor(type: Type, ...args: InstructionArgs<Type>) {
    this.type = type
    this.args = args
  }

  public toString(): string {
    return this.type + ' ' + this.args.join(' ')
  }
}

export class VirtualMachine {
  private text: Instruction[] = []
  private stack: Uint8Array

  // registers
  private ax = 0
  private bx = 0
  private cx = 0
  private dx = 0
  private pc = 0
  private bp = 0
  private sp = 0

  public constructor(size: number) {
    this.stack = new Uint8Array(size)
  }

  public program(instructions: Instruction[]): VirtualMachine {
    this.reset()
    this.text = shallowCopy(instructions)
    this.sp = 0
    this.bp = this.sp

    return this
  }

  private reset() {
    this.stack = this.stack.fill(0)
    this.pc = 0
    this.ax = 0
    this.bp = 0
    this.sp = 0
  }

  public snapshot(): {
    stack: number[],
    registers: {
      pc: number,
      ax: number,
      bp: number,
      sp: number
    }
  } {
    return {
      stack: shallowCopy(Array.from(this.stack)),
      registers: {
        pc: this.pc,
        ax: this.ax,
        bp: this.bp,
        sp: this.sp
      }
    }
  }

  public run(): number {
    while (this.pc < this.text.length && this.text[this.pc] !== undefined) {
      const inst = this.text[this.pc]
      if (inst.type === 'MOV') {
        // impl
      } else {
        throw new VirtualMachineError('Unknown instruction: ' + inst)
      }

      this.pc++
    }

    return this.ax
  }
}
