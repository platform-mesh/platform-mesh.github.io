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
      src: /icons/multi-nodes.svg
      alt: multi tenants icon
      width: 72
      height: 72
    title: Every tenant in its own space
    details: Powered by kcp.io, each team or tenant gets their own isolated workspace that behaves like its own Kubernetes control plane. Scales across multiple shards and regions as you grow.
  - icon:
      src: /icons/common-language.svg
      alt: one model icon
      width: 72
      height: 72
    title: One API model for everything
    details: Every service is managed the same way declaratively with Kubernetes Resource Model (KRM). One common language shared between providers and consumers.
  - icon:
      src: /icons/grocery-basket.svg
      alt: diverse providers icon
      width: 72
      height: 72
    title: Plug in any provider
    details: No more custom glue code. Providers expose their services through their own control plane, and consumers bind to them through theirs.
  - icon:
      src: /icons/gate-control.svg
      alt: provider boundaries icon
      width: 72
      height: 72
    title: Providers see only what you allow
    details: You decide the boundaries with providers. Providers get the access they need to deliver their service and nothing more.
  - icon:
      src: /icons/round-world.svg
      alt: extend world icon
      width: 72
      height: 72
    title: Fits around what you already run
    details: Your current clusters and services stay where they are. Bring them into the mesh, or build something new on top.
  - icon:
      src: /icons/heart-diversity.svg
      alt: diverse community icon
      width: 72
      height: 72
    title: Governed in the open
    details: Platform Mesh lives under NeoNephos and the Linux Foundation Europe. All code, roadmap, decisions are public and no single company can change the terms on you.
---
