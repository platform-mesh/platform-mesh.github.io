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
        role="dialog"
        aria-modal="true"
        aria-label="Diagram zoom view"
        @click="closeMermaidZoom"
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
import { onBeforeUnmount, onMounted, watch, nextTick, ref } from 'vue'
import { useRoute } from 'vitepress'
import YouTubeEmbed from './components/YouTubeEmbed.vue'

const { Layout } = DefaultTheme

const route = useRoute()
const zoomedSvg = ref<string | null>(null)

const initImageZoom = () => {
  mediumZoom('.main img', { background: 'var(--vp-c-bg)', margin: 80 })
}

const initPageInteractions = () => {
  initImageZoom()
}

const handleMermaidClick = (event: MouseEvent) => {
  const target = event.target as Element | null
  const container = target?.closest('.mermaid')
  if (!container) return

  const svg = container.querySelector(':scope > svg, svg') as SVGElement | null
  if (!svg) return

  const clone = svg.cloneNode(true) as SVGElement

  if (!clone.getAttribute('viewBox')) {
    const rect = svg.getBoundingClientRect()
    const width = parseFloat(svg.getAttribute('width') || String(rect.width))
    const height = parseFloat(svg.getAttribute('height') || String(rect.height))
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`)
  }

  clone.removeAttribute('width')
  clone.removeAttribute('height')
  clone.removeAttribute('style')
  clone.setAttribute('preserveAspectRatio', 'xMidYMid meet')

  zoomedSvg.value = clone.outerHTML
}

const closeMermaidZoom = () => {
  zoomedSvg.value = null
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeMermaidZoom()
  }
}

onMounted(() => {
  initPageInteractions()
  document.addEventListener('click', handleMermaidClick)
  document.addEventListener('keydown', handleKeydown)
})

watch(
  () => route.path,
  () =>
    nextTick(() => {
      closeMermaidZoom()
      initPageInteractions()
    })
)

onBeforeUnmount(() => {
  document.removeEventListener('click', handleMermaidClick)
  document.removeEventListener('keydown', handleKeydown)
  closeMermaidZoom()
})
</script>
