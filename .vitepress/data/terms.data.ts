import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const termsFile = join(__dirname, '../../platform-mesh-terms.json')

export default {
  watch: [termsFile],
  load(watchedFiles: string[]) {
    const file = watchedFiles[0] ?? termsFile
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  }
}
