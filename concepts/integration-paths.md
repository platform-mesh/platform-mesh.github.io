# Integration paths

Service providers integrate with Platform Mesh by exposing declarative APIs and reconciling consumer requests into real services.

## Choose a path

Use **api-syncagent** when the provider already exposes Kubernetes CRDs and can use the standard spec-down/status-up sync pattern.

Use **multi-cluster-runtime** when the provider needs custom sync logic, non-CRD APIs, or reconciliation that is built directly into a provider controller.

Use **kube-bind** when APIs need to be projected into regular Kubernetes clusters as part of a provider-consumer flow.

## Comparison

| Path | Best fit | Provider effort |
| --- | --- | --- |
| api-syncagent | Existing CRD-based service APIs | Configure and run the sync agent |
| multi-cluster-runtime | Custom provider controllers and non-standard sync | Build sync logic in Go |
| kube-bind | Binding APIs into Kubernetes clusters | Use kube-bind provider and consumer flows |

## Related

- [api-syncagent](./integration/api-syncagent.md)
- [multi-cluster-runtime](./integration/multi-cluster-runtime.md)
- [Provider to consumer](./interaction-patterns/provider-to-consumer.md)
- [Provider to provider](./interaction-patterns/provider-to-provider.md)
- [api-syncagent upstream docs](https://docs.kcp.io/api-syncagent/v0.5/)
