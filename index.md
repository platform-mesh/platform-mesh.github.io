---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Platform Mesh"
  text:  "Freedom to use any service from any vendor"
  tagline: "Discover, order, and orchestrate services across providers through kubectl"
  image:
    src: '/pm_logo.svg'
    alt: 'Platform Mesh'
  actions:
    - theme: brand
      text: Getting Started
      link: /tutorials/
    - theme: alt
      text: Concepts
      link: /concepts/

features:
  - icon:
      light: /icons/multi-nodes-light.svg
      dark: /icons/multi-nodes-dark.svg
      alt: multi tenants icon
      width: 72
      height: 72
    title: Every tenant in its own space
    details: Each team or tenant gets their own isolated workspace, built on kcp, a multi-tenant control plane for Kubernetes-style APIs. Add shards and regions as you grow.
  - icon:
      light: /icons/common-language-light.svg
      dark: /icons/common-language-dark.svg
      alt: one model icon
      width: 72
      height: 72
    title: One API model for everything
    details: Every service is managed the same way declaratively with Kubernetes Resource Model (KRM). One common language shared between providers and consumers.
  - icon:
      light: /icons/grocery-basket-light.svg
      dark: /icons/grocery-basket-dark.svg
      alt: diverse providers icon
      width: 72
      height: 72
    title: Plug in any provider
    details: No more custom glue code. Providers expose their services through their own control plane, and consumers bind to them through theirs.
  - icon:
      light: /icons/gate-control-light.svg
      dark: /icons/gate-control-dark.svg
      alt: provider boundaries icon
      width: 72
      height: 72
    title: AI agents act as you
    details: Turn on the optional MCP integration and connect your AI agent to Platform Mesh. It works with your own sign-in, limited to what your permissions allow.
  - icon:
      light: /icons/round-world-light.svg
      dark: /icons/round-world-dark.svg
      alt: extend world icon
      width: 72
      height: 72
    title: Fits around what you already run
    details: Your current clusters and services stay where they are. Bring them into the mesh, or build something new on top.
  - icon:
      light: /icons/heart-diversity-light.svg
      dark: /icons/heart-diversity-dark.svg
      alt: diverse community icon
      width: 72
      height: 72
    title: Governed in the open
    details: Platform Mesh lives under NeoNephos and the Linux Foundation Europe. All code, roadmap, decisions are public and no single company can change the terms on you.
---
