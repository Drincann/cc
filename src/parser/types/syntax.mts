import { ClangTokenType } from "../../tokenizer/index.mjs"

export type DataType = Pointer | Primitive
export interface Pointer {
  dereferenced?: Pointer | Primitive
}

export type Primitive = 'int' | 'char' | 'float' | 'void'

export const tokenType2Primitive = (type: ClangTokenType | undefined): Primitive | undefined => {
  switch (type) {
    case 'Int':
      return 'int'
    case 'Char':
      return 'char'
    case 'Float':
      return 'float'
    case 'Void':
      return 'void'
    default:
      return undefined
  }
}

export type ASTNode =
  | Program
  | FunctionDefinition
  | VariableDefinition

export interface Program {
  type: 'program'
  parent?: undefined
  definitions: (
    | FunctionDefinition
    | VariableDefinition
  )[]
}

export interface Parameter {
  type: "parameter"
  parent?: FunctionDefinition
  name: string
  varType: DataType
}

export interface FunctionDefinition {
  type: 'function'
  parent?: Program
  name: string
  returnType: DataType
  parameters: Parameter[]
  body?: FunctionBody
}

export interface FunctionBody {
  type: 'function-body'
  parent?: FunctionDefinition
  statements: Statement[]
}

export type Statement = VariableDefinition | IfStatement | ReturnStatement // |  WhileStatement | ForStatement

export interface VariableDefinition {
  type: 'variable'
  parent?: Program
  name: string
  varType: DataType
  expression?: Expression
}

export interface IfStatement {
  type: 'if'
  parent?: FunctionBody
  condition: Expression
  then: Statement[]
  else?: Statement[]
  // else if is just an else with an if statement
}

export interface ReturnStatement {
  type: 'return'
  expression: Expression
}

export type Expression = {
  type: 'expression'
}

export type Identifier = FunctionDefinition | VariableDefinition | Parameter


export const isVarDataType = (type?: ClangTokenType): boolean => {
  return type === 'Int' || type === 'Char' || type === 'Float'
}
