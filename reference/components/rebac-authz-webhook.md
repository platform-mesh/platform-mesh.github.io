# rebac-authz-webhook

## Purpose

`rebac-authz-webhook` connects kcp authorization requests to the relationship-based authorization data Platform Mesh keeps in OpenFGA. It is installed as a Kubernetes authorization webhook and answers `SubjectAccessReview` requests for kcp logical clusters.

It is the runtime bridge between the Kubernetes authorization path and the Platform Mesh permission model. Users and service accounts still authenticate through kcp and the identity stack; the webhook contributes authorization decisions based on the OpenFGA stores and tuples maintained by the [Security operator](./security-operator.md).

::: warning
This component is in alpha. APIs, request handling, and deployment wiring may change on short notice, including breaking changes.
:::

## Runtime role

At runtime kcp calls this webhook from its authorization chain. The process runs the `serve` command, builds a kcp-aware multicluster manager, and serves an HTTPS endpoint at `/authz`.

The webhook:

1. Receives Kubernetes `SubjectAccessReview` requests from kcp.
2. Identifies the target logical cluster from the request attributes.
3. Looks up workspace and organization context through kcp.
4. Evaluates permissions against the relevant OpenFGA store.
5. Returns an authorization response to kcp.

The webhook does not create workspaces, users, realms, OpenFGA stores, or authorization models. Those resources are prepared by other Platform Mesh components, especially the [Account operator](./account-operator.md) and [Security operator](./security-operator.md).

`rebac-authz-webhook` does not own any CRDs. At runtime it reads `LogicalCluster` (`core.kcp.io`) and `Store` (`core.platform-mesh.io`) resources from kcp, and discovers virtual workspace URLs through `APIExportEndpointSlice`.

## How it fits into Platform Mesh

Platform Mesh separates the responsibilities for identity, tenancy, policy storage, and request-time authorization:

| Component | Role |
| --- | --- |
| [Account operator](./account-operator.md) | Creates the account workspace structure in kcp. |
| [Security operator](./security-operator.md) | Creates OpenFGA stores, authorization models, tuples, and identity configuration. |
| [OpenFGA](./openfga.md) | Stores and evaluates relationship-based authorization data. |
| kcp | Receives Kubernetes API requests and calls the authorization webhook. |
| `rebac-authz-webhook` | Translates kcp authorization reviews into OpenFGA checks. |

```mermaid
flowchart LR
  userRequest["User or service request"] --> kcp["kcp API server"]
  kcp --> sar["SubjectAccessReview"]
  sar --> webhook["rebac-authz-webhook /authz"]
  webhook --> workspaceContext["kcp workspace context"]
  workspaceContext --> openfga["OpenFGA authorization store"]
  openfga --> decision["Authorization response"]
  decision --> kcp
```

## Concepts and dependencies

`rebac-authz-webhook` depends on these Kubernetes and kcp concepts:

| Concept | Role here |
| --- | --- |
| [Kubernetes webhook authorization](https://kubernetes.io/docs/reference/access-authn-authz/webhook/) | The HTTPS webhook protocol used by kcp to call `/authz`. |
| [`SubjectAccessReview`](https://kubernetes.io/docs/reference/access-authn-authz/authorization/#checking-api-access) | Request and response object sent between kcp and the webhook. |
| [Kubernetes RBAC](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) | Used for the management-cluster `ClusterRole` listed under [RBAC and permissions](#rbac-and-permissions). |
| [kcp workspaces and logical clusters](https://docs.kcp.io/kcp/main/concepts/workspaces/) | Each kcp workspace is a logical cluster; the webhook reads `LogicalCluster` to identify the request's workspace. |
| [kcp `APIExport` / `APIExportEndpointSlice`](https://docs.kcp.io/kcp/main/concepts/apis/exporting-apis/) | Used at startup to discover virtual-workspace URLs for per-logical-cluster access. |
| [kcp virtual workspaces](https://docs.kcp.io/kcp/main/concepts/workspaces/virtual-workspaces/) | Per-export endpoints the webhook calls into to read kcp resources scoped to a single logical cluster. |
| [multicluster-runtime](https://github.com/kubernetes-sigs/multicluster-runtime) + [kcp-dev/multicluster-provider](https://github.com/kcp-dev/multicluster-provider) | Provide the multicluster manager used to watch kcp logical clusters. See also [multi-cluster-runtime](./multi-cluster-runtime.md). |
| [kcp-operator](./kcp-operator.md) | Reconciles `RootShard` and `Shard` CRs into running kcp shards, including the `spec.authorization.webhook` configuration that points kcp at this webhook. |
| [OpenFGA](./openfga.md) | The relationship-based authorization engine the webhook delegates `Check` calls to. |

## Authorization model

The webhook accepts JSON `authorization.k8s.io/v1` and `v1beta1` `SubjectAccessReview` requests and returns a JSON `SubjectAccessReview` response.

kcp authenticates the caller before invoking the webhook and sends the resulting user in `spec.user`. The webhook trusts that identity and only decides whether the requested verb and resource are allowed in OpenFGA.

The authorization path has three high-level cases:

| Case | What happens |
| --- | --- |
| Non-resource requests | Discovery paths such as `/api`, `/openapi`, and `/version` are allowed directly so Kubernetes clients can discover the API surface. |
| The `root:orgs` workspace | Requests against the shared organizations workspace are checked against the OpenFGA store named `orgs`. |
| Workspaces under `root:orgs` | Requests against organization and account workspaces (for example `root:orgs:default` or `root:orgs:default:foo`) are checked against that organization's OpenFGA store. |

The webhook returns `allowed: true` when OpenFGA authorizes the request. Otherwise it returns `allowed: false` without setting `denied: true`, which kcp treats as "no opinion" and resolves through the rest of the authorizer chain.

### Workspace context

Platform Mesh authorization is workspace-aware. The webhook uses kcp information to understand whether a request targets the shared `root:orgs` workspace or a workspace below `root:orgs:*`.

For account workspaces, the webhook keeps a cache of workspace context. This cache links a logical cluster to the corresponding organization, account, REST mapping, and OpenFGA store ID. That context lets the webhook evaluate Kubernetes verbs such as `get`, `create`, `list`, `watch`, `update`, `patch`, and `delete` against the correct authorization model.

### Relationship-based checks

OpenFGA stores the relationship graph for organizations, accounts, namespaces, and resources. The webhook turns the Kubernetes request into an OpenFGA check using the requesting user, the requested verb, the resource type, and the workspace context. For account workspaces, the request can also include contextual parent relationships so OpenFGA can evaluate inherited permissions.

## kcp and OpenFGA integration

The webhook needs access to the root kcp API server for discovery. It discovers `APIExportEndpointSlice` objects from the root API server and then uses the virtual workspace URLs from those endpoint slices for per-logical-cluster access.

The default endpoint slice name is `core.platform-mesh.io`. This can be overridden with `--kcp-api-export-endpoint-slice-name`.

At startup the webhook:

1. Creates a kcp cluster client from the root API URL.
2. Reads the `LogicalCluster` named `cluster` in `root:orgs`.
3. Lists OpenFGA stores named `orgs` and uses the first returned store as the shared orgs store. The process exits if no such store exists.
4. Starts a cluster cache that engages logical clusters discovered through the multicluster manager.

For account workspaces, the cluster cache reads `Store` resources in `root:orgs` and uses `status.storeId` to route checks to the correct OpenFGA store.

## Configuration

### CLI flags

| Flag | Default | Description |
| --- | --- | --- |
| `--metrics-bind-address` | `:9090` | Bind address for controller-runtime metrics. |
| `--health-probe-bind-address` | `:8090` | Bind address for health and readiness probes. |
| `--openfga-addr` | `openfga.platform-mesh-system:8081` | OpenFGA gRPC address. |
| `--webhook-cert-dir` | `config` | Directory containing webhook serving certificates. The chart mounts the cert secret at `/config`, matching this flag's working directory. |
| `--webhook-cluster-key` | `authorization.kubernetes.io/cluster-name` | `SubjectAccessReview.spec.extra` key carrying the target logical-cluster ID. kcp populates this attribute, and the webhook uses it to choose between the shared `orgs` store and a per-organization store. |
| `--webhook-allowed-nonresource-prefixes` | `/api`, `/openapi`, `/version` | Non-resource URL prefixes the webhook allows directly. |
| `--kcp-api-export-endpoint-slice-name` | `core.platform-mesh.io` | kcp `APIExportEndpointSlice` used for logical-cluster discovery. |

### Environment variables

| Variable | Description |
| --- | --- |
| `KUBECONFIG` | Kubeconfig used by controller-runtime. In the Helm chart this points to `/api-kubeconfig/kubeconfig` when `kcp.kubeconfig.secret` is set. |

### Helm

The deployment chart is `rebac-authz-webhook` in [platform-mesh/helm-charts](https://github.com/platform-mesh/helm-charts/tree/main/charts/rebac-authz-webhook). The authoritative values table is generated in the chart README.

Important defaults:

| Value | Default | Description |
| --- | --- | --- |
| `image.name` | `ghcr.io/platform-mesh/rebac-authz-webhook` | Container image. |
| `openfga.url` | `openfga:8081` | OpenFGA address passed to `--openfga-addr`. |
| `kcp.kubeconfig.secret` | `rebac-authz-webhook-kubeconfig` | Secret mounted at `/api-kubeconfig`; must contain key `kubeconfig`. |
| `service.port` | `9443` | HTTPS authorization webhook service port. |
| `service.metricsPort` | `8080` | Metrics port exposed by the Service. |
| `healthProbeBindAddress` | `:8081` | Health/readiness bind address used by the chart; passed to `--health-probe-bind-address` and overrides the binary default `:8090`. |
| `certificates.create` | `false` | When true, the chart renders cert-manager issuer and certificate resources. |

The Deployment runs the binary with `serve`, mounts serving certificates from `rebac-authz-webhook-cert` at `/config`, and exposes container ports `9443` (webhook server) and `8080` (metrics, also exposed by the Service).

## RBAC and permissions

The chart installs a `ClusterRole` bound to the webhook's `ServiceAccount` on the management cluster:

| API group | Resources | Verbs |
| --- | --- | --- |
| `core.platform-mesh.io` | `accounts`, `accounts/status` | `get`, `list`, `watch` |
| (core) | `namespaces` | `get`, `list`, `watch` |

All workspace-scoped reads (`LogicalCluster`, `Store`, `APIExportEndpointSlice`, dynamic REST mapping) go through the kcp kubeconfig mounted from `rebac-authz-webhook-kubeconfig`, not through the management-cluster `ClusterRole`.

## Observability

The webhook exposes controller-runtime Prometheus metrics on `--metrics-bind-address` (binary default `:9090`). Standard controller-runtime metrics are exported, including reconcile counts, latencies, and workqueue depth.

OpenTelemetry instrumentation covers outgoing kcp HTTP calls and OpenFGA gRPC calls. Trace export is configured through standard `OTEL_*` environment variables, which can be supplied through the chart's `extraEnvs`.

Logging uses `klog` and the standard Kubernetes logging flags. The chart appends `--v={{ .Values.v }}` when `v` is set.

## TLS and trust

kcp calls the webhook over HTTPS, so it must trust the certificate served by `/authz`. That certificate is signed by an in-cluster CA. The [Platform Mesh operator](./platform-mesh-operator.md) copies the matching CA bundle into the kubeconfig kcp uses for the webhook call.

1. The Platform Mesh operator applies a self-signed cert-manager `Issuer` (`rebac-authz-webhook-issuer`) and a `Certificate` (`rebac-authz-webhook-cert`) for the in-cluster DNS name `rebac-authz-webhook.platform-mesh-system.svc.cluster.local`.
2. The chart mounts the resulting `rebac-authz-webhook-cert` Secret at `/config`; `controller-runtime`'s webhook server picks the cert up via `--webhook-cert-dir`.
3. The static `kcp-webhook-secret` template only contains `server`. The Platform Mesh operator's deployment subroutine reads `ca.crt` from the cert Secret and writes it into the kubeconfig stored in `kcp-webhook-secret` as `certificate-authority-data` for every `cluster` entry.
4. kcp loads `kcp-webhook-secret` via `authorization.webhook.configSecretName` (set by the `infra` chart) and validates the webhook's serving certificate against that injected CA bundle.

The webhook does not authenticate the caller itself. In the default setup, it relies on the in-cluster Service and serving certificate, and does not use client-certificate mTLS.

## Deployment and Platform Mesh wiring

Platform Mesh installs the webhook through the `platform-mesh-operator-components` chart. The service entry is enabled by default:

| Value | Default |
| --- | --- |
| `services.rebac-authz-webhook.enabled` | `true` |
| `services.rebac-authz-webhook.values.openfga.url` | `openfga:8081` |
| `services.rebac-authz-webhook.values.certManager.enabled` | `true` |
| `services.rebac-authz-webhook.values.certManager.createCA` | `true` |
| `services.rebac-authz-webhook.imageResources[].annotations.for` | `rebac-authz-webhook` |

The `infra` chart configures kcp to call the webhook:

| Value | Default |
| --- | --- |
| `kcp.webhook.enabled` | `true` |
| `kcp.webhook.server` | `https://rebac-authz-webhook.platform-mesh-system.svc.cluster.local:9443/authz` |
| `kcp.webhook.authorizationWebhookSecretName` | `kcp-webhook-secret` |
| `kcp.webhook.port` | `9443` |
| `kcp.webhook.version` | `v1` |

The infra chart templates these values into the `RootShard` and `Shard` custom resources (`operator.kcp.io/v1alpha1`) under `spec.authorization.webhook.{configSecretName,version}`. The [kcp-operator](./kcp-operator.md) reconciles those CRs into the running kcp shards.

At runtime, kcp loads `kcp-webhook-secret` and calls its `/authz` URL for authorization decisions. The CA bundle in that kubeconfig is filled in by the Platform Mesh operator, as described in [TLS and trust](#tls-and-trust). The chart's own `certificates.create` is left at `false` because the certificate is issued by the Platform Mesh operator.

## Local setup notes

The component ships in the standard Platform Mesh local setup; see [`helm-charts/local-setup`](https://github.com/platform-mesh/helm-charts/tree/main/local-setup). The local `PlatformMesh` overlay enables `hostAliases` for kcp host name resolution. OpenFGA and the Security operator must be healthy before the webhook can return useful authorization decisions.

## Operations

For day-to-day debugging, start from the dependency chain:

- kcp must reference `kcp-webhook-secret` as its authorization webhook config.
- `kcp-webhook-secret` must point to `https://rebac-authz-webhook.platform-mesh-system.svc.cluster.local:9443/authz`.
- The `rebac-authz-webhook` Service must be reachable on port `9443`.
- The pod needs a valid root kcp kubeconfig and access to the configured `APIExportEndpointSlice` (default `core.platform-mesh.io`).
- OpenFGA must be reachable at the configured address. An OpenFGA store named `orgs` must exist before the webhook starts; otherwise the process exits.
- Organization `Store` resources should have `status.storeId` populated before account workspace requests can be evaluated.

If the webhook returns no opinion (`allowed: false` without `denied: true`), it means this webhook did not allow the request; kcp's final decision depends on the rest of its authorizer chain, not on an explicit deny from the webhook.

## Repository

- [platform-mesh/rebac-authz-webhook](https://github.com/platform-mesh/rebac-authz-webhook)
- [platform-mesh/helm-charts](https://github.com/platform-mesh/helm-charts/tree/main/charts/rebac-authz-webhook)

## Related

- [OpenFGA](./openfga.md)
- [Security operator](./security-operator.md)
- [Account operator](./account-operator.md)
- [kcp](./kcp.md)
- [Identity and authorization](../../concepts/identity-and-authorization.md)
- [Authentication](../../concepts/security/authentication.md)
