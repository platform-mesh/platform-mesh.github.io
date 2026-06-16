# ManagedProvider resource

## Definition

`ManagedProvider` is a namespace-scoped custom resource in the `providers.platform-mesh.io/v1alpha1` API group. It is a convenience API for platform admins to onboard platform-owned services end-to-end: it creates and manages a `Provider` on the kcp side, then copies the resulting kubeconfig and deploys service operator components on the runtime side.

For the conceptual overview, see [Provider bootstrap](/concepts/provider-bootstrap.md).

## Schema

A minimal `ManagedProvider` requires a `platformMeshRef` and at least one `runtimeDeployments` entry:

```yaml
apiVersion: providers.platform-mesh.io/v1alpha1
kind: ManagedProvider
metadata:
  name: my-service
  namespace: platform-mesh-system
spec:
  platformMeshRef:
    name: platform-mesh
  runtimeDeployments:
  - ocm:
      componentName: my-service-operator
      registry: ghcr.io/platform-mesh/ocm
      version: "1.0.0"
```

### Spec fields

| Field | Required | Default | Description |
| --- | --- | --- | --- |
| `platformMeshRef.name` | Yes | — | Name of the `PlatformMesh` instance this `ManagedProvider` belongs to. |
| `runtimeDeployments` | Yes | — | List of OCM components to deploy on the runtime cluster. |
| `runtimeDeployments[].ocm.componentName` | Yes | — | Fully qualified OCM component name. |
| `runtimeDeployments[].ocm.registry` | Yes | — | OCM registry host. |
| `runtimeDeployments[].ocm.version` | Yes | — | Component version to deploy. |
| `runtimeDeployments[].ocm.values` | No | — | Helm values passed to the deployed chart. |
| `provider.path` | No | `root:providers:system` | kcp workspace path where the `Provider` is created or adopted. |
| `provider.name` | No | `<ManagedProvider.name>` | Name of the `Provider` to create or adopt at `provider.path`. |
| `providerKubeconfigSecret.name` | No | `<ManagedProvider.name>-provider-kubeconfig` | Name of the Secret to store the copied kubeconfig in the runtime cluster. |
| `providerKubeconfigSecret.key` | No | `kubeconfig` | Key in the Secret's data map. |
| `runtimeKubeconfigSecretName` | No | Hosting cluster | Name of the Secret containing the kubeconfig for the target runtime cluster. |
| `providerHostOverride` | No | Operator-configured front-proxy URL | Overrides the kcp front-proxy host in the generated kubeconfig. |
| `cleanupOnDelete` | No | `false` | When `true`, also deletes the `Provider` on the kcp side when this resource is deleted, cascading to workspace deletion. |

### Status fields

| Field | Description |
| --- | --- |
| `phase` | Current lifecycle phase. See [Lifecycle](#lifecycle). |
| `providerKubeconfigSecretRef` | Reference to the Secret in the runtime cluster containing the copied kubeconfig. |
| `conditions` | Standard Kubernetes conditions, including `Ready`. |

## Who creates it

Platform admins create `ManagedProvider` resources to onboard platform-owned services.

::: tip
For service providers managing their own onboarding, see [`Provider`](./provider-resource.md).
:::

## Who reconciles it

The **ManagedProvider controller**, part of the [Platform Mesh operator](/reference/components/platform-mesh-operator.md), orchestrates the full provider lifecycle — from platform readiness checks through `Provider` creation, kubeconfig distribution, and operator deployment.

## What happens when you apply one

1. Finalizers are added for ordered cleanup.
2. The controller waits for the referenced `PlatformMesh` to be ready.
3. It creates (or adopts) a `Provider` at the target kcp path, defaulting to `root:providers:system`.
4. Once the `Provider` is ready, it copies the resulting kubeconfig into a Secret on the runtime cluster.
5. It deploys each component listed in `runtimeDeployments` via OCM and FluxCD.

By default, deleting a `ManagedProvider` removes the runtime deployments and the copied kubeconfig but leaves the kcp `Provider` and its workspace intact. Set `cleanupOnDelete: true` to also remove the `Provider` and cascade to the workspace.

## Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> WaitingForPlatformMesh
    WaitingForPlatformMesh --> WaitingForProvider
    WaitingForProvider --> CopyingKubeconfig
    CopyingKubeconfig --> CopyingKubeconfigFailed : spec mismatch
    CopyingKubeconfigFailed --> CopyingKubeconfig
    CopyingKubeconfig --> Deploying
    Deploying --> Ready
    Ready --> Deploying : spec change
    Ready --> Deleting
    CopyingKubeconfigFailed --> Deleting
    Deleting --> [*]
```

## Related

- [Provider bootstrap](/concepts/provider-bootstrap.md)
- [Provider resource](./provider-resource.md)
- [Platform Mesh operator](/reference/components/platform-mesh-operator.md)
- [Platform owner persona](/concepts/personas/platform-owner.md)
