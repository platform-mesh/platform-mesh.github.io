# Architecture Overview

Platform Mesh is a composable platform built on the [Kubernetes Resource Model (KRM)](/overview/principles). Rather than enforcing rigid IaaS/PaaS/SaaS layers, it provides a single mechanism for offering, discovering, and managing services of any kind. This page shows how the major components fit together.

## Component Overview

The following onion diagram shows the concentric layers of the Platform Mesh stack, with kcp at the core and each outer ring adding capabilities -- control planes, identity and authorization, and finally portal, extensibility, and API composition.

<div class="onion-light">

![Platform Mesh onion architecture diagram](/diagrams/pm-onion-lgt.svg)

</div>
<div class="onion-dark">

![Platform Mesh onion architecture diagram](/diagrams/pm-onion-drk.svg)

</div>

<style>
html.dark .onion-light, html.dark .arch-light { display: none; }
html:not(.dark) .onion-dark, html:not(.dark) .arch-dark { display: none; }
</style>

## Component Descriptions

### UI Layer

**Platform Mesh Portal** is the reference implementation of a consumer-facing portal, built on [OpenMFP](https://openmfp.io) and the [Luigi](https://luigi-project.io) micro-frontend framework. It composes technology-agnostic frontend modules into a unified portal at runtime. Consumers can use the provided UI libraries to build a fully customized portal tailored to their needs. Platform Mesh also offers ways to declaratively configure UIs through Kubernetes-native ContentConfiguration CRDs, removing the need for UI development in many cases -- adding a new UI module requires no redeployment of the portal itself.

**Kubernetes GraphQL Gateway** exposes kcp's KRM resources through a GraphQL interface. It supports single-cluster, kcp, and multi-cluster modes, giving the portal (and other clients) a typed, queryable API surface over the same resources accessible via `kubectl`.

### Core Control Plane

**kcp** is the heart of Platform Mesh. It extracts the Kubernetes declarative API server and strips away container orchestration, repurposing it for service management. kcp provides hierarchical [workspaces](/overview/control-planes) (each behaving like an independent Kubernetes API endpoint), the [APIExport/APIBinding](/overview/api-export-binding) mechanism for cross-workspace service sharing, and horizontal scaling through sharding. A key property is that kcp workspaces are cheap -- multiple logical clusters share a single process and etcd instance, isolated by storage prefix rather than separate infrastructure.

**Account Controller** manages the [Account Model](/overview/account-model), which maps organizational structure (organizations, teams, environments) into kcp's workspace hierarchy. Each account node is an isolated control plane with its own API surface, identity realm, and authorization store. Policies flow downward through the hierarchy.

**Extension Controller** processes ContentConfiguration CRDs that register micro-frontend extensions with the OpenMFP portal. It validates configurations asynchronously and stores the result so the portal can serve them at request time.

### Identity & Authorization

**Keycloak** provides OpenID Connect (OIDC) authentication for the platform. Each organization gets its own Keycloak realm, supporting federation so organizations can bring their own identity provider.

**OpenFGA** implements Relationship-Based Access Control (ReBAC), modeled after Google's Zanzibar system. Authorization state is expressed as relationship tuples (user, relation, object), and permissions propagate through a graph. Each organization gets an isolated OpenFGA store, and the authorization schema updates dynamically as new API bindings are activated. OpenFGA is connected to kcp natively via its authorizer chain, providing fine-grained authorization decisions alongside standard Kubernetes RBAC.

### Infrastructure

These components are internal to the Platform Mesh stack -- they are used by platform owners to deploy and manage the platform itself, not by consumers or providers directly.

**Flux** provides GitOps-based continuous delivery, reconciling desired state from Git repositories to deploy and update Platform Mesh components.

**OCM (Open Component Model)** handles component packaging and versioning, providing a supply chain for delivering platform components and extensions.

### Connectivity

Three mechanisms bridge the gap between service provider clusters and the Platform Mesh control plane. Each serves a different use case:

**[api-syncagent](/overview/api-syncagent)** is the primary integration path for standard CRD-based services. It runs on a service provider's Kubernetes cluster and publishes that cluster's CRDs as APIExports in kcp. Synchronization is bidirectional: spec flows from kcp to the service cluster, status flows back. Configuration is driven by PublishedResource CRDs. This is the recommended starting point for most providers.

**[multi-cluster-runtime](/overview/multi-cluster-runtime)** is a Go library extending `controller-runtime` for building custom syncers. Use it when providers need full control over sync logic or work with non-CRD APIs (aggregated API servers, custom API servers). It requires more development effort but offers complete flexibility.

**[kube-bind](https://github.com/kube-bind/kube-bind)** :construction: *Work in progress* -- is an alternative to api-syncagent that also allows providers to publish their APIs into the mesh. In addition, kube-bind enables pushing those APIs down from Platform Mesh to consumer clusters running vanilla Kubernetes, making them available as if they were native resources on the consumer's own cluster.

## How Components Interact

<div class="arch-light">

![Platform Mesh high-level architecture](/diagrams/high-level-arch-lgt.svg)

</div>
<div class="arch-dark">

![Platform Mesh high-level architecture](/diagrams/high-level-arch-drk.svg)

</div>

A typical request flows through the stack as follows. A developer opens the Platform Mesh Portal, which loads micro-frontend modules registered through ContentConfiguration CRDs. The portal calls the Kubernetes GraphQL Gateway, which translates the request into standard KRM operations against a kcp workspace. kcp authenticates the request via Keycloak (OIDC token validation) and authorizes it through its authorizer chain, which includes Kubernetes RBAC and OpenFGA for fine-grained relationship-based decisions.

When a consumer creates a resource in their workspace -- for example, a `DatabaseClaim` -- that resource exists in kcp's declarative API surface via an [APIBinding](/overview/api-export-binding). The corresponding service provider has published a matching APIExport, and one of the three connectivity mechanisms (typically api-syncagent) synchronizes the resource down to the provider's service cluster. The provider's operator reconciles the resource, provisions the actual database, and writes status back through the same sync path. The consumer sees the updated status in their workspace, whether they check via `kubectl`, the GraphQL gateway, or the portal UI.

This architecture means that providers and consumers never interact directly. The control plane mediates all communication, providing isolation, authorization, and a uniform declarative interface regardless of what the underlying service actually is.

## What's Next

- [Account Model](/overview/account-model) -- how organizational hierarchy maps to workspaces
- [Control Planes](/overview/control-planes) -- kcp workspaces and the control plane concept
- [APIExport and APIBinding](/overview/api-export-binding) -- the service sharing mechanism
- [api-syncagent](/overview/api-syncagent) -- publishing CRDs into the mesh
- [multi-cluster-runtime](/overview/multi-cluster-runtime) -- building custom syncers
- [Guiding Principles](/overview/principles) -- the design philosophy behind Platform Mesh
