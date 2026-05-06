# API sharing

Provider workspaces export APIs; account workspaces bind them. Once bound, the exported types appear as native resources in the consumer workspace and are subject to the same RBAC and authorization chain as anything else in that workspace.

See [API sharing](/concepts/api-sharing.md) for how Platform Mesh layers account structure and IAM wiring on top of these primitives.

## Primitives

| Primitive | Platform Mesh role | Upstream |
| --- | --- | --- |
| `APIResourceSchema` | Immutable schema. [api-syncagent](../api-syncagent.md) generates these from CRDs; Platform Mesh hand-authors them for `core.platform-mesh.io` and `system.platform-mesh.io`. | [API resource schemas](https://docs.kcp.io/kcp/main/concepts/apis/api-resource-schemas/) |
| `APIExport` | Publishes a set of schemas in a provider workspace. | [Exporting APIs](https://docs.kcp.io/kcp/main/concepts/apis/exporting-apis/) |
| `APIBinding` | Imports an `APIExport` into a consumer workspace. | [Binding APIs](https://docs.kcp.io/kcp/main/concepts/apis/binding-apis/) |
| Permission claims | Provider declares; consumer accepts. Platform Mesh uses these heavily for `workspaces`, `apibindings`, `logicalclusters`, `secrets`. | [Permission claims](https://docs.kcp.io/kcp/main/concepts/apis/exporting-apis/#permission-claims) |
| Identity hash | SHA-256 in `APIExport.status.identityHash`. Used by consumers to scope claim lookups across multiple exports of the same group/resource. | [Exporting APIs](https://docs.kcp.io/kcp/main/concepts/apis/exporting-apis/) |
| `APIExportEndpointSlice` | Publishes virtual-workspace URLs. | [Endpoint slices](https://docs.kcp.io/kcp/main/concepts/apis/api-export-endpoint-slices/) |

## API versions

`apis.kcp.io` serves both `v1alpha1` and `v1alpha2`. kcp converts between them automatically. Platform Mesh ships APIExport templates on `v1alpha1` and APIBinding templates on `v1alpha2`; both halves work against any consumer using either version. For the full schema and conversion semantics, see kcp's [exporting-apis](https://docs.kcp.io/kcp/main/concepts/apis/exporting-apis/) and [binding-apis](https://docs.kcp.io/kcp/main/concepts/apis/binding-apis/) docs.

## APIExport — `core.platform-mesh.io`

The Platform Mesh core APIExport publishes the `Account`, `AccountInfo`, `AuthorizationModel`, `Store`, and `Invite` schemas, and claims access to upstream tenancy and Kubernetes resources it needs to reconcile:

```yaml
# platform-mesh-operator/manifests/kcp/01-platform-mesh-system/apiexport-core.platform-mesh.io.yaml
apiVersion: apis.kcp.io/v1alpha1
kind: APIExport
metadata:
  name: core.platform-mesh.io
spec:
  latestResourceSchemas:
  - v260126-7c674ee.accountinfos.core.platform-mesh.io
  - v260109-82344be.accounts.core.platform-mesh.io
  - v260112-5925c7e.authorizationmodels.core.platform-mesh.io
  - v250718-a64f278.stores.core.platform-mesh.io
  - v260213-fbdf981.invites.core.platform-mesh.io
  permissionClaims:
    - all: true
      group: tenancy.kcp.io
      identityHash: {{ .apiExportRootTenancyKcpIoIdentityHash }}
      resource: workspaces
    - all: true
      group: tenancy.kcp.io
      identityHash: {{ .apiExportRootTenancyKcpIoIdentityHash }}
      resource: workspacetypes
    - resource: apibindings
      group: apis.kcp.io
      all: true
    - resource: logicalclusters
      group: core.kcp.io
      all: true
    - resource: secrets
      group: ""
      all: true
```

The templated `identityHash` values are filled in at apply time from the upstream tenancy.kcp.io APIExport's status.

## APIBinding — accepting permission claims

Consumers must explicitly accept each claim. The matching binding for the export above uses the `v1alpha2` API, which adds `selector` and `verbs`:

```yaml
# platform-mesh-operator/manifests/kcp/01-platform-mesh-system/apibinding-core.platform-mesh.io.yaml
apiVersion: apis.kcp.io/v1alpha2
kind: APIBinding
metadata:
  name: core.platform-mesh.io
spec:
  reference:
    export:
      name: core.platform-mesh.io
      path: root:platform-mesh-system
  permissionClaims:
  - resource: workspaces
    group: tenancy.kcp.io
    selector: { matchAll: true }
    verbs: ['*']
    state: Accepted
    identityHash: {{ .apiExportRootTenancyKcpIoIdentityHash }}
  - resource: identityproviderconfigurations
    group: core.platform-mesh.io
    selector: { matchAll: true }
    verbs: ['*']
    state: Accepted
    identityHash: {{ .apiExportSystemPlatformMeshIoIdentityHash }}
```

`selector.matchAll: true` accepts every object in the resource type. Consumers can scope further with `matchLabels` or `matchExpressions`.

## APIExportEndpointSlice

Provider controllers (and the rebac-authz-webhook) read this resource to discover the virtual-workspace URLs they should connect to. Each `APIExport` in Platform Mesh has a matching slice:

```yaml
# platform-mesh-operator/manifests/kcp/01-platform-mesh-system/apiexportendpointslice-core.platform-mesh.io.yaml
apiVersion: apis.kcp.io/v1alpha1
kind: APIExportEndpointSlice
metadata:
  name: core.platform-mesh.io
spec:
  export:
    path: root:platform-mesh-system
    name: core.platform-mesh.io
```

The URLs land in `status.endpoints[].url`. See [Virtual workspaces](./virtual-workspaces.md) for how Platform Mesh consumes them.

## Claim patterns across the platform-mesh org

Different providers claim different things. Three patterns to compare:

- **`api-syncagent` — automatic claims.** Every APIExport managed by api-syncagent gets `events` and `namespaces` claims injected automatically. If a `PublishedResource` declares a `related` Secret (e.g. for connection credentials), api-syncagent adds a `secrets` claim too. Providers using api-syncagent rarely write claim YAML themselves. ([related resources](https://github.com/kcp-dev/api-syncagent/blob/main/docs/content/publish-resources/related-resources.md))
- **`gardener-syncer` — full-access claim on Secrets.** Claims `secrets` with `verbs: ["*"]` because it both reads provider credentials and writes Shoot-related secrets. ([apiexport-core.gardener.cloud.yaml](https://github.com/platform-mesh/gardener-syncer/blob/main/deploy/kcp/apiexport-core.gardener.cloud.yaml))
- **`resource-broker` — verb-scoped read-only claim.** Claims `secrets` with `verbs: [get, list, watch]`. The provider can observe credentials but cannot mutate them — the kind of claim platform owners want to see when reviewing provider onboarding. ([apiexport-acceptapis.yaml](https://github.com/platform-mesh/resource-broker/blob/main/examples/platform-mesh/root:providers:resource-broker/apiexport-acceptapis.yaml))

`selector` also accepts `matchLabels` and `matchExpressions`. Every accepted claim across the platform-mesh org today uses `matchAll: true`; selectors are available for restriction by label but not in production use yet.

Claims added to an existing APIExport do not retroactively apply — consumers must update the binding to accept new claims explicitly.

## Related

- [API sharing](/concepts/api-sharing.md) — Platform Mesh layering and design
- [Workspaces](./workspaces.md) — where APIExports live and how `defaultAPIBindings` create bindings
- [Virtual workspaces](./virtual-workspaces.md) — the read/write endpoint published per export
- [api-syncagent](../api-syncagent.md) — auto-generates `APIResourceSchema` and `APIExport` from CRDs
