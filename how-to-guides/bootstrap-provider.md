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

## Step 5: Register your provider in the Marketplace

For your provider to appear in the Platform Mesh Marketplace, apply three resources to the provider workspace, all linked by the same `ui.platform-mesh.io/content-for` label set to the `ProviderMetadata` name:

| Resource | API group | Purpose |
| --- | --- | --- |
| `ProviderMetadata` | `ui.platform-mesh.io/v1alpha1` | Marketplace card — name, description, icon, contacts, documentation, support links. |
| `APIExport` | `apis.kcp.io/v1alpha1` | Publishes the provider's API group. The Marketplace skips exports whose `status.identityHash` is empty (not yet established by kcp). UI-only providers that expose no CRD can omit `spec.latestResourceSchemas`; the export is still considered established once kcp sets the identity hash. |
| `ContentConfiguration` | `ui.platform-mesh.io/v1alpha1` | Portal navigation fragment (sidebar nodes, micro-frontend URL). |

All three resources must carry the same label:

```yaml
labels:
  ui.platform-mesh.io/content-for: <provider-name>
```

where `<provider-name>` matches `metadata.name` of the `ProviderMetadata`.

A minimal example for a UI-only provider:

```yaml
# providermetadata.yaml
apiVersion: ui.platform-mesh.io/v1alpha1
kind: ProviderMetadata
metadata:
  name: my-service
  labels:
    ui.platform-mesh.io/content-for: my-service
spec:
  displayName: My Service
  description: Short description shown in the Marketplace card.
  tags: [example]
  contacts:
    - displayName: My Team
      email: my-team@example.com
      role: [Owner]
  documentation:
    - displayName: Documentation
      url: https://docs.example.com
  icon:
    light:
      url: https://example.com/icon-light.svg
    dark:
      url: https://example.com/icon-dark.svg
```

```yaml
# apiexport.yaml  (UI-only: no latestResourceSchemas needed)
apiVersion: apis.kcp.io/v1alpha1
kind: APIExport
metadata:
  name: my-service.example.com
  labels:
    ui.platform-mesh.io/content-for: my-service
spec: {}
```

```yaml
# contentconfiguration.yaml
apiVersion: ui.platform-mesh.io/v1alpha1
kind: ContentConfiguration
metadata:
  name: my-service-ui
  labels:
    ui.platform-mesh.io/content-for: my-service
    ui.platform-mesh.io/entity: core_platform-mesh_io_account
spec:
  remoteConfiguration:
    url: https://example.com/portal-config.json
    contentType: json
```

Apply them using the provider kubeconfig:

```bash
export PROVIDER_KUBECONFIG=provider-kubeconfig.yaml
kubectl --kubeconfig $PROVIDER_KUBECONFIG apply -f apiexport.yaml
kubectl --kubeconfig $PROVIDER_KUBECONFIG apply -f providermetadata.yaml
kubectl --kubeconfig $PROVIDER_KUBECONFIG apply -f contentconfiguration.yaml
```

## Step 6: Grant bind permission

The Marketplace install flow creates an `APIBinding` in the consumer workspace by calling `bind` on the provider's `APIExport`. Without an explicit grant, the call fails with "no permission to bind to export". Apply a `ClusterRole` and `ClusterRoleBinding` to the provider workspace to allow it:

```yaml
# rbac-bind.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: my-service-bind
rules:
  - apiGroups: ["apis.kcp.io"]
    resources: ["apiexports"]
    resourceNames: ["my-service.example.com"]
    verbs: ["bind"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: my-service-bind
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: my-service-bind
subjects:
  - apiGroup: rbac.authorization.k8s.io
    kind: Group
    name: system:authenticated
```

```bash
kubectl --kubeconfig $PROVIDER_KUBECONFIG apply -f rbac-bind.yaml
```

After both steps, open the Marketplace in a consumer workspace — the provider card appears and the **Enable** button works.

## Step 7: Wire the kubeconfig into your service controllers

Configure your service controllers to use the provider kubeconfig to watch the `APIExport` virtual workspace and reconcile service consumers. See [Integration paths](/concepts/integration-paths.md) to choose the right mechanism and find the corresponding tutorial.

## Related

- [Provider resource](/reference/resources/provider-resource.md)
- [Provider bootstrap](/concepts/provider-bootstrap.md)
- [Integration paths](/concepts/integration-paths.md)
- [Service provider persona](/concepts/personas/service-provider.md)
- [Metadata catalog](/reference/resources/metadata-catalog.md) — `ui.platform-mesh.io/content-for` label reference
- [ContentConfiguration](/reference/resources/content-configuration.md)
