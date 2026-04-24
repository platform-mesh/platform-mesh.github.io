# Platform Mesh annotations

## Definition

Platform Mesh annotations attach platform metadata to Kubernetes Resource Model objects. They help Platform Mesh components identify ownership, relationships, generated resources, or integration state.

## Prefix

Platform Mesh annotations use the `core.platform-mesh.io/*` prefix.

## Who writes them

Annotations may be written by:

- Platform Mesh operators
- account lifecycle automation
- provider integration components
- platform owners, when a documented workflow requires it

In general, users should not invent or modify Platform Mesh annotations manually.

## Why they matter

Annotations are often used to connect otherwise independent Kubernetes-style objects. They can be part of:

- account-to-workspace wiring
- provider and consumer relationships
- ownership tracking
- portal or content configuration
- security and authorization integration

## Documentation status

This page reserves the canonical location for the annotation catalog. It should be expanded as component owners document the supported annotation keys, values, and ownership rules.

Each annotation entry should eventually include:

- full annotation key
- value format
- writing component
- reading component
- whether users may set it
- lifecycle and compatibility guarantees

## Related

- [Component reference](/reference/components/)
- [Account model](./account-model.md)
