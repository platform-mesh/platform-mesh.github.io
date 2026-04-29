# kcp

[kcp](https://docs.kcp.io/kcp/main/) is a Kubernetes-style API server with the container orchestration removed. It keeps the declarative API control plane — workspaces, CRDs, RBAC, the watch/list/reconcile model — and turns it into a substrate for managing arbitrary services through KRM.

Platform Mesh runs on top of kcp. Every Platform Mesh account, organization, provider, and marketplace surface is a kcp workspace; every cross-account interaction goes through `APIExport` / `APIBinding`; every authentication and authorization decision passes through kcp's chain.

## Why kcp

- **One API per account.** Each kcp workspace is an isolated Kubernetes-shaped API endpoint with its own resources, RBAC, and identity. Platform Mesh maps the [account model](/concepts/account-model.md) directly onto the workspace tree.
- **Cheap multi-tenancy.** Workspaces share a single process and etcd, isolated by storage prefix. No per-tenant cluster.
- **Cross-workspace API sharing.** Service providers publish APIs once via `APIExport`; consumers bind them into their workspace and use them like native resources. See [API sharing](./kcp/api-sharing.md).
- **Pluggable identity and authorization.** OIDC plugs into the front proxy, OpenFGA plugs into the authorizer chain via the [rebac-authz-webhook](./rebac-authz-webhook.md). See [Identity and authorization](./kcp/identity-and-authorization.md).
- **Workspace-aware controllers.** [api-syncagent](./api-syncagent.md), [account-operator](./account-operator.md), and [security-operator](./security-operator.md) reconcile across workspaces using kcp's virtual-workspace endpoints. See [Watch and sync](./kcp/watch-and-sync.md) and [Virtual workspaces](./kcp/virtual-workspaces.md).

## What Platform Mesh uses from kcp

| Topic | What it covers |
| --- | --- |
| [Workspaces](./kcp/workspaces.md) | `Workspace`, `WorkspaceType`, `LogicalCluster`, hierarchical paths, the `orgs` and `account` types Platform Mesh defines. |
| [API sharing](./kcp/api-sharing.md) | `APIExport`, `APIBinding`, `APIResourceSchema`, permission claims, identity hash, `APIExportEndpointSlice`. |
| [Identity and authorization](./kcp/identity-and-authorization.md) | Front proxy, OIDC (`AuthenticationConfiguration` + `WorkspaceAuthenticationConfiguration`), `AuthorizationConfiguration` chain, rebac-authz-webhook wiring. |
| [Virtual workspaces](./kcp/virtual-workspaces.md) | `/services/apiexport/...` endpoints, reading `APIExportEndpointSlice.status`, terminating-phase URLs from `WorkspaceType.status.virtualWorkspaces`. |
| [Watch and sync](./kcp/watch-and-sync.md) | `multicluster-provider`, `pathaware` and `apiexport` flavors, `mcreconcile.Request`, `manager.GetCluster()`. |
| [Sharding](./sharding.md) | Sharded topology in Platform Mesh local setup and production. |

[kcp-operator](./kcp-operator.md) deploys kcp itself: `RootShard`, `Shard`, `FrontProxy`, `CacheServer`, and `Kubeconfig` CRs. It is a sibling component, not part of kcp.

## kcp.io annotations Platform Mesh reads or writes

| Annotation | Set by | Used by |
| --- | --- | --- |
| `kcp.io/cluster` | kcp on objects returned through wildcard / virtual-workspace reads | Platform Mesh controllers to identify the source workspace |
| `kcp.io/path` | kcp on `LogicalCluster` | Platform Mesh controllers for routing and `Workspace.spec.type.path` references |
| `authorization.kcp.io/required-groups` | platform owners, on workspaces | kcp authorizer chain (required-groups stage) |
| `authentication.kcp.io/scopes` | tooling | kcp front proxy / authentication |

## Repository

- Upstream: [kcp-dev/kcp](https://github.com/kcp-dev/kcp)
- Operator: [kcp-dev/kcp-operator](https://github.com/kcp-dev/kcp-operator) — see [kcp-operator](./kcp-operator.md)
- Multi-cluster client: [kcp-dev/multicluster-provider](https://github.com/kcp-dev/multicluster-provider)
- Upstream docs: [docs.kcp.io](https://docs.kcp.io/kcp/main/)

## Related

- [Control planes and workspaces](/concepts/control-planes.md)
- [API sharing](/concepts/api-sharing.md)
- [Identity and authorization](/concepts/identity-and-authorization.md)
- [Architecture](/concepts/architecture.md)
