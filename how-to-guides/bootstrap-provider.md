---
title: Bootstrap a provider
personas: [service-provider]
---

# Bootstrap a provider

Use this how-to to provision a dedicated kcp workspace for your service by creating a `Provider` resource. The workspace is your provider's domain on the platform — once it is ready, you use the issued kubeconfig to bootstrap your service APIs, register your provider in the marketplace, and wire your controllers into the workspace.

## When to use this

Use this guide when your team operates a service independently and manages its own provider workspace. If the platform team owns the service end-to-end, use [Onboard a managed service](./onboard-managed-service.md) instead.

## Prerequisites

- `kubectl` access to a kcp workspace that has an `APIBinding` to the `providers.platform-mesh.io` export from `root:platform-mesh-system`

::: warning
The workflow for obtaining this binding — the provider onboarding path — is not yet documented. For now, a platform owner must create the binding manually in the target workspace. This guide will be updated when the onboarding workflow is defined.
:::

## Step 1: Create the Provider resource

Apply a `Provider` in the workspace where you have the `providers.platform-mesh.io` binding. All spec fields are optional — a minimal resource has an empty spec:

```yaml
apiVersion: providers.platform-mesh.io/v1alpha1
kind: Provider
metadata:
  name: my-service
spec: {}
```

```bash
kubectl apply -f provider.yaml
```

## Step 2: Wait for the workspace to be ready

The Provider controller provisions a workspace and kubeconfig. Watch the phase:

```bash
kubectl get provider my-service -w
```

Expected output once provisioning completes:

```
NAME         PHASE   READY
my-service   Ready   True
```

## Step 3: Retrieve the kubeconfig

The controller writes a kubeconfig Secret into the workspace where the `Provider` lives. Retrieve it:

```bash
kubectl get secret my-service-provider-kubeconfig -n default -o jsonpath='{.data.kubeconfig}' | base64 -d > provider-kubeconfig.yaml
```

Use this kubeconfig to authenticate against the provider workspace in kcp.

## Step 4: Bootstrap workspace resources

Use the kubeconfig to seed the provider workspace with the resources your service needs to run and expose itself — for example, `APIExport`, `APIResourceSchema`, `ContentConfiguration`, `ProviderMetadata`, and RBAC. The kubeconfig can be passed to any mechanism that applies Kubernetes resources: an init container in the operator deployment, a dedicated setup controller, a GitOps pipeline, or similar.

Applying resources manually is possible but not the intended long-term approach:

```bash
export PROVIDER_KUBECONFIG=provider-kubeconfig.yaml
kubectl --kubeconfig $PROVIDER_KUBECONFIG apply -f <your-workspace-resources>
```

## Step 5: Wire the kubeconfig into your service controllers

Configure your service controllers to use the provider kubeconfig to watch the `APIExport` virtual workspace and reconcile service consumers. See [Integration paths](/concepts/integration-paths.md) to choose the right mechanism and find the corresponding tutorial.

## Related

- [Provider resource](/reference/resources/provider-resource.md)
- [Provider bootstrap](/concepts/provider-bootstrap.md)
- [Integration paths](/concepts/integration-paths.md)
- [Service provider persona](/concepts/personas/service-provider.md)
