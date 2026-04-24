<template>
  <Layout>
    <!-- Add version selector to the navigation bar -->
    <template #nav-bar-content-after>
      <VersionSelector />
    </template>

    <!-- Add YouTube video above homepage feature tiles -->
    <template #home-features-before>
      <YouTubeEmbed />
    </template>
  </Layout>

  <!-- Mermaid diagram zoom overlay -->
  <Teleport to="body">
    <Transition name="mermaid-fade">
      <div
        v-if="zoomedSvg"
        class="mermaid-zoom-overlay"
        @click="closeZoom"
        role="dialog"
        aria-modal="true"
        aria-label="Diagram zoom view"
      >
        <div
          class="mermaid-zoom-container"
          @click.stop
          v-html="zoomedSvg"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import VersionSelector from './components/VersionSelector.vue'
import mediumZoom from 'medium-zoom'
import { onMounted, onBeforeUnmount, watch, nextTick, ref } from 'vue'
import { useRoute } from 'vitepress'
import YouTubeEmbed from './components/YouTubeEmbed.vue'

const { Layout } = DefaultTheme

const route = useRoute()
const zoomedSvg = ref<string | null>(null)

const initZoom = () => {
  mediumZoom('.main img', { background: 'var(--vp-c-bg)', margin: 80 })
}

// Event delegation: catches clicks on mermaid SVGs regardless of when they
// render. No MutationObserver or per-element binding needed.
const handleMermaidClick = (e: MouseEvent) => {
  const target = e.target as Element
  const container = target.closest('.mermaid')
  if (!container) return
  const svg = container.querySelector(':scope > svg') as SVGElement | null
  if (!svg) return

  const clone = svg.cloneNode(true) as SVGElement

  // Ensure viewBox exists so SVG can scale via preserveAspectRatio (meet).
  if (!clone.getAttribute('viewBox')) {
    const rect = svg.getBoundingClientRect()
    const w = parseFloat(svg.getAttribute('width') || String(rect.width))
    const h = parseFloat(svg.getAttribute('height') || String(rect.height))
    clone.setAttribute('viewBox', `0 0 ${w} ${h}`)
  }

  // Strip fixed dimensions -- CSS sizes the container, SVG scales to fit.
  clone.removeAttribute('width')
  clone.removeAttribute('height')
  clone.removeAttribute('style')
  clone.setAttribute('preserveAspectRatio', 'xMidYMid meet')

  zoomedSvg.value = clone.outerHTML
}

const closeZoom = () => {
  zoomedSvg.value = null
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') closeZoom()
}

onMounted(() => {
  initZoom()
  document.addEventListener('click', handleMermaidClick)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleMermaidClick)
  document.removeEventListener('keydown', handleKeydown)
})

watch(
  () => route.path,
  () => nextTick(() => initZoom())
)
</script>
