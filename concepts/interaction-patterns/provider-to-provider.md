# Provider to provider

The provider-to-provider pattern describes one service provider consuming another provider's API and composing it into its own service offering.

Use this pattern when a provider needs an upstream capability, such as certificates, storage, networking, billing, compliance checks, or another internal service, to fulfill its own consumer-facing API.

## Participating personas

| Persona | Role in the pattern |
| --- | --- |
| Platform owner | Provides the shared mesh, account model, and authorization boundaries that allow provider accounts to interact safely. |
| Upstream service provider | Publishes the capability consumed by another provider. |
| Composing service provider | Consumes the upstream API and exposes a higher-level or bundled capability to its own consumers. |
| Service consumer | Uses the composed provider API without needing to understand the upstream dependency graph. |

## How it works

The composing provider acts as a consumer of an upstream provider API. It can bind or consume that API through Platform Mesh, reconcile the upstream resources it needs, and expose its own API as a separate service offering.

![Kube to Kube provider diagram](/diagrams/kube-to-kube-provider.svg)

This keeps provider implementation details behind provider boundaries. Consumers of the composed service interact with one provider API, while the composing provider manages any upstream provider dependencies.

If the provider-to-provider relationship needs APIs projected into Kubernetes clusters, kube-bind can be part of the flow.

![Provider to provider kube-bind diagram](/diagrams/p2p-kube-bind.svg)

## Ownership boundaries

Each provider owns its own API contract and runtime automation. The composing provider owns the dependency on the upstream capability. The upstream provider owns fulfillment and status for its own service.

Platform Mesh mediates the relationship through accounts, workspaces, identity, authorization, and declarative APIs. It does not collapse the two providers into one operational domain.
