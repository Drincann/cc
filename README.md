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

# { type: 0, value: 'int', line: 1 }
# { type: 0, value: 'main', line: 1 }
# { type: 0, value: 'char', line: 3 }
# { type: 0, value: 'str', line: 3 }
# { type: 2, line: 3, value: 'echo "Hello, World!"\n' }
# { type: 0, value: 'return', line: 4 }
# { line: 4, type: 1, value: 0 }
```

## dev

Watch file changes and trigger test during development:

```bash
npm run dev
# npx nodemon -w src --ext mts --exec "npm test"
```
