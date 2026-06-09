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
- The service operator published as an OCM component in an accessible registry

## Step 1: Create the ManagedProvider resource

Apply a `ManagedProvider` in the same namespace as the `PlatformMesh` instance. Set `platformMeshRef.name` to the name of your `PlatformMesh` resource and list each operator component under `runtimeDeployments`:

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
      registry: ghcr.io/my-org/ocm
      version: "1.0.0"
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

Once `Ready`, the controller writes a kubeconfig Secret into the runtime cluster. Verify it exists:

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
| Stuck at `WaitingForProvider` | The `Provider` has not yet reached `Ready` — check the Provider controller logs for workspace or kubeconfig provisioning errors |
| Stuck at `CopyingKubeconfig` | The Provider workspace is ready but the kubeconfig copy failed — check the ManagedProvider controller logs for Secret write errors |
| Stuck at `Deploying` | The OCM component version does not exist in the registry, or FluxCD is not reconciling — check HelmRelease status in the namespace |
| `Ready` but pods not running | The operator chart values may be misconfigured — check the HelmRelease events and operator pod logs |

## Related

- [ManagedProvider resource](/reference/resources/managed-provider-resource.md)
- [Provider bootstrap](/concepts/provider-bootstrap.md)
- [Platform Mesh operator reference](/reference/components/platform-mesh-operator.md)
