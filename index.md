---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Platform Mesh"
  text:  "Building upon the Kubernetes API & Resource Model"
  tagline: "Discover, order, and orchestrate services across any provider through the beloved kubectl ❤️"
  image:
    src: './assets/pm_logo.svg'
    alt: 'Platform Mesh'
  actions:
    - theme: brand
      text: Overview
      link: /overview/

features:
  - title: Multi-tenant Control Planes
    details: Supports complex multi-tenant scenarios without compromising security and provides a foundation for a scalable and regionally distributed service ecosystem.
  - title: KRM-based API Management
    details: KRM as the "lingua-franca" for declarative service management. Control Planes provide declarative API layer between providers and consumers.
  - title: Service Provider Integration
    details: Seamless provider integration through combination points between control planes of service providers and service consumers.
  - title: Decentralised Marketplace Support
    details: Export and Binding interfaces that back decentralised marketplaces for consumers to browse available APIs and providers to publish services.
---

