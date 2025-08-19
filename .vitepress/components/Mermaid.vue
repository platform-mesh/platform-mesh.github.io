<template>
  <div v-html="svg"></div>
</template>

<script setup lang="ts">
import { watchEffect, ref } from 'vue';
import { useData } from 'vitepress'

import mermaid from 'mermaid'
import type { MermaidConfig } from 'mermaid'

const {isDark} = useData()

const svg = ref<string>('')

const props = defineProps({
  graph: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
});

const render = async (id: string, code: string, config: MermaidConfig): Promise<string> => {
  mermaid.initialize(config)
  const {svg} = await mermaid.render(id, code)
  return svg
}

watchEffect(async () => {
  const mermaidConfig: MermaidConfig = {
    securityLevel: 'loose',
    startOnLoad: false,
    theme: isDark.value ? 'dark' : 'default',
  };

  svg.value = await render(props.id, props.graph, mermaidConfig);
}, { immediate: true });
</script>
