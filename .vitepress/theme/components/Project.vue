<script setup>
import { useSlots, computed } from 'vue'
import { data as projects } from '../../data/projects.data'

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

const projectData = computed(() => {
  const name = props.name ?? extractText(slots.default?.())
  if (!name) return null

  const entry = projects[name.trim()] ?? projects[name.toLowerCase().trim()]
  if (!entry) {
    console.warn(`Project '${name}' not found`)
    return null
  }

  return entry
})
</script>

<template>
  <span v-if="projectData" class="pm-project-wrap">
    <a :href="projectData.url" target="_blank" rel="noopener" class="pm-project-anchor"><slot /></a>
    <span class="pm-project-tooltip">
      <span class="pm-project-title">
        <img v-if="projectData.icon" :src="projectData.icon" class="pm-project-icon" />
        {{ projectData.name }}
      </span>
      {{ projectData.description }}
    </span>
  </span>
  <template v-else><slot /></template>
</template>

<style scoped>
.pm-project-wrap {
  position: relative;
  display: inline;
}

.pm-project-anchor {
  font-weight: 600;
  text-decoration: none;
  color: var(--vp-c-brand-1);
}

.pm-project-anchor:hover {
  text-decoration: underline;
}

.pm-project-tooltip {
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

.pm-project-title {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 0.3rem;
}

.pm-project-icon {
  display: inline;
  height: 1.4em;
  vertical-align: -20%;
  margin-right: 0.4em;
  background: white;
  border-radius: 3px;
  padding: 2px;
}

.pm-project-wrap:hover .pm-project-tooltip {
  display: block;
}
</style>
