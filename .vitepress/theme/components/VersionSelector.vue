<template>
  <!-- Don't show version selector in PR previews -->
  <div v-if="!isPreview" class="version-selector">
    <select
      v-model="currentVersion"
      @change="switchVersion"
      class="version-dropdown"
      aria-label="Select documentation version"
    >
      <option
        v-for="version in versions"
        :key="version.name"
        :value="version.name"
      >
        {{ version.label }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Version {
  // name is the name of the directory where this version has its docs,
  // usually identical to the branch name
  name: string
  // label is how the version is shown in the dropdown
  label: string
  // rootOnly should be set to true only for pre-0.3 versions for which the
  // directory structure differs greatly from more recent versions. This
  // prevents sending users to non-existent pages when they switch versions.
  rootOnly?: boolean
}

declare global {
  interface Window {
    PLATFORM_MESH_VERSIONS?: Version[]
  }
}

// The root-level /versions.js is shared by all documentation releases.
// Keep server rendering independent of window; load the list on mount.
const versions = ref<Version[]>([{ name: 'main', label: 'main (latest)' }])

const currentVersion = ref<string>('')
const isPreview = ref<boolean>(false)

function isPreviewContext(): boolean {
  if (typeof window === 'undefined') return false

  const path = window.location.pathname
  const segments = path.split('/').filter(Boolean)

  // Check if we're in a PR preview (path starts with pr-preview/)
  return segments.length > 0 && segments[0] === 'pr-preview'
}

function getCurrentVersion(): string {
  if (typeof window === 'undefined') return 'main'

  const path = window.location.pathname
  const segments = path.split('/').filter(Boolean)

  // Detect the current release even when the shared script is unavailable.
  const firstSegment = segments[0]
  if (firstSegment === 'main' || /^release-\d+\.\d+$/.test(firstSegment || '')) {
    return firstSegment
  }

  // Default to main if no version detected
  return 'main'
}

function switchVersion(): void {
  if (typeof window === 'undefined') return

  const selected = versions.value.find(v => v.name === currentVersion.value)

  if (selected?.rootOnly) {
    window.location.href = `/${currentVersion.value}/`
    return
  }

  const currentPath = window.location.pathname
  const segments = currentPath.split('/').filter(Boolean)

  // Remove the version from the path if it exists
  let pathWithoutVersion = ''
  if (segments.length > 0 && versions.value.some(v => v.name === segments[0])) {
    pathWithoutVersion = '/' + segments.slice(1).join('/')
  } else {
    pathWithoutVersion = currentPath
  }

  // Ensure path starts with / and ends without trailing slash (unless it's just /)
  if (!pathWithoutVersion.startsWith('/')) {
    pathWithoutVersion = '/' + pathWithoutVersion
  }
  if (pathWithoutVersion.length > 1 && pathWithoutVersion.endsWith('/')) {
    pathWithoutVersion = pathWithoutVersion.slice(0, -1)
  }

  // Construct new URL with selected version
  const newPath = `/${currentVersion.value}${pathWithoutVersion}`

  window.location.href = newPath
}

onMounted(() => {
  isPreview.value = isPreviewContext()
  currentVersion.value = getCurrentVersion()
  if (window.PLATFORM_MESH_VERSIONS?.length) {
    versions.value = [...window.PLATFORM_MESH_VERSIONS]
  }

  // Local builds, a failed script request, or a stale cached list should still
  // show the current version and allow navigation back to main.
  if (!versions.value.some(v => v.name === currentVersion.value)) {
    versions.value.push({
      name: currentVersion.value,
      label: `v${currentVersion.value.replace(/^release-/, '')}`,
      rootOnly: ['release-0.1', 'release-0.2'].includes(currentVersion.value),
    })
  }
})
</script>

<style scoped>
.version-selector {
  display: inline-block;
  margin-left: 12px;
}

.version-dropdown {
  padding: 4px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
}

.version-dropdown:hover {
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-soft);
}

.version-dropdown:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}

/* Dark mode adjustments */
.dark .version-dropdown {
  background-color: var(--vp-c-bg-alt);
}

.dark .version-dropdown:hover {
  background-color: var(--vp-c-bg-soft);
}
</style>
