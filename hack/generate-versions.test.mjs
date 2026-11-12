import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { generateVersions, renderVersions } from './generate-versions.mjs'

test('discovers deployed releases, sorts numerically, and preserves legacy navigation', async t => {
  const root = await mkdtemp(join(tmpdir(), 'pm-versions-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  for (const name of [
    'main', 'release-0.1', 'release-0.2', 'release-0.3', 'release-0.5',
    'release-26.9', 'release-26.10', 'release-27.1', 'pr-preview',
    'release-unpublished', 'release-26.11',
  ]) {
    await mkdir(join(root, name))
    if (name !== 'release-26.11') await writeFile(join(root, name, 'index.html'), '')
  }
  await writeFile(join(root, 'release-28.1'), 'not a directory')

  const versions = await generateVersions(root)
  assert.deepEqual(versions.map(v => v.name), [
    'main', 'release-27.1', 'release-26.10', 'release-26.9',
    'release-0.5', 'release-0.3', 'release-0.2', 'release-0.1',
  ])
  assert.equal(versions[0].label, 'main (latest)')
  assert.equal(versions[2].label, 'v26.10')
  assert.deepEqual(versions.filter(v => v.rootOnly).map(v => v.name), [
    'release-0.2', 'release-0.1',
  ])

  const window = {}
  runInNewContext(renderVersions(versions), { window })
  assert.equal(JSON.stringify(window.PLATFORM_MESH_VERSIONS), JSON.stringify(versions))
})

test('an empty deployment contains no versions', async t => {
  const root = await mkdtemp(join(tmpdir(), 'pm-versions-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  assert.deepEqual(await generateVersions(root), [])
})
