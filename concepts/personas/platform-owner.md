# Platform owner

A platform owner operates Platform Mesh as the shared service-management layer for an organization. They make sure providers can publish services, consumers can safely use them, and the platform has a consistent account, identity, and authorization model.

## Goal

Create a secure and operable mesh where service capabilities can be offered and consumed without every team inventing its own integration pattern.

## Responsibilities

- Operate the Platform Mesh runtime and its core components.
- Define the account hierarchy and workspace model used by providers and consumers.
- Configure identity, authorization, and policy boundaries.
- Onboard service providers and make their APIs discoverable.
- Decide which components are installed, upgraded, and exposed to users.

## Ownership boundary

The platform owner owns the **mesh itself** — the control plane substrate, the account hierarchy, identity and authorization wiring, and the marketplace surface. They do not own provider implementations or consumer workloads. Their relationship to providers is onboarding and lifecycle; their relationship to consumers is enabling discovery, binding, and policy.

## Recommended reading

Start with [Why Platform Mesh?](../why-platform-mesh.md) for motivation, then read [Architecture](../architecture.md) for component layout, [Account model](../account-model.md) for the hierarchy, and [Control planes and workspaces](../control-planes.md) for how the kcp substrate is used. Use [Identity and authorization](../identity-and-authorization.md) for the runtime relationship between Keycloak, OpenFGA, and the kcp authorizer. Use [Components](/reference/components/) for factual component lookup.

## Related

- [Personas overview](./index.md)
- [Service provider](./service-provider.md) — the role onboarded by platform owners
- [Service consumer](./service-consumer.md) — the role enabled by platform owners
- [Account model](../account-model.md)
- [Architecture](../architecture.md)
