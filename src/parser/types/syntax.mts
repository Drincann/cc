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
  | IdentifierDeclaration

export interface Program {
  type: 'program'
  parent?: undefined
  definitions: (
    | FunctionDefinition
    | VariableDefinition
    | FunctionDeclaration
    | VariableDeclaration
  )[]
  symbolTable: Map<string, IdentifierDeclaration>
}

export interface Parameter {
  type: "parameter"
  parent?: ASTNode
  name: string
  varType: DataType
}

export interface FunctionDefinition {
  type: 'function-definition'
  parent?: ASTNode
  name: string
  returnType: DataType
  parameters: Parameter[]
  body?: FunctionBody
  declaration?: FunctionDeclaration
}

export interface FunctionDeclaration {
  type: 'function-declaration'
  parent?: ASTNode
  name: string
  returnType: DataType
  parameters: Parameter[]
  definition?: FunctionDefinition
}

export interface FunctionBody {
  type: 'function-body'
  parent?: ASTNode
  statements: Statement[]
  symbolTable: Map<string, IdentifierDeclaration>
}

export type Statement = VariableDefinition | IfStatement | ReturnStatement // |  WhileStatement | ForStatement

export interface VariableDefinition {
  type: 'variable-definition'
  parent?: ASTNode
  name: string
  varType: DataType
  expression?: Expression
  declaration?: VariableDeclaration
}

export interface VariableDeclaration {
  type: 'variable-declaration'
  parent?: ASTNode
  name: string
  varType: DataType
  declaration?: VariableDefinition
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

export type IdentifierDeclaration = FunctionDefinition | VariableDefinition | FunctionDeclaration | VariableDeclaration | Parameter

export interface Identifier {
  type: 'identifier'
  parent?: ASTNode
  reference: IdentifierDeclaration
}

export type FunctionCall = {
  type: 'function-call'
  parent?: ASTNode
  function: FunctionDefinition | FunctionDeclaration
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
