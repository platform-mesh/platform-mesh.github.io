---
title: Onboard a managed service
personas: [platform-owner]
---

# Onboard a managed service

Use this how-to to onboard a platform-owned service into Platform Mesh using a `ManagedProvider`. The resource handles the full lifecycle: provisioning a kcp workspace for the provider, distributing the resulting kubeconfig, and deploying the service operator on the runtime cluster.

## When to use this

Use `ManagedProvider` when the platform team owns and operates the service. For services operated by *external teams* who manage their own provider onboarding, use a `Provider` directly instead.

## Prerequisites

- A running Platform Mesh environment with a `PlatformMesh` resource in the `Ready` state
- `kubectl` access to the Platform Mesh runtime cluster
- The service operator published as a Helm chart in an accessible OCI registry or Helm repository — or, if you deploy via OCM, published as an OCM component (this additionally requires the ocm-controller in the runtime cluster)

## Step 1: Create the ManagedProvider resource

Apply a `ManagedProvider` in the same namespace as the `PlatformMesh` instance. Set `platformMeshRef.name` to the name of your `PlatformMesh` resource and list each operator component under `runtimeDeployments`. Each entry sets exactly one of `flux` (Helm chart fetched directly from an OCI registry or Helm repository) or `ocm` (chart resolved from an OCM component descriptor):

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
  - flux:
      registry: ghcr.io/my-org/charts
      chart: my-service-operator
      version: "1.0.0"
```

To deploy from an OCM component instead, replace the `flux` entry with:

```yaml
  runtimeDeployments:
  - ocm:
      registry: ghcr.io/my-org
      component: github.com/my-org/my-service
      version: "1.0.0"
      resourceName: chart
```

```bash
kubectl apply -f managed-provider.yaml
```

## Step 2: Watch the phase progress

The controller moves through several phases as it provisions the workspace and deploys the operator:

```bash
kubectl get managedprovider my-service -n platform-mesh-system -w
```

Expected progression:

```
NAME         PHASE                    READY
my-service   Pending                  False
my-service   WaitingForPlatformMesh   False
my-service   WaitingForProvider       False
my-service   CopyingKubeconfig        False
my-service   Deploying                False
my-service   Ready                    True
```

If the phase stalls, check the `conditions` field on the resource:

```bash
kubectl describe managedprovider my-service -n platform-mesh-system
```

And the controller logs:

```bash
kubectl logs -n platform-mesh-system -l app=platform-mesh-operator --tail=50
```

## Step 3: Verify the kubeconfig Secret

The controller writes the kubeconfig Secret during the `CopyingKubeconfig` phase. Once the resource is `Ready`, verify it exists:

```bash
kubectl get secret my-service-provider-kubeconfig -n platform-mesh-system
```

Service operator components reference this Secret to reach the provider workspace in kcp.

## Step 4: Verify the operator deployment

Confirm the operator components are running:

```bash
kubectl get pods -n platform-mesh-system -l app.kubernetes.io/name=my-service-operator
```

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Stuck at `WaitingForPlatformMesh` | The referenced `PlatformMesh` resource is not yet `Ready` — check the platform-mesh-operator logs and the `PlatformMesh` conditions |
| Stuck at `WaitingForProvider` | The associated `Provider` has not yet reached `Ready` — check the Provider controller logs for workspace or kubeconfig provisioning errors |
| Stuck at `CopyingKubeconfig` | The Provider controller has not yet populated the kubeconfig Secret — check the Provider controller logs |
| Stuck at `CopyingKubeconfigFailed` | The `providerKubeconfigSecret` spec on the `Provider` does not match what the `ManagedProvider` expects — ensure the `providerKubeconfigSecret` fields are aligned between both resources |
| Stuck at `Deploying` | The chart or OCM component version does not exist in the registry, FluxCD is not reconciling, or (for `ocm` entries) the ocm-controller is not installed — check HelmRelease and OCM resource status in the namespace |
| `Ready` but pods not running | The operator chart values may be misconfigured — check the HelmRelease events and operator pod logs |

## Related

- [ManagedProvider resource](/reference/resources/managed-provider-resource.md)
- [Provider bootstrap](/concepts/provider-bootstrap.md)
- [Platform Mesh operator reference](/reference/components/platform-mesh-operator.md)
