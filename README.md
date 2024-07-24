# C Interpreter In TypeScript

## build

```bash
npm i && npm run build
```

## test

```bash
npm test
```

## run

```bash
npx ts-node src/index.mts src/demo/hello.c

# { type: 0, value: 'int', line: 1 }
# { type: 0, value: 'main', line: 1 }
# { type: 0, value: 'return', line: 2 }
# { line: 2, type: 1, value: '0' }
```
