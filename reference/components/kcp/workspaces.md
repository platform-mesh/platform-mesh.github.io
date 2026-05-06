# Workspaces

kcp workspaces are isolated Kubernetes-shaped API endpoints sharing a single process. Platform Mesh maps the [account model](/concepts/account-model.md) directly onto the workspace tree: organizations, accounts, providers, and the `platform-mesh-system` workspace are all kcp `Workspace` objects.

The [account-operator](../account-operator.md) creates and reconciles them.

## Primitives

| Primitive | Platform Mesh role | Upstream |
| --- | --- | --- |
| `Workspace` (`tenancy.kcp.io/v1alpha1`) | One per organization, account, or provider. | [Workspaces](https://docs.kcp.io/kcp/main/concepts/workspaces/workspaces/) |
| `WorkspaceType` | Defines API surface, default bindings, and parent/child constraints. Platform Mesh ships `orgs`, `org`, `account`. | [Workspace types](https://docs.kcp.io/kcp/main/concepts/workspaces/workspace-types/) |
| `LogicalCluster` (`core.kcp.io/v1alpha1`) | Singleton `cluster` object inside each workspace. The `kcp.io/path` annotation is what Platform Mesh controllers route on. | [Logical clusters](https://docs.kcp.io/kcp/main/concepts/terminology/#logical-cluster) |

## Workspace types Platform Mesh ships

The `orgs` workspace type — the parent of every organization — extends `universal`, default-binds the Platform Mesh core APIs, and references a `WorkspaceAuthenticationConfiguration` (see [Identity and authorization](./identity-and-authorization.md)):

```yaml
# platform-mesh-operator/manifests/kcp/workspace-type-orgs.yaml
apiVersion: tenancy.kcp.io/v1alpha1
kind: WorkspaceType
metadata:
  name: orgs
spec:
  defaultAPIBindings:
    - export: core.platform-mesh.io
      path: root:platform-mesh-system
    - export: system.platform-mesh.io
      path: root:platform-mesh-system
  defaultChildWorkspaceType:
    name: org
    path: root
  extend:
    with:
      - name: universal
        path: root
  limitAllowedChildren:
    types:
      - name: org
        path: root
  authenticationConfigurations:
  - name: orgs-authentication
```

The `account` type composes the `security` extension (which contributes the IAM Store reconciliation), restricts parents to `org` or `account`, and default-binds the workspace-type APIs needed for nesting:

```yaml
# platform-mesh-operator/manifests/kcp/workspace-type-account.yaml
apiVersion: tenancy.kcp.io/v1alpha1
kind: WorkspaceType
metadata:
  name: account
spec:
  defaultAPIBindings:
    - export: core.platform-mesh.io
      path: root:platform-mesh-system
    - export: tenancy.kcp.io
      path: root
    - export: topology.kcp.io
      path: root
  defaultChildWorkspaceType:
    name: account
    path: root
  limitAllowedChildren:
    types: [{ name: account, path: root }]
  limitAllowedParents:
    types:
      - { name: org, path: root }
      - { name: account, path: root }
  extend:
    with:
      - { name: universal, path: root }
      - { name: security, path: root }
```

## Workspace instances

The `:root:orgs` workspace is the root of every organization tree:

```yaml
# platform-mesh-operator/manifests/kcp/workspace-orgs.yaml
apiVersion: tenancy.kcp.io/v1alpha1
kind: Workspace
metadata:
  name: orgs
spec:
  type:
    name: orgs
    path: root
```

Org and account workspaces below it are created by the account-operator from `Account` CRs. See [Watch and sync](./watch-and-sync.md) for the controller pattern.

## Hierarchical paths

Workspace paths use `:` as the separator. The Platform Mesh tree looks like:

```
root
├── platform-mesh-system     # core APIExports, IAM stores, marketplace
├── orgs
│   └── <org-name>
│       └── <account>
│           └── <sub-account> ...
└── providers
    └── <provider-name>      # provider workspaces with APIExports
```

Controllers reference workspaces by path in `Workspace.spec.type.path`, in `APIBinding.spec.reference.export.path`, and in `APIExport.spec.permissionClaims[*].identityHash` lookups.

## Lifecycle hooks

`WorkspaceType` supports `spec.initializer` and `spec.terminator` flags. When set, kcp delays the `Ready` / `Deleting` phase until the workspace is processed by an external controller. The endpoints those controllers consume are documented in [Virtual workspaces](./virtual-workspaces.md). The [security-operator](../security-operator.md) implements the terminating phase for accounts.

## Related

- [Account model](/concepts/account-model.md) — the design rationale for the workspace tree
- [API sharing](./api-sharing.md) — how `defaultAPIBindings` resolve
- [Watch and sync](./watch-and-sync.md) — how controllers create and reconcile workspaces
- [Virtual workspaces](./virtual-workspaces.md) — initializer/terminator endpoints
