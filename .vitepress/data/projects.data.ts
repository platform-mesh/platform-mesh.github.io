import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectsFile = join(__dirname, '../../platform-mesh-projects.json')

export default {
  watch: [projectsFile],
  load(watchedFiles: string[]) {
    const file = watchedFiles[0] ?? projectsFile
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  }
}
