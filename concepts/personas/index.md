# Personas

Platform Mesh documentation is organized around three personas: platform owners, service providers, and service consumers.

Use this section to identify which role matches your work, what that role owns, and which documentation path to follow next. The persona pages are role guides, not installation guides or component references.

| Persona | Primary goal | Owns | Start with |
| --- | --- | --- | --- |
| [Platform owner](./platform-owner.md) | Run the mesh as a shared service platform | Platform Mesh runtime, account hierarchy, identity, authorization, policy, provider onboarding, component lifecycle | [Why Platform Mesh?](../why-platform-mesh.md), [Architecture](../architecture.md), [Account model](../account-model.md), [Control planes](../control-planes.md) |
| [Service provider](./service-provider.md) | Publish a service capability as a declarative API | API contract, provider automation, service runtime integration, lifecycle status, integration path | [Integration paths](../integration-paths.md), [api-syncagent](../integration/api-syncagent.md), [multicluster-runtime](../integration/multicluster-runtime.md), [Interaction patterns](../interaction-patterns/provider-to-consumer.md) |
| [Service consumer](./service-consumer.md) | Discover and consume provider services through a consistent API | Account resources, bound provider APIs, desired-state resources, application service dependencies | [Explore the example MSP](/tutorials/explore-example-msp.md), [Interaction patterns](../interaction-patterns/provider-to-consumer.md), [Account model](../account-model.md), [API sharing](../api-sharing.md) |

## How the personas interact

The role relationship is simple: the platform owner operates the mesh, providers publish service APIs through it, and consumers discover and consume those APIs through their account workspaces.

```mermaid
flowchart LR
    PO["Platform owner"]
    PM["Platform Mesh"]
    SP["Service provider"]
    SC["Service consumer"]

    PO -- "operates" --> PM
    PO -- "onboards" --> SP
    SP -- "publishes service APIs through" --> PM
    SC -- "discovers and consumes services through" --> PM

    classDef owner fill:#eef2ff,stroke:#4f46e5,stroke-width:2px,color:#1e1b4b
    classDef provider fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#064e3b
    classDef consumer fill:#fff7ed,stroke:#ea580c,stroke-width:2px,color:#7c2d12
    classDef mesh fill:#f5f3ff,stroke:#7c3aed,stroke-width:2px,color:#3b0764

    class PO owner
    class SP provider
    class SC consumer
    class PM mesh
```

The service flow is separated from the role model. Consumers express desired state in Platform Mesh. Providers reconcile that intent and report status back.

```mermaid
sequenceDiagram
    box rgba(234, 88, 12, 0.12) Consumer
    participant Consumer as Service consumer
    end
    box rgba(124, 58, 237, 0.12) Mesh
    participant Mesh as Platform Mesh
    end
    box rgba(5, 150, 105, 0.12) Provider
    participant Provider as Service provider
    end

    Provider->>Mesh: Publish service API
    Consumer->>Mesh: Discover and bind API
    Consumer->>Mesh: Create desired state
    Mesh->>Provider: Deliver consumer intent
    Provider->>Mesh: Report status
    Mesh->>Consumer: Expose lifecycle status
```

Platform Mesh mediates the relationship through accounts, workspaces, identity, authorization, and declarative APIs. The consumer does not need direct access to the provider runtime, and the provider keeps ownership of its implementation.

## What belongs elsewhere

Personas explain audience and ownership. Task steps, component facts, and upstream kcp mechanics belong in other documentation sections:

- Use [Tutorials](/tutorials/) for guided learning paths.
- Use [How-to guides](/how-to-guides/) for operational tasks.
- Use [Reference](/reference/) for objects, components, and API facts.
- Use the upstream kcp documentation for general kcp concepts that are not specific to Platform Mesh.

## Related

- [Why Platform Mesh?](../why-platform-mesh.md)
- [Architecture](../architecture.md)
- [Account model](../account-model.md)
- [Provider to consumer](../interaction-patterns/provider-to-consumer.md)
