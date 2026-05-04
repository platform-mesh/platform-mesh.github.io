# Account operator

## Purpose

The account operator is the Platform Mesh component that converts defined account or organization entities into live control-plane structure. It owns reconciliation of the `Account`-Resource and ties its lifecycle to **kcp** workspace lifecycle. It ensures that each account gets the right isolation, workspace typing, and discoverable metadata.

Its role is to sit between the tenancy declared and how kcp exposes that tenancy without concerning itself with the implementation of identity or access management.

## Resources

### **Account (`core.platform-mesh.io/v1alpha1`)**
`Account` represents an entity in the workspace tree that can potentially hold other Accounts. `spec.type` currently only distinguishes an **organization** (type: `org`) from an **account** (type: `account`) but will possibly support other account types in the future. The spec carries display metadata, optional extensions, and structured `data`.

Reconciliation of an `Account` resource runs through the following steps:
1. Webhooks validate the `Account` and set `spec.creator` to the respective Kubernetes user creating the resource.
2. Depending on the account type, one or more finalizers are added for later cleanup.
3. For accounts of type `org`, `WorkspaceTypes` for the organization's `Workspace` itself and its child `Accounts` are created.
4. A `Workspace` for the `Account` is created, using one of the above mentioned `WorkspaceTypes`, depending on the account type.
5. An `AccountInfo` resource of name `account` is created within the `Account`'s `Workspace` and populated with information.
6. Readiness of the resource itself is blocked until the earlier created `Workspace` is ready, i.e. potential initializers have finished. This ensures that the [security operator](/reference/components/security-operator.md) is finished with its work.

### **AccountInfo (`core.platform-mesh.io/v1alpha1`)**
An `AccountInfo` resource with name `account` is created by the account operator in an account's workspace and holds information about the account the workspace belongs to. Its purpose is to expose that information to internal components that don't have information about or permission to workspaces/accounts higher up in the tree.

Reconciliation of an `AccountInfo` resource runs through the following steps:
1. A finalizer is added. There are no other actions happening until the resource is deleted. Other components like the [security operator](/reference/components/security-operator.md) are expected to add their own finalizers when depending on information of the resource for e.g. `Workspace` termination.
2. During deletion, removal of the resource is blocked by withholding finalizer removal until the `Workspace`/`Account` does not have any child accounts anymore.

Together, these pieces implement the account model described in [Account model](/concepts/account-model.md) and the resource-oriented view in [Account resource](/reference/resources/account-resource.md).

## Installation / configuration notes

### Helm
The deployment chart is **`account-operator`** in [platform-mesh/helm-charts](https://github.com/platform-mesh/helm-charts), CRDs ship as **`account-operator-crds`**. The authoritative values table is located in [charts/account-operator README](https://github.com/platform-mesh/helm-charts/blob/main/charts/account-operator/README.md).

### CLI Flags
| Type | Flag | Default | Description |
| --- | --- | --- | --- |
| Account operator-specific | **`--webhooks-enabled`** | `false` | Enable the webhook server |
| Account operator-specific | **`--webhooks-cert-dir`** | `certs` | Webhook TLS certificate directory |
| Account operator-specific | **`--webhooks-port`** | `9443` | Webhook server listen port |
| Account operator-specific | **`--webhooks-deny-list`** | *(empty)* | Comma-separated denied organization names |
| Account operator-specific | **`--webhooks-additional-account-types`** | *(empty)* | Extra allowed `spec.type` values (`StringSlice`; repeat **`--flag=v`** per value) |
| Account operator-specific | **`--subroutines-workspace-type-enabled`** | `true` | WorkspaceType subroutine |
| Account operator-specific | **`--subroutines-workspace-enabled`** | `true` | Workspace subroutine |
| Account operator-specific | **`--subroutines-workspace-ready-enabled`** | `true` | Workspace ready subroutine |
| Account operator-specific | **`--subroutines-account-info-enabled`** | `true` | ManageAccountInfo subroutine |
| Account operator-specific | **`--controllers-account-info-enabled`** | `true` | AccountInfo controller (finalizer / deletion gate) |
| Account operator-specific | **`--kcp-api-export-endpoint-slice-name`** | `core.platform-mesh.io` | APIExportEndpointSlice name |
| Account operator-specific | **`--kcp-provider-workspace`** | `root` | Provider workspace |
| Common | **`--debug-label-value`** | *(empty)* | Debug label value for controller filters |
| Common | **`--max-concurrent-reconciles`** | `10` | Max concurrent reconciles per controller |
| Common | **`--environment`** | *(empty)* | Service environment label |
| Common | **`--region`** | `local` | Region label (e.g. local, staging, prod) |
| Common | **`--kubeconfig`** | *(empty)* | Kubeconfig file path |
| Common | **`--is-local`** | `false` | Mark execution as local |
| Common | **`--image-name`** | *(empty)* | Image name metadata |
| Common | **`--image-tag`** | *(empty)* | Image tag metadata |
| Common | **`--log-level`** | `info` | Log level |
| Common | **`--no-json`** | `false` | Disable JSON logs |
| Common | **`--shutdown-timeout`** | `1m` | Graceful shutdown timeout |
| Common | **`--metrics-bind-address`** | `:9090` | Metrics bind address |
| Common | **`--metrics-secure`** | `false` | Serve metrics over HTTPS |
| Common | **`--tracing-enabled`** | `false` | Enable OTLP tracing |
| Common | **`--tracing-config-service-name`** | *(empty)* | Trace resource service name |
| Common | **`--tracing-config-service-version`** | *(empty)* | Trace resource service version |
| Common | **`--tracing-config-collector-endpoint`** | *(empty)* | OTLP collector endpoint |
| Common | **`--enable-http2`** | `true` | HTTP/2 for metrics and webhook servers |
| Common | **`--health-probe-bind-address`** | `:8090` | Liveness/readiness bind address |
| Common | **`--leader-elect`** | `false` | Enable controller-manager leader election |

### Environment variables

| Variable | Description |
| --- | --- |
| **`KUBECONFIG`** | Kubeconfig to use |

## Links

| Kind | Link |
| --- | --- |
| Source repository | [platform-mesh/account-operator](https://github.com/platform-mesh/account-operator) |
| Helm charts | [platform-mesh/helm-charts](https://github.com/platform-mesh/helm-charts) — `charts/account-operator`, `charts/account-operator-crds` |


## Related

- [Account model](/concepts/account-model.md)
- [Account resource](/reference/resources/account-resource.md)
- [kcp](./kcp.md)
