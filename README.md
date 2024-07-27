# C Interpreter In TypeScript

## dependencies

Node.js v20+

## build

```bash
npm i && npm run build
```

## test

```bash
npm test
```

## run demo

```bash
npx ts-node src/index.mts src/demo/hello.c

# { type: 'Int', value: undefined, line: 1 }
# { type: 'Identifier', value: 'main', line: 1 }
# { line: 1, type: 'LeftParen', value: undefined }
# { line: 1, type: 'RightParen', value: undefined }
# { line: 2, type: 'LeftBrace', value: undefined }
# { type: 'Int', value: undefined, line: 3 }
# { type: 'Identifier', value: 'a', line: 3 }
# { line: 3, type: 'Assign', value: undefined }
# { line: 3, type: 'Number', value: 10 }
# { line: 3, type: 'Add', value: undefined }
# { line: 3, type: 'Number', value: 20 }
# { line: 3, type: 'Multiply', value: undefined }
# { line: 3, type: 'Number', value: 3 }
# { line: 3, type: 'Semicolon', value: undefined }
# { type: 'Return', value: undefined, line: 4 }
# { line: 4, type: 'Number', value: 0 }
# { line: 4, type: 'Semicolon', value: undefined }
# { line: 5, type: 'RightBrace', value: undefined }
```

## dev

Watch file changes and trigger test during development:

```bash
npm run dev
# npx nodemon -w src --ext mts --exec "npm test"
```
