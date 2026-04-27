<script setup>
import { useSlots, computed } from 'vue'
import { withBase } from 'vitepress'
import { data as terms } from '../../data/terms.data'

const props = defineProps(['name'])
const slots = useSlots()

const extractText = (vnodes) => {
  if (!vnodes) return ''
  return vnodes.map(vnode => {
    if (typeof vnode === 'string') return vnode
    if (typeof vnode.children === 'string') return vnode.children
    if (Array.isArray(vnode.children)) return extractText(vnode.children)
    return ''
  }).join('')
}

const termData = computed(() => {
  let name = props.name ?? extractText(slots.default?.())
  if (!name) return null

  let entry = terms[name.trim()] ?? terms[name.toLowerCase().trim()]
  if (!entry) {
    console.warn(`Term '${name}' not found`)
    return null
  }

  if ('alias' in entry) {
    entry = terms[entry.alias]
    if (!entry) {
      console.warn(`Term alias '${name}' has no target`)
      return null
    }
  }

  return entry
})
</script>

<template>
  <span v-if="termData?.description" class="pm-term-wrap">
    <a v-if="termData.url" :href="withBase(termData.url)" class="pm-term-anchor"><slot /></a>
    <span v-else class="pm-term-anchor"><slot /></span>
    <span class="pm-term-tooltip">{{ termData.description }}</span>
  </span>
  <template v-else><slot /></template>
</template>

<style scoped>
.pm-term-wrap {
  position: relative;
  display: inline;
}

.pm-term-anchor {
  text-decoration: underline dotted;
  text-underline-offset: 3px;
  cursor: help;
}

a.pm-term-anchor {
  color: inherit;
}

.pm-term-tooltip {
  display: none;
  position: absolute;
  top: 130%;
  left: 0;
  min-width: 18rem;
  max-width: 26rem;
  padding: 0.4rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 500;
  font-style: normal;
  text-decoration: none;
  line-height: 1.5;
  color: #fff;
  background: rgba(52, 86, 254, 0.92);
  backdrop-filter: blur(4px);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 100;
  pointer-events: none;
  white-space: normal;
}

.pm-term-wrap:hover .pm-term-tooltip {
  display: block;
}
</style>
