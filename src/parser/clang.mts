import { ClangToken, ClangTokenizer, ClangTokenType } from '../tokenizer/index.mjs'
import { getCurrentLine } from '../tokenizer/utils.mjs'
import { ParserError } from './error.mjs'
import { tokenType2Primitive, DataType, isVarDataType, Identifier, ASTNode, FunctionDefinition, VariableDefinition, Program, FunctionBody, Expression, Statement, IfStatement, ReturnStatement, Parameter, StringLiteral, AddressOf, Dereference, UnaryExpression, NumberLiteral, BinaryOperatorToken, IdentifierDefinition } from './types/syntax.mjs'
import { ScopedMap } from './utils/scoped-map.mjs'

export class Parser {
  private tokenizer: ClangTokenizer
  private symbolTable: ScopedMap<string, IdentifierDefinition> = new ScopedMap(new Map())

  private codeParsed: string = ''

  private currentToken: ClangToken | undefined

  private constructor(code: string) {
    this.tokenizer = ClangTokenizer.fromCode(code)
  }

  static fromCode(code: string): Parser {
    return new Parser(code)
  }

  public parse(): Program {
    this.next()

    const program: Program = {
      type: 'program',
      parent: undefined,
      definitions: this.parseGlobalDefinitions()
    }

    this.connectParentRecursive(program)
    return program
  }

  private connectParentRecursive<T extends ASTNode>(node: T): T {
    if (node.type === 'program') {
      node.definitions.forEach(declaration => {
        declaration.parent = node
        this.connectParentRecursive(declaration)
      })
    } else if (node.type === 'function') {
      node.parameters.forEach(parameter => {
        parameter.parent = node
      })
    } else if (node.type === 'function-body') {
      node.statements.forEach(statement => {
        statement.parent = node
        this.connectParentRecursive(statement)
      })
    } else if (node.type === 'variable') {
      if (node.expression) {
        node.expression.parent = node
        this.connectParentRecursive(node.expression)
      }
    } else if (node.type === 'address-of') {
      node.expression.parent = node
      this.connectParentRecursive(node.expression)
    } else if (node.type === 'dereference') {
      node.expression.parent = node
      this.connectParentRecursive(node.expression)
    } else if (node.type === 'binary-expression') {
      node.left.parent = node
      node.right.parent = node
      this.connectParentRecursive(node.left)
      this.connectParentRecursive(node.right)
    } else if (node.type === 'function-call') {
      node.arguments.forEach(argument => {
        argument.parent = node
        this.connectParentRecursive(argument)
      })
    } else if (node.type === 'if') {
      node.condition.parent = node
      this.connectParentRecursive(node.condition)
      node.then.forEach(statement => {
        statement.parent = node
        this.connectParentRecursive(statement)
      })
      node.else?.forEach(statement => {
        statement.parent = node
        this.connectParentRecursive(statement)
      })
    } else if (node.type === 'return') {
      node.expression.parent = node
      this.connectParentRecursive(node.expression)
    }
    return node
  }

  /*
    <program> ::= <global_declaration>+
    <global_declaration> ::= <function_declaration> | <variable_declaration>

    <function_declaration> ::= <type> <identifier> '(' <parameter_list> ')' ';'
    
    <function_definition> ::= <type> <identifier> '(' <parameter_list> ')' '{' <function_body> '}'

    <variable_declaration> ::= <type> <identifier> ';'

    <variable_definition> ::= <type> <identifier> '=' <expression> ';'
   */
  private parseGlobalDefinitions(): (FunctionDefinition | VariableDefinition)[] {
    const definitions: (FunctionDefinition | VariableDefinition)[] = []
    while (this.currentToken) {
      definitions.push(this.parseFunctionOrVariable())
    }
    return definitions
  }

  private parseFunctionOrVariable(): FunctionDefinition | VariableDefinition {
    const dataType = this.parseDataType()
    const identifierToken = this.parseNextIdentifier()

    if (this.currentToken?.type === 'Semicolon') {
      // Variable declaration
      this.assertNoDuplicate(identifierToken)
      const variable: VariableDefinition = {
        type: 'variable',
        name: identifierToken.value as string,
        varType: dataType,
        expression: undefined // means it's a declaration
      }

      this.symbolTable.set(
        identifierToken.value as string,
        variable
      )

      return variable
    }

    if (this.tryMatch('Assign')) {
      // Varable definition
      const varValue = this.parseExpression()
      this.match('Semicolon');
      return {
        type: 'variable',
        name: identifierToken.value,
        varType: dataType,
        expression: varValue,
      }
    }

    this.match('LeftParen')
    this.symbolTable = this.symbolTable.getSubScope()
    const parameters = this.parseFunctionParameterList()
    this.match('RightParen')

    /* @ts-ignore */
    if (this.currentToken?.type === 'Semicolon') {
      // Function declaration
      this.symbolTable = this.symbolTable.getParentScope()
      this.assertNoDuplicate(identifierToken)

      const func: FunctionDefinition = {
        type: 'function',
        name: identifierToken.value as string,
        parameters,
        returnType: dataType,
        body: undefined
      }

      this.symbolTable.set(
        identifierToken.value as string,
        func
      )
      return func
    }

    if (this.currentToken?.type === 'LeftBrace') {
      // Function definition
      this.match('LeftBrace')
      const body = this.parseFunctionBody()
      this.checkReturn(dataType, body, identifierToken)

      this.symbolTable = this.symbolTable.getParentScope()
      this.match('RightBrace')

      const func: FunctionDefinition = {
        type: 'function',
        name: identifierToken!.value as string,
        parameters,
        body: body,
        returnType: dataType
      }

      this.symbolTable.set(
        identifierToken!.value as string,
        func
      )

      return func
    }

    if (this.currentToken?.type === 'Equal') {
      // Variable definition
      this.match('Equal')
      const value = this.parseExpression()
      this.match('Semicolon')

      const variable: VariableDefinition = {
        type: 'variable',
        name: identifierToken.value as string,
        varType: dataType,
        expression: value
      }

      this.symbolTable.set(
        identifierToken.value as string,
        variable
      )

      return variable
    }

    throw new ParserError('Unexpected token: ' + this.currentToken?.type + ' near line ' + this.currentToken?.line + ': \'' + getCurrentLine(this.codeParsed) + '\'')
  }

  private checkReturn(dataType: DataType, body: FunctionBody, identifierToken: ClangToken<"Identifier">) {
    if (dataType === 'void' && body.statements.some(statement => statement.type === 'return')) {
      throw new ParserError('Function <' + identifierToken.value + '> with return statement must have a return type')
    }
    if (dataType != 'void' && !body.statements.some(statement => statement.type === 'return')) {
      throw new ParserError('Function <' + identifierToken.value + '> without return statement must have a void return type')
    }
  }

  private parseExpression(priority: number = 0): Expression {
    let left: Expression | undefined = this.tryParseUnary()
    if (left === undefined) {
    }

    if (left === undefined) {
      throw new ParserError('Unexpected token: ' + this.currentToken?.type + ' near line ' + this.currentToken?.line + ': \'' + getCurrentLine(this.codeParsed) + '\'')
    }

    while (this.isBinaryOperator(this.currentToken) && this.getPriority(this.currentToken.type) > priority) {
      const operator = this.currentToken
      this.next()
      left = {
        type: 'binary-expression',
        left,
        operator,
        right: this.parseExpression(this.getPriority(operator.type))
      }
    }

    return left as Expression
  }

  private isBinaryOperator(token: ClangToken | undefined): token is BinaryOperatorToken {
    return token?.type === 'Add' || token?.type === 'Subtract' || token?.type === 'Multiply' || token?.type === 'Divide' || token?.type === 'Assign' || token?.type === 'Equal'
  }

  private tryParseUnary(): Expression | undefined {
    if (this.currentToken?.type === 'String') {
      const value = this.currentToken.value as string
      this.match('String')
      return {
        type: 'string-literal',
        value
      }
    } else if (this.currentToken?.type === 'Number') {
      const value = this.currentToken.value as number
      this.match('Number')
      return {
        type: 'number-literal',
        value
      }
    } else if (this.currentToken?.type === 'Identifier') {
      const identifier = this.symbolTable.get(this.currentToken.value as string)
      if (identifier === undefined) {
        throw new ParserError('Undefined identifier: ' + this.currentToken.value + ' near line ' + this.currentToken.line + ': \'' + getCurrentLine(this.codeParsed) + '\'')
      }

      this.match('Identifier')
      return {
        type: 'identifier',
        reference: identifier,
      }
    } else if (this.currentToken?.type === 'LeftParen') {
      this.match('LeftParen')
      const expression = this.parseExpression()
      this.match('RightParen')
      return expression
    }
  }
  private getPriority(type: BinaryOperatorToken['type'] | undefined): number {
    if (type === undefined) {
      throw new ParserError(`Invalid binary operator: ${type}`)
    }

    return {
      'Add': 2,
      'Subtract': 2,
      'Multiply': 3,
      'Divide': 4,
      'Assign': 0,
      'Equal': 1,
    }[type]
  }

  private tryParseCast() {
    throw new Error('Method not implemented.')
  }

  private tryParseAddressOf(): AddressOf | undefined {
    return undefined
  }

  private tryParseDereference(): Dereference | undefined {
    return undefined
  }

  private tryParseIdentifierOrFunctionCall() {
    return undefined
  }

  private tryParseNumberLiteral(): NumberLiteral | undefined {
    if (this.currentToken?.type === 'Number') {
      this.match('Number')
      return {
        type: 'number-literal',
        value: this.currentToken.value as number
      }
    }

    return undefined
  }

  private tryParseStringLiteral(): StringLiteral | undefined {
    if (this.currentToken?.type === 'String') {
      this.match('String')
      return {
        type: 'string-literal',
        value: this.currentToken.value as string
      }
    }

    return undefined
  }

  private parseFunctionBody(): FunctionBody {
    return {
      type: 'function-body',
      statements: this.parseStatements()
    }
  }

  private parseStatements(): Statement[] {
    const statements: Statement[] = []

    while (this.currentToken?.type !== 'RightBrace') {
      if (this.currentToken?.type === 'Semicolon') {
        this.next()
        continue
      }

      if (isVarDataType(this.currentToken?.type)) {
        statements.push(this.parseVariableDefinition())
        continue
      }

      if (this.currentToken?.type === 'If') {
        statements.push(this.parseIfStatement())
        continue
      }

      if (this.currentToken?.type === 'Return') {
        statements.push(this.parseReturnStatement())
        /* @ts-ignore */
        if (this.currentToken?.type !== 'RightBrace') {
          throw new ParserError('Unreachable code after return statement near line ' + this.currentToken?.line + ': \'' + getCurrentLine(this.codeParsed) + '\'')
        }
        continue
      }
    }

    return statements
  }

  private parseVariableDefinition(): VariableDefinition {
    const dataType = this.parseDataType()
    const identifierToken = this.parseNextIdentifier()

    if (this.currentToken?.type === 'Semicolon') {
      // Variable declaration
      this.assertNoDuplicate(identifierToken)
      const variable: VariableDefinition = {
        type: 'variable',
        name: identifierToken.value as string,
        varType: dataType,
        expression: undefined // means it's a declaration
      }

      this.symbolTable.set(
        identifierToken.value as string,
        variable
      )

      return variable
    }

    if (this.currentToken?.type === 'Assign') {
      // Variable definition
      this.match('Assign')
      const value = this.parseExpression()
      this.match('Semicolon')

      const variable: VariableDefinition = {
        type: 'variable',
        name: identifierToken.value as string,
        varType: dataType,
        expression: value
      }

      this.symbolTable.set(
        identifierToken.value as string,
        variable
      )

      return variable
    }

    throw new ParserError('Unexpected token: ' + this.currentToken?.type + ' near line ' + this.currentToken?.line + ': \'' + getCurrentLine(this.codeParsed) + '\'')
  }

  /*
    <if_statement> ::= "if" "(" <expression> ")" <if_then> ("else " <if_then>)?
    <if_then> ::= "{" <statements> "}" | <statement>

    <statements> ::= <statement> <statements> | E
  */
  private parseIfStatement(): IfStatement {
    this.match('If')

    this.match('LeftParen')
    const condition = this.parseExpression()
    this.match('RightParen')

    const ifTrue = this.parseIfThenStatements()

    if (this.tryMatch('Else')) {
      const ifFalse = this.parseIfThenStatements()
      return {
        type: 'if',
        condition,
        then: ifTrue,
        else: ifFalse,
      }
    }

    return {
      type: 'if',
      condition,
      then: ifTrue,
      else: [],
    }
  }

  private parseIfThenStatements(): Statement[] {
    let ifThenStatements: Statement[] = []
    if (this.tryMatch('LeftBrace')) {
      ifThenStatements = this.parseStatements()
      this.match('RightBrace')
    } else {
      ifThenStatements = this.parseStatements()
    }
    return ifThenStatements
  }

  private parseReturnStatement(): ReturnStatement {
    this.match('Return')
    const returnValue = this.parseExpression()
    this.match('Semicolon')
    return {
      type: 'return',
      expression: returnValue
    }
  }

  private parseFunctionParameterList(): Parameter[] {
    const parameters: Parameter[] = []
    while (this.currentToken?.type !== 'RightParen') {
      const dataType = this.parseDataType()
      const identifierToken = this.assertNoDuplicate(this.parseNextIdentifier())
      parameters.push({
        type: 'parameter',
        name: identifierToken.value as string,
        varType: dataType
      })
      this.tryMatch('Comma')
    }

    return parameters
  }

  private assertNoDuplicate(identifierToken: ClangToken<"Identifier">): ClangToken<"Identifier"> {
    ParserError.assert(
      !this.symbolTable.scopeHas(identifierToken.value),
      'Duplicate identifier: <' + identifierToken.value + '>' + ' near line ' + identifierToken.line + ': \'' + getCurrentLine(this.codeParsed) + '\''
    )
    return identifierToken
  }

  private tryMatch(type: ClangTokenType): boolean {
    if (this.currentToken?.type === type) {
      this.next()
      return true
    }

    return false
  }

  private parseNextIdentifier(): ClangToken<'Identifier'> {
    const identifierToken = this.currentToken
    this.match('Identifier')

    ParserError.assert(
      typeof identifierToken?.value === 'string',
      'Expected identifier, but got: ' + identifierToken?.original + ' near line ' + identifierToken?.line + ': \'' + getCurrentLine(this.codeParsed) + '\''
    )

    return identifierToken as ClangToken<'Identifier'>
  }

  /*
    <type> ::= ("int" | "char" | "float" | "void") "*"*
  */
  private parseDataType(): DataType {
    let type: DataType | undefined = tokenType2Primitive(this.currentToken?.type)
    ParserError.assert(
      type != undefined,
      'Expected type, but got: ' + this.currentToken?.value + ' near line ' + this.currentToken?.line + ': \'' + getCurrentLine(this.codeParsed) + '\''
    )
    this.next()

    while (this.currentToken?.type === 'Multiply') {
      type = { dereferenced: type }
      this.next()
    }

    return type!
  }

  private next(): void {
    this.currentToken = this.tokenizer.next()
    this.codeParsed += this.currentToken?.original ?? ''
  }

  private match(type: ClangTokenType): void {
    ParserError.assert(
      this.currentToken?.type === type,
      `Unexpected token: <${this.currentToken?.type}> near line ${this.currentToken?.line}: '<${getCurrentLine(this.codeParsed)}>`
    )
    this.next()
  }
}
