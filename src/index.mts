import { ClangParser } from './parser/index.mjs'
import fs from 'fs/promises'
import util from 'util'

const args = process.argv.slice(2)

if (args.length !== 1) {
  console.error('Usage: tscc <file>')
  process.exit(1)
}

if (await fileNotExists(args[0])) {
  console.error(`File not found: ${args[0]}`)
  process.exit(1)
}

interpret(await fs.readFile(args[0], 'utf-8'))

// script end
async function fileNotExists(filename: string): Promise<boolean> {
  return await fs.access(filename).then(() => false).catch(() => true)
}

function interpret(code: string) {
  const tokenizer = ClangParser.fromCode(code)

  console.log(util.inspect(tokenizer.parse(), { depth: 3, colors: true }))
}
