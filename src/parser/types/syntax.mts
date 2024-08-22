import { ClangToken, ClangTokenType } from "../../tokenizer/index.mjs"

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
  | Parameter
  | FunctionBody
  | Statement
  | Expression
  | Identifier
  | IdentifierDefinition

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
  parent?: ASTNode
  name: string
  varType: DataType
}

export interface FunctionDefinition {
  type: 'function'
  parent?: ASTNode
  name: string
  returnType: DataType
  parameters: Parameter[]
  body?: FunctionBody
}

export interface FunctionBody {
  type: 'function-body'
  parent?: ASTNode
  statements: Statement[]
}

export type Statement = VariableDefinition | IfStatement | ReturnStatement // |  WhileStatement | ForStatement

export interface VariableDefinition {
  type: 'variable'
  parent?: ASTNode
  name: string
  varType: DataType
  expression?: Expression
}

export interface IfStatement {
  type: 'if'
  parent?: ASTNode
  condition: Expression
  then: Statement[]
  else?: Statement[]
  // else if is just an else with an if statement
}

export interface ReturnStatement {
  type: 'return'
  parent?: ASTNode
  expression: Expression
}

export type Expression = BinaryExpression | UnaryExpression

export type UnaryExpression = StringLiteral | NumberLiteral | Identifier | FunctionCall | Dereference | AddressOf

export interface BinaryExpression {
  type: 'binary-expression'
  parent?: ASTNode
  operator: BinaryOperatorToken
  left: Expression
  right: Expression
}

export type BinaryOperatorToken = ClangToken<'Add' | 'Subtract' | 'Multiply' | 'Divide' | 'Assign' | 'Equal'>

export type StringLiteral = {
  type: 'string-literal'
  parent?: ASTNode
  value: string
}

export type NumberLiteral = {
  type: 'number-literal'
  parent?: ASTNode
  value: number
}

export type IdentifierDefinition = FunctionDefinition | VariableDefinition | Parameter

export interface Identifier {
  type: 'identifier'
  parent?: ASTNode
  reference: IdentifierDefinition
}

export type FunctionCall = {
  type: 'function-call'
  parent?: ASTNode
  function: FunctionDefinition
  arguments: Expression[]
}


export type Dereference = {
  type: 'dereference'
  parent?: ASTNode
  expression: Expression
}

export type AddressOf = {
  type: 'address-of'
  parent?: ASTNode
  expression: Expression
}

export const isVarDataType = (type?: ClangTokenType): boolean => {
  return type === 'Int' || type === 'Char' || type === 'Float'
}
