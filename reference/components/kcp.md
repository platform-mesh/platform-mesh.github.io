# kcp

## Purpose

kcp provides the Kubernetes-like control plane used by Platform Mesh for workspaces, APIExports, APIBindings, and logical multi-tenancy.

## Runtime role

kcp is the core control-plane substrate. Platform Mesh account and provider-consumer flows are built on top of kcp workspaces and API sharing primitives.

## Repository

- Upstream: [kcp-dev/kcp](https://github.com/kcp-dev/kcp)
- Related operator: [kcp-dev/kcp-operator](https://github.com/kcp-dev/kcp-operator)

## Related epic tasks

- [platform-mesh/backlog#249](https://github.com/platform-mesh/backlog/issues/249) - document kcp sharding in Platform Mesh local setup
- [platform-mesh/backlog#250](https://github.com/platform-mesh/backlog/issues/250) - update kcp 0.31+ and kcp operator to 0.7.1+

## Future component reference

Add Platform Mesh-specific sharding, local setup topology, virtual workspace behavior, and operational implications for operators.

## Related

- [Control planes](/concepts/control-planes.md)
- [API sharing](/concepts/api-sharing.md)
