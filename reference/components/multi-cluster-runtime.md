# multi-cluster-runtime

## Purpose

multi-cluster-runtime is a Go library for building controllers that reconcile across multiple Kubernetes-like clusters.

## Runtime role

It is the advanced integration option for providers that need custom sync logic or non-CRD API integration.

## Repository

- [kubernetes-sigs/multicluster-runtime](https://github.com/kubernetes-sigs/multicluster-runtime)
- kcp providers: [kcp-dev/multicluster-provider](https://github.com/kcp-dev/multicluster-provider)

## Related epic

- [platform-mesh/backlog#201](https://github.com/platform-mesh/backlog/issues/201)

## Future component reference

Add provider selection, Platform Mesh syncer patterns, APIExport virtual workspace usage, and sample controller structure.

## Related

- [multi-cluster-runtime concept](/concepts/integration/multi-cluster-runtime.md)
- [APIExport and APIBinding](/reference/concepts/api-export-binding.md)
