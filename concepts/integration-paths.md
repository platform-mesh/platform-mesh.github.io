# Integration paths

Service providers integrate with Platform Mesh by exposing declarative APIs and reconciling consumer requests into real services. There are two paths today and a third under development. All paths produce the same consumer experience: declarative APIs available through APIExport and APIBinding.

## Choose a path

Use **api-syncagent** when the provider already exposes Kubernetes CRDs and the standard spec-down / status-up sync pattern is enough.

Use **multicluster-runtime** when the provider needs custom sync logic, non-CRD APIs, or reconciliation built directly into a provider controller.

Both paths require a Kubernetes operator that reconciles your service's resources. The paths differ in *how* synchronization between kcp and the service cluster is handled, not in whether you need an operator.

## Comparison

| Path | Best fit | Provider effort |
| --- | --- | --- |
| api-syncagent | Existing CRD-based service APIs | Operator + deploy the sync agent; sync handled by the agent |
| multicluster-runtime | Custom controllers, non-CRD APIs, complex sync logic | Operator built with mcr libraries; sync built into the operator |

## kube-bind (work in progress)

`kube-bind` will serve a dual role in Platform Mesh:

- **Provider side** — let vanilla Kubernetes clusters connect to the mesh as service providers and publish their APIs into Platform Mesh.
- **Consumer side** — let consumers extend their Platform Mesh control plane to their own workload clusters so resources from a consumer's account appear on the workload cluster as if they were created there, enabling a fully local development and deployment experience.

This integration path is currently under development. See the [interaction patterns](./interaction-patterns/provider-to-consumer.md) for how kube-bind will fit into provider-to-consumer and provider-to-provider topologies.

## Related

- [api-syncagent](./integration/api-syncagent.md)
- [multicluster-runtime](./integration/multicluster-runtime.md)
- [API sharing](./api-sharing.md)
- [Provider to consumer](./interaction-patterns/provider-to-consumer.md)
