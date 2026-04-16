# Concepts

This section explains the building blocks you will see when reading or writing YAML against a Platform Mesh cluster. Each page focuses on a single object: what it is, who creates it, and where it fits in the larger flow.

The Concepts are split into two groups.

## kcp Primitives

Upstream [kcp](https://kcp.io) objects that Platform Mesh builds on. These are not Platform Mesh-specific — the documentation here covers the parts that matter for Platform Mesh and links out to upstream kcp docs for the complete specification.

- [**Control Planes & Workspaces**](/concepts/control-planes) — how kcp provides the declarative API layer, workspace hierarchy, and multi-tenancy that Platform Mesh depends on
- [**APIExport & APIBinding**](/concepts/api-export-binding) — the cross-workspace API composition mechanism that connects providers with consumers

## Platform Mesh Objects

Objects introduced by Platform Mesh itself. These extend kcp with the concepts Platform Mesh needs: account hierarchy, identity/authorization wiring, portal integration, and cross-cutting metadata.

- [**Account Model**](/concepts/account-model) — the hierarchical workspace structure that mirrors organizational boundaries
- [**Account CR**](/concepts/account-cr) — the custom resource that represents an account and binds it to a kcp workspace
- [**ContentConfiguration**](/concepts/content-configuration) — declarative configuration for the Platform Mesh Portal micro-frontend extensions
- [**IAM Store**](/concepts/iam-store) — how OpenFGA stores are provisioned per account and connected to kcp's authorizer chain
- [**Platform Mesh Annotations**](/concepts/pm-annotations) — the `core.platform-mesh.io/*` annotations that identify and wire PM-managed objects

## When to read this section

- **Before** following the [Provider Quick Start](/guides/provider-quick-start) if you want to understand what you are creating and why
- **After** reading the [Architecture](/overview/architecture) if you are ready to look at concrete YAML
- **As a reference** when a guide or example mentions an object you have not seen before
