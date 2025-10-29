<template>
  <Layout>
    <!-- Add version selector to the navigation bar -->
    <template #nav-bar-content-after>
      <VersionSelector />
    </template>
  </Layout>
</template>

<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import VersionSelector from './components/VersionSelector.vue'

const { Layout } = DefaultTheme
</script>
