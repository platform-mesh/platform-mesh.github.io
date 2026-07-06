# Provider bootstrap

Platform Mesh provisions a dedicated kcp workspace for each service provider. Creating a `Provider` resource triggers that provisioning; the workspace becomes the provider's domain on the platform, holding their kcp resources (`APIExport`, `APIResourceSchema`) and Platform Mesh resources (`ContentConfiguration`, `ProviderMetadata`, and RBAC). When provisioning completes, Platform Mesh issues a scoped kubeconfig; the provider is then responsible for bootstrapping everything else.

`Provider` is the core primitive — any service provider can create one. `ManagedProvider` is a separate convenience layer for platform admins that builds on top of `Provider` to automate the full onboarding lifecycle for platform-owned services.

## The provider workspace

Each provider workspace lives under `root:providers` and is identified by the `Provider` name combined with the logical cluster ID of the workspace where the `Provider` object was created. The name is deterministic: two tenants can create a `Provider` with the same name without colliding, and deleting and recreating a `Provider` in the same workspace maps back to the same provider workspace.

The workspace is the provider's exclusive domain. Platform Mesh creates it and provisions the access credentials inside it — a ServiceAccount, its RBAC binding, and a token, from which the kubeconfig is generated — but manages nothing else there; the provider owns the contents.

## Provider

`Provider` is a kcp-level resource, reconciled by the Provider controller. Creating one provisions a dedicated workspace and a scoped admin kubeconfig for it. It has no effect on the runtime cluster — it operates entirely within kcp.

Once the workspace is ready, the provider is responsible for:

- Bootstrapping their workspace resources — for example, `APIExport`, `APIResourceSchema`, `ContentConfiguration`, `ProviderMetadata`, and RBAC.
- Wiring the kubeconfig into their service controllers so those controllers can manage resources in the provider workspace.

With the workspace bootstrapped, service controllers use the kubeconfig to watch their `APIExport` virtual workspace and reconcile service consumers.

## ManagedProvider

`ManagedProvider` is a Platform Mesh runtime resource, reconciled by the Platform Mesh operator. Platform admins use it as a convenience API to onboard platform-owned services: a single resource handles workspace provisioning, kubeconfig distribution, and operator deployment end-to-end.

On the kcp side, a `ManagedProvider` creates a `Provider` and waits for it to be ready — by default named after the `ManagedProvider` in `root:providers:system`, or created/adopted at an explicit path via a provider reference. On the runtime side, it copies the resulting kubeconfig into Platform Mesh's runtime cluster and deploys the service operator components, declared as Helm charts delivered either directly via Flux or resolved from an OCM component.

The split between `Provider` and `ManagedProvider` reflects the split between kcp-level and runtime-level effects: a `Provider` can only affect kcp, while a `ManagedProvider` is owned and operated by the platform admin on Platform Mesh's runtime cluster.

By default, deleting a `ManagedProvider` removes the runtime deployments and the copied kubeconfig but leaves the kcp `Provider` and its workspace intact — giving platform admins room to handle service deprecation, migration, or handoff before committing to full removal. Alternatively, platform admins can opt into full cleanup, which also removes the `Provider` and cascades to the workspace.

## Related

- [Service provider persona](./personas/service-provider.md)
- [Control planes and workspaces](./control-planes.md)
- [API sharing](./api-sharing.md)
- [Integration paths](./integration-paths.md)
- [Platform Mesh operator](/reference/components/platform-mesh-operator.md)
- [Provider resource](/reference/resources/provider-resource.md)
- [ManagedProvider resource](/reference/resources/managed-provider-resource.md)
