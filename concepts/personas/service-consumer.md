# Service consumer

Service consumers use Platform Mesh to discover, order, and manage service capabilities. They work with declarative resources in their own account workspaces instead of learning every provider's runtime and operational interface.

Consumers include developers, data scientists, application owners, and any team that needs to use a capability — a database, a certificate, a Kubernetes cluster, an AI inference endpoint — without operating it themselves.

## Goal

Consume services through a consistent Kubernetes Resource Model interface, with clear ownership boundaries between consumer intent and provider implementation.

## Responsibilities

- Discover available service APIs.
- Bind provider APIs into the consumer account workspace when required.
- Create and update desired-state resources for service instances.
- Observe lifecycle status and act on failures or required follow-up.
- Integrate consumed services into applications, GitOps flows, or automation.

## Ownership boundary

The consumer owns the **request** — the desired-state resources in their account workspace and the application code that uses the resulting capability. They do not own the provider runtime or the underlying service implementation. The control plane mediates everything in between: the consumer writes spec, the provider writes status, and Platform Mesh delivers each side to the other across the account boundary.

## Interaction modes

Consumers can interact with their workspace through different surfaces, all of which work against the same Kubernetes Resource Model:

- The Platform Mesh Portal for graphical discovery and management.
- `kubectl` and standard Kubernetes tooling for command-line workflows.
- GitOps tools (Flux, Argo CD) and IaC tools (Terraform) for declarative, version-controlled workflows.

The choice of surface does not change the underlying API or the ownership boundary.

## Common questions

- Which services are available to my account?
- How do I bind or consume a provider API?
- Which resources do I create to request a service instance?
- Where do I check status and failure information?
- Can I use `kubectl`, GitOps, IaC, or the portal for this workflow?

## Recommended reading

Start with [Explore the example MSP](/tutorials/explore-example-msp.md) for a guided walkthrough of the consumer experience. Then read [Interaction patterns](../interaction-patterns/provider-to-consumer.md) to understand how providers and consumers connect, [Account model](../account-model.md) for how consumer accounts are structured, and [API sharing](../api-sharing.md) for how provider APIs become available in the consumer workspace.

## Related

- [Personas overview](./index.md)
- [Platform owner](./platform-owner.md) — the role that operates the mesh on the consumer's behalf
- [Service provider](./service-provider.md) — the role that publishes the APIs the consumer uses
- [Account model](../account-model.md)
- [API sharing](../api-sharing.md)
- [Marketplace](/reference/components/marketplace.md)
- [Portal](/reference/components/portal.md)
