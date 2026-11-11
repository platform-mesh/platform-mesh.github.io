#!/usr/bin/env node
// Generate the shared script from successfully deployed documentation, not
// branches that might not have a working deployment yet. No npm dependencies.
import { access, mkdir, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export async function generateVersions(deploymentDirectory) {
  const versions = []
  for (const entry of await readdir(deploymentDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    if (entry.name !== 'main' && !/^release-\d+\.\d+$/.test(entry.name)) continue
    try {
      await access(join(deploymentDirectory, entry.name, 'index.html'))
    } catch (error) {
      if (error.code === 'ENOENT') continue
      throw error
    }
    versions.push({
      name: entry.name,
      label: entry.name === 'main' ? 'main (latest)' : `v${entry.name.slice('release-'.length)}`,
      ...(['release-0.1', 'release-0.2'].includes(entry.name) ? { rootOnly: true } : {}),
    })
  }
  return versions.sort((a, b) => {
    if (a.name === 'main') return -1
    if (b.name === 'main') return 1
    return b.name.localeCompare(a.name, 'en', { numeric: true })
  })
}

export function renderVersions(versions) {
  return '// Generated from deployed documentation. Do not edit.\n'
    + `window.PLATFORM_MESH_VERSIONS = ${JSON.stringify(versions, null, 2)};\n`
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [, , deploymentDirectory, outputFile] = process.argv
  if (!deploymentDirectory || !outputFile) {
    console.error('Usage: node hack/generate-versions.mjs <gh-pages-directory> <output-file>')
    process.exitCode = 1
  } else {
    const versions = await generateVersions(deploymentDirectory)
    if (!versions.length) throw new Error('No deployed documentation versions found')
    await mkdir(dirname(outputFile), { recursive: true })
    await writeFile(outputFile, renderVersions(versions))
  }
}
