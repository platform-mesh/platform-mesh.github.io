---
title: Set up remote deployment
personas: [platform-owner]
---

# Set up remote deployment

Use this how-to to deploy Platform Mesh across multiple clusters, where the operator runs on one cluster but manages resources on separate runtime and infra clusters.

::: warning Alpha feature
Remote deployment is functional but limited to a single remote deployment per operator instance. APIs and Helm values may change.
:::

## Prerequisites

- A running Kubernetes cluster for the operator (the **local** cluster)
- A separate Kubernetes cluster for the runtime workloads (the **runtime** cluster) — this is where kcp, OCM, and the PlatformMesh resource live
- Optionally, a third cluster for FluxCD or ArgoCD (the **infra** cluster) — if not provided, the local cluster serves this role
- `kubectl` configured to access all clusters
- Helm 3.x installed

## Architecture overview

```
┌─────────────────────┐     ┌─────────────────────────────────┐
│   Local cluster     │     │       Runtime cluster            │
│                     │     │                                  │
│  platform-mesh-     │────▶│  PlatformMesh CR                 │
│  operator           │     │  Profile ConfigMap               │
│                     │     │  kcp (RootShard, FrontProxy)     │
│  (leader election)  │     │  OCM Resources                   │
└─────────────────────┘     └─────────────────────────────────┘
          │
          │  (if Local != Infra)
          ▼
┌─────────────────────────────────┐
│        Infra cluster            │
│                                 │
│  FluxCD / ArgoCD                │
│  HelmReleases                   │
│  OCIRepositories                │
│  HelmRepositories               │
└─────────────────────────────────┘
```

Remote deployment is considered when the **Runtime** and **Infra** clusters are different. FluxCD HelmReleases receive a `kubeConfig.secretRef` that tells FluxCD to deploy workloads to the runtime cluster. ArgoCD Applications receive a `destination.server` pointing to the runtime cluster API.

## Step 1: Create a kubeconfig secret for the runtime cluster

Generate a kubeconfig that gives the operator access to the runtime cluster. Create a Secret on the **local** cluster:

```bash
kubectl create secret generic platform-mesh-kubeconfig \
  --namespace platform-mesh-system \
  --from-file=kubeconfig=<path-to-runtime-kubeconfig>
```

## Step 2: Create a kubeconfig secret for FluxCD to reach the runtime cluster

FluxCD (running on the infra cluster) needs credentials to deploy workloads to the runtime cluster. Create a Secret on the **infra** cluster:

```bash
kubectl create secret generic platform-mesh-runtime-secret \
  --namespace platform-mesh-system \
  --from-file=kubeconfig=<path-to-runtime-kubeconfig-for-fluxcd>
```

This secret is referenced by every HelmRelease via `spec.kubeConfig.secretRef`.

## Step 3: (Optional) Create a kubeconfig secret for the infra cluster

If the operator does not run on the infra cluster (that is, **Local** != **Infra**), create a Secret on the local cluster with credentials to reach the infra cluster:

```bash
kubectl create secret generic platform-mesh-infra-kubeconfig \
  --namespace platform-mesh-system \
  --from-file=kubeconfig=<path-to-infra-kubeconfig>
```

Skip this step if the operator runs on the same cluster as FluxCD or ArgoCD.

## Step 4: Install the operator with remote deployment enabled

Install the platform-mesh-operator Helm chart with remote deployment values:

```bash
helm install platform-mesh-operator \
  oci://ghcr.io/platform-mesh/helm-charts/platform-mesh-operator \
  --namespace platform-mesh-system --create-namespace \
  --set remoteRuntime.enabled=true \
  --set remoteRuntime.secretName=platform-mesh-kubeconfig \
  --set remoteRuntime.secretKey=kubeconfig \
  --set remoteRuntime.infra.secretName=platform-mesh-runtime-secret \
  --set remoteRuntime.infra.secretKey=kubeconfig
```

If **Local** != **Infra**, also add:

```bash
  --set remoteInfra.enabled=true \
  --set remoteInfra.secretName=platform-mesh-infra-kubeconfig \
  --set remoteInfra.secretKey=kubeconfig
```

### Helm values reference

| Value | Default | Description |
|-------|---------|-------------|
| `remoteRuntime.enabled` | `false` | Enable remote runtime cluster reconciliation |
| `remoteRuntime.secretName` | `platform-mesh-secret` | Secret with kubeconfig to reach the runtime cluster |
| `remoteRuntime.secretKey` | `kubeconfig` | Key within the secret |
| `remoteRuntime.infra.secretName` | `platform-mesh-secret` | Secret for FluxCD to deploy to the runtime cluster |
| `remoteRuntime.infra.secretKey` | `kubeconfig` | Key within the infra secret |
| `remoteInfra.enabled` | `false` | Enable remote infra cluster (only if Local != Infra) |
| `remoteInfra.secretName` | `platform-mesh-kubeconfig` | Secret with kubeconfig to reach the infra cluster |
| `remoteInfra.secretKey` | `kubeconfig` | Key within the secret |

## Step 5: Create the PlatformMesh resource on the runtime cluster

The PlatformMesh CR and its profile ConfigMap must live on the **runtime** cluster. Switch your kubectl context to the runtime cluster and apply them:

```bash
kubectl config use-context <runtime-cluster-context>
```

Create the profile ConfigMap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: platform-mesh-sample-profile
  namespace: platform-mesh-system
data:
  profile.yaml: |
    infra:
      deploymentTechnology: fluxcd
      certManager:
        enabled: true
        name: cert-manager
        interval: 5m
        targetNamespace: cert-manager
        ocmResourceName: charts
        values:
          crds:
            enabled: true
    components:
      deploymentTechnology: fluxcd
      ocm:
        repo:
          name: platform-mesh
        component:
          name: platform-mesh
        referencePath:
        - name: core
      services:
        account-operator:
          enabled: true
          values:
            ingress:
              host: "account-operator.{{ .baseDomain }}"
```

Create the PlatformMesh resource:

```yaml
apiVersion: core.platform-mesh.io/v1alpha1
kind: PlatformMesh
metadata:
  name: platform-mesh-sample
  namespace: platform-mesh-system
spec:
  exposure:
    baseDomain: example.com
    port: 443
    protocol: https
  ocm:
    repo:
      name: platform-mesh
    component:
      name: platform-mesh
    referencePath:
    - name: core
  kcp:
    adminSecretRef:
      name: platform-mesh-kcp-internal-admin-kubeconfig
    providerConnections:
    - endpointSliceName: core.platform-mesh.io
      path: root:platform-mesh-system
      secret: platform-mesh-operator-kubeconfig
      adminAuth: true
```

The operator links the two resources by naming convention: a PlatformMesh instance named `platform-mesh-sample` expects a ConfigMap named `platform-mesh-sample-profile` in the same namespace. Override this with `spec.profileConfigMap` if needed.

## Step 6: Verify the deployment

Check the operator logs on the local cluster:

```bash
kubectl logs -n platform-mesh-system -l app=platform-mesh-operator --tail=50
```

Verify the PlatformMesh resource status on the runtime cluster:

```bash
kubectl get platformmesh -n platform-mesh-system -o yaml
```

Look for status conditions showing all subroutines succeeded:

```yaml
status:
  conditions:
  - type: DeploymentSubroutine
    status: "True"
  - type: Ready
    status: "True"
```

Check that HelmReleases on the infra cluster include the kubeConfig reference:

```bash
kubectl get helmreleases -n platform-mesh-system -o yaml | grep -A3 kubeConfig
```

## Troubleshooting

| Symptom | Likely cause |
|---------|-------------|
| Operator fails to start | The kubeconfig secret does not exist or has the wrong key |
| PlatformMesh not reconciled | The CR was created on the wrong cluster — it must be on the runtime cluster |
| HelmRelease stuck | The FluxCD `kubeConfig.secretRef` secret is missing on the infra cluster |
| cert-manager not ready | OCIRepository not created yet — check ResourceSubroutine logs |

## Related

- [Platform Mesh operator reference](/reference/components/platform-mesh-operator.md)
- [Set up Platform Mesh locally](./set-up-platform-mesh-locally.md)
- [Architecture](/concepts/architecture.md)
