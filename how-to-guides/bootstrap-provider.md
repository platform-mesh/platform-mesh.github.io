---
title: Bootstrap a provider
personas: [service-provider]
---

# Bootstrap a provider

Use this how-to to bootstrap your service into a Platform Mesh instance. By following the steps here you'll obtain a dedicated kcp workspace where you may bootstrap your service's APIs, register it in the marketplace, and wire your controllers into that workspace using a dedicated kubeconfig.

## When to use this

Use this guide when your team operates a service independently.

If the platform team owns the service end-to-end, use [Onboard a managed service](./onboard-managed-service.md) instead.

## Prerequisites

- You have the Provider APIs avialable in your workspace, i.e. an `APIBinding` to the `providers.platform-mesh.io` export from `root:platform-mesh-system` is present in your workspace.

::: warning
For now, a platform owner must create the `providers.platform-mesh.io` binding manually in your workspace.
:::

## Step 1: Create the Provider resource

Apply a `Provider` in your workspace. All spec fields are optional — a minimal resource has an empty spec:

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

Platform Mesh provisions a dedicated "provider" workspace and kubeconfig that points to it. Watch the phase:

```bash
kubectl get provider my-service -w
```

Expected output once provisioning completes:

```
NAME         PHASE   READY
my-service   Ready   True
```

## Step 3: Retrieve the kubeconfig

Platform Mesh writes Secret with that kubeconfig into your workspace where the `Provider` object lives. Retrieve it:

```bash
kubectl get secret my-service-provider-kubeconfig -n default -o jsonpath='{.data.kubeconfig}' | base64 -d > provider-kubeconfig.yaml
```

Use this kubeconfig to authenticate against the provider workspace in kcp.

## Step 4: Bootstrap workspace resources

Use the kubeconfig to seed the provider workspace with the resources your service needs to run and expose itself — for example, `APIExport`, `APIResourceSchema`, `ContentConfiguration`, `ProviderMetadata`, and RBAC. The kubeconfig can be passed to any mechanism that applies Kubernetes resources: an init container in the operator deployment, a dedicated setup controller, a GitOps pipeline, or similar.

Example:

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
