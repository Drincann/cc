# C Compiler In TypeScript

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

## features

- [x] tokenizer `src/tokenizer/clang.mts`
- [x] parser `src/parser/clang.mts`
- [ ] semantic analysis (doing...)
- [ ] asm generation
- [ ] virtual machine `src/vm/lc3.mts` (doing...)
- [ ] runtime (I/O API)

```typescript
import { ClangParser } from "./src/parser/index.mjs";
import type { Program } from "./src/parser/index.mjs";
import util from "util";

const parser = ClangParser.fromCode(`
int main(char* args) {
  return 0;
}`);

const ast: Program = parser.parse();

console.log(util.inspect(ast, { depth: null, colors: true }));
```

## run demo

```bash
npx ts-node src/index.mts src/demo/hello.c

# {
#   type: 'program',
#   parent: undefined,
#   definitions: [
#     <ref *1> {
#       type: 'function-definition',
#       name: 'main',
#       parameters: [ [Object] ],
#       body: {
#         type: 'function-body',
#         statements: [Array],
#         symbolTable: [ScopedMap [Map]]
#       },
#       returnType: 'int',
#       declaration: {
#         type: 'function-declaration',
#         name: 'main',
#         parameters: [Array],
#         returnType: 'int',
#         definition: [Circular *1]
#       },
#       parent: [Circular *2]
#     }
#   ],
#   symbolTable: ScopedMap(1) [Map] {
#     'main' => <ref *1> {
#       type: 'function-definition',
#       name: 'main',
#       parameters: [ [Object] ],
#       body: {
#         type: 'function-body',
#         statements: [Array],
#         symbolTable: [ScopedMap [Map]]
#       },
#       returnType: 'int',
#       declaration: {
#         type: 'function-declaration',
#         name: 'main',
#         parameters: [Array],
#         returnType: 'int',
#         definition: [Circular *1]
#       },
#       parent: [Circular *2]
#     },
#     parent: Map(0) {}
#   }
# }
```

## dev

Watch file changes and trigger test during development:

```bash
npm run dev
# npx nodemon -w src --ext mts --exec "npm test"
```
