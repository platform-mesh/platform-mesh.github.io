# Provider to consumer

The provider-to-consumer pattern is the default Platform Mesh relationship: a service provider exposes a service API, and a service consumer uses that API from an isolated account workspace.

Use this pattern when consumers should manage service instances through a declarative API without receiving direct access to the provider runtime.

## Participating personas

| Persona | Role in the pattern |
| --- | --- |
| Platform owner | Operates the mesh, account hierarchy, identity, authorization, and provider onboarding. |
| Service provider | Publishes the service API and reconciles consumer intent into provider-owned runtime resources. |
| Service consumer | Discovers the service, binds the API when needed, and creates desired-state resources. |

## How it works

The provider exposes only the API surface required for the service. The consumer works with that API through Platform Mesh, usually from a consumer account workspace. Platform Mesh mediates identity, authorization, account isolation, API discovery, and the flow of desired state and status.

When the consumer uses Platform Mesh directly, the provider can expose service APIs through kcp APIExports and api-syncagent. Consumer workspaces bind those APIs with APIBindings.

![Kube provider to Platform Mesh consumer diagram](/diagrams/p-to-c-kcp-mesh.svg)

The same pattern supports multiple consumers and multiple providers.

![Kube provider to Platform Mesh multiple consumers diagram](/diagrams/p-to-c-kcp-mesh-multiple.svg)

When consumers need APIs close to their workload clusters, kube-bind can project Platform Mesh APIs into consumer-owned Kubernetes clusters.

![Extended export diagram](/diagrams/extended-export.svg)

## Ownership boundaries

The consumer owns the requested service resources in its account workspace. The provider owns the controller logic, runtime resources, and service implementation. Platform Mesh owns the shared control-plane boundary between them.

This separation lets consumers use a consistent Kubernetes Resource Model interface while providers keep their runtime topology and operational model private.

## Related

- [Personas](../personas.md)
- [Account model](../account-model.md)
- [Integration paths](../integration-paths.md)
- [API sharing](../api-sharing.md)
