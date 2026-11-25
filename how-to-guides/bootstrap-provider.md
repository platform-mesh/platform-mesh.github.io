---
title: Bootstrap a provider
personas: [service-provider]
---

# Bootstrap a provider

A `Provider` object gives your service its own kcp workspace, the provider workspace. There you publish your API, and your controllers use it to serve everybody who binds the API.

If the platform team runs the service for you, read [Onboard a managed service](./onboard-managed-service.md) instead.

## What you need

- A Platform Mesh user and an account in an organization, where you can create objects. The commands below use a kubeconfig for this account workspace.
- `kubectl`.
- The right to bind the `providers.platform-mesh.io` API in your account. A platform admin gives it to you in step 1.

## Step 1: The admin allows you to become a provider

This step is for the platform admin. Apply this in the workspace `root:orgs`:

```yaml
apiVersion: openfga.platform-mesh.io/v1alpha1
kind: APIExportPolicy
metadata:
  name: providers.platform-mesh.io
spec:
  apiExportRef:
    name: providers.platform-mesh.io
    clusterPath: root:platform-mesh-system
  allowPathExpressions:
  - :root:orgs:acme:*
```

`:root:orgs:acme:*` allows all accounts of the organization `acme`. To allow only one account, use its path, for example `:root:orgs:acme:team-a`. This is the same object as for the Marketplace in step 7, only for the providers API.

The policy works per account, not per user. Every user who can create an `APIBinding` in an allowed account can become a provider.

::: info
The bind check needs the account of the request. kcp knows it for users who log in through the login of the organization, and for ServiceAccounts of the account. A user of a global login, which is not bound to a workspace, cannot bind with the policy.
:::

## Step 2: Bind the providers API

In your account workspace:

```yaml
apiVersion: apis.kcp.io/v1alpha2
kind: APIBinding
metadata:
  name: providers.platform-mesh.io
spec:
  reference:
    export:
      path: root:platform-mesh-system
      name: providers.platform-mesh.io
  permissionClaims:
  - {resource: namespaces, verbs: ["*"], selector: {matchAll: true}, state: Accepted}
  - {resource: serviceaccounts, verbs: ["*"], selector: {matchAll: true}, state: Accepted}
  - {resource: secrets, verbs: ["*"], selector: {matchAll: true}, state: Accepted}
  - {group: rbac.authorization.k8s.io, resource: roles, verbs: ["*"], selector: {matchAll: true}, state: Accepted}
  - {group: rbac.authorization.k8s.io, resource: rolebindings, verbs: ["*"], selector: {matchAll: true}, state: Accepted}
```

```bash
kubectl apply -f apibinding.yaml
kubectl wait apibinding providers.platform-mesh.io --for=jsonpath='{.status.phase}'=Bound
```

Accept all claims. The Provider controller writes the kubeconfig of your provider workspace into your workspace with them. Without them the `Provider` stays in the phase `ProvisioningKubeconfig`.

## Step 3: Create the Provider

```yaml
apiVersion: providers.platform-mesh.io/v1alpha1
kind: Provider
metadata:
  name: my-service
spec: {}
```

```bash
kubectl apply -f provider.yaml
kubectl wait provider my-service --for=jsonpath='{.status.phase}'=Ready --timeout=5m
```

The controller creates the workspace `root:providers:my-service-<cluster>`, where `<cluster>` is the logical cluster of your workspace. In it, a service account gets full access, and its kubeconfig goes to the Secret `default/my-service-provider-kubeconfig` in your workspace.

If your controllers run outside of the Platform Mesh cluster, set `spec.hostOverride` to the URL of kcp they can reach, for example `https://kcp.api.example.com:8443`.

## Step 4: Get the kubeconfig

```bash
kubectl get secret my-service-provider-kubeconfig -n default \
  -o jsonpath='{.data.kubeconfig}' | base64 -d > provider.kubeconfig
```

The token in this kubeconfig is valid for one hour. The controller renews it before it expires and writes it to the same Secret, under the key `kubeconfig` and also under the key `token`. The kubeconfig reads the file `token` next to itself first. So:

- In a pod, mount the whole Secret as a volume. The pod then uses every new token without a restart.
- A kubeconfig that you copy out once stops working after one hour. Read the Secret again when you need it.

The last part of the server URL, after `/clusters/`, is the logical cluster of the provider workspace. The next steps call it `<provider cluster>`.

## Step 5: Publish your API

Apply your manifests into the provider workspace:

```bash
kubectl --kubeconfig provider.kubeconfig apply -f <your manifests>
```

You need:

- `APIResourceSchema` and `APIExport` for your API. You can generate them from a CRD with `apigen`.
- `ProviderMetadata` for the Marketplace. Its name must be the name of the APIExport.
- `ContentConfiguration` for the portal, with the label `ui.platform-mesh.io/content-for: <APIExport name>`. It can use the generic list and detail views of the portal, so you need no own UI.

## Step 6: Run your controllers

Your controllers watch the `APIExportEndpointSlice` with the name of your APIExport in the provider workspace. Through it they get all workspaces that bind your API. See [Integration paths](/concepts/integration-paths.md) for the ways to build them.

## Step 7: List the provider in the Marketplace

This step is for the platform admin. Apply this in the workspace `root:orgs`:

```yaml
apiVersion: openfga.platform-mesh.io/v1alpha1
kind: APIExportPolicy
metadata:
  name: my-service.example.com
spec:
  apiExportRef:
    name: my-service.example.com
    clusterPath: <provider cluster>
  allowPathExpressions:
  - :root:orgs:*
```

The accounts of all organizations can now find the provider in the Marketplace and bind its API.

## Related

- [Provider resource](/reference/resources/provider-resource.md)
- [Provider bootstrap](/concepts/provider-bootstrap.md)
- [Integration paths](/concepts/integration-paths.md)
- [Service provider persona](/concepts/personas/service-provider.md)
