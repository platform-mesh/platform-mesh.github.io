# Concepts

Use this section when you want to understand why Platform Mesh exists, how its parts fit together, and which integration path applies to your work.

## Recommended reading path

1. [Why Platform Mesh?](./why-platform-mesh.md) - the motivation, design principles, and service-management problem Platform Mesh addresses.
2. [Architecture](./architecture.md) - the runtime layers and how user requests flow through the system.
3. [Personas](./personas/) - the role guide for platform owners, service providers, and service consumers.
4. [Account model](./account-model.md) - how organizations and accounts map to isolated control planes.
5. [Control planes and workspaces](./control-planes.md) - how Platform Mesh uses kcp workspaces without duplicating the full kcp docs.
6. [Provider bootstrap](./provider-bootstrap.md) - how Platform Mesh provisions a dedicated workspace and kubeconfig for each service provider.
7. [API sharing](./api-sharing.md) - how provider APIs become available in consumer workspaces.
8. [Identity and authorization](./identity-and-authorization.md) - how identity, authorization data, and kcp enforcement relate.
9. [Integration paths](./integration-paths.md) - when providers should use api-syncagent, multicluster-runtime, or related mechanisms.
10. [Interaction patterns](./interaction-patterns/provider-to-consumer.md) - common provider-consumer, provider-provider, and cross-consumption flows.

For factual lookup, use [Reference](/reference/). For guided local setup, start with [Tutorials](/tutorials/).
