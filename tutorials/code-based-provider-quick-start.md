# Code-based provider quick start

This quickstart is for cases where your provider ships its own controller (operator), CRDs, and optionally a custom UI microfrontend. It is the companion to the [No-code provider quick start](./provider-quick-start.md), which uses api-syncagent to expose an existing CRD with no provider-specific code.

The reference implementation is the **Wild West provider**, which exposes a `Cowboys` API under the `wildwest.platform-mesh.io` group. The full walkthrough lives next to the code, in the [provider-quickstart](https://github.com/platform-mesh/provider-quickstart) repository — we keep it there rather than duplicating it here so the steps stay in sync with the code, charts, and `make` targets you actually run.

::: tip Requires a local clone
Unlike the no-code quickstart, this one builds and runs code from the `provider-quickstart` repo. Clone it first — every step in the upstream guide is executed from inside that directory:

```bash
git clone https://github.com/platform-mesh/provider-quickstart.git
cd provider-quickstart
```
:::

## Follow the walkthrough

Run through the upstream guide end-to-end:

**→ [provider-quickstart: Usage](https://github.com/platform-mesh/provider-quickstart#usage)**

It covers:

1. Setting the admin and compute kubeconfigs.
2. Creating the provider workspace hierarchy (`root:providers:quickstart`).
3. Bootstrapping provider resources (`make init`) — applies the `APIExport`, `APIResourceSchema`, `ProviderMetadata`, `ContentConfiguration`, and RBAC.
4. Building and loading container images into the local kind cluster.
5. Deploying the `wild-west` controller, `armament-sync` syncer, and portal microfrontend.
6. Trying it out — creating `Cowboy` resources with secret refs and using the `Armament` catalog (a kcp `CachedResource`) from a consumer workspace.
7. Debugging via the `marketplace` and `contentconfigurations` virtual workspaces.

## Prerequisites

- A local Platform Mesh setup from [Set up Platform Mesh locally](/how-to-guides/set-up-platform-mesh-locally.md).
- A local clone of [provider-quickstart](https://github.com/platform-mesh/provider-quickstart) (see the tip above).
- `kubectl` with the `kubectl-kcp` plugin, Helm 3, Go, and `make`.

::: warning Admin kubeconfig required
Providers live in a dedicated workspace tree, so you need the **admin kubeconfig** to create the provider workspace and bootstrap resources. Regular user kubeconfigs will not have the required permissions today.
:::

## How it relates to Platform Mesh concepts

The four building blocks the upstream walkthrough exercises are documented here:

| Building block | Reference |
| --- | --- |
| `APIExport` / `APIResourceSchema` | [API sharing](/concepts/api-sharing.md) |
| `ProviderMetadata` (Marketplace registration) | [Marketplace](/reference/components/marketplace.md) |
| `ContentConfiguration` (portal UI) | [ContentConfiguration](/reference/resources/content-configuration.md) |
| `CachedResource` (read-only catalogs to consumers) | [Virtual workspaces](/reference/components/kcp/virtual-workspaces.md) |

## Next

- Use the `provider-quickstart` repo as a template — fork it, replace `wildwest.platform-mesh.io` with your API group, define your CRD schema, and update `ProviderMetadata` and `ContentConfiguration`.
- Continue with [Consume a service from a controller](./consume-service-from-controller.md) to write the consumer side.
