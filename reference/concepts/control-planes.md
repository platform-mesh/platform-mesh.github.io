# Control planes and workspaces

## Platform Mesh meaning

Platform Mesh uses kcp workspaces as isolated Kubernetes-compatible API surfaces for accounts, providers, consumers, and marketplace-related flows.

In Platform Mesh:

- an account maps to a kcp workspace or workspace-backed control-plane context
- provider APIs are published from provider workspaces
- consumer accounts bind provider APIs into their own workspaces
- Platform Mesh components reconcile resources across workspaces while preserving authorization boundaries

## Upstream ownership

kcp owns the full behavior of workspaces, workspace types, virtual workspaces, logical clusters, and sharding.

Use upstream kcp documentation for canonical details:

- [kcp workspaces](https://docs.kcp.io/kcp/main/concepts/workspaces/)
- [Workspace CRD reference](https://docs.kcp.io/kcp/main/reference/crd/tenancy.kcp.io/workspaces/)

## Platform Mesh notes

- A workspace is not a physical Kubernetes cluster.
- Platform Mesh uses workspaces to avoid creating a cluster for every account boundary.
- Available APIs can differ per workspace because APIs can be bound into a workspace.
- In sharded kcp setups, Platform Mesh components must be aware that workspaces may be hosted on different shards.

## Related

- [Control planes concept](/concepts/control-planes.md)
- [Account model](/reference/concepts/account-model.md)
- [APIExport and APIBinding](./api-export-binding.md)
- [kcp component](/reference/components/kcp.md)
