# Integration Paths

There are two ways to bring a service into the Platform Mesh today. The right choice depends on what you have and how much control you need. Both paths result in the same consumer experience: declarative APIs available through [APIExport/APIBinding](/overview/api-export-binding).

## Comparison

| Path | Tool | What You Build | Sync Handled By | Best For |
|------|------|----------------|-----------------|----------|
| 1 | [api-syncagent](/overview/api-syncagent) | Operator + deploy the sync agent | The agent (automatic) | Standard CRD-based services |
| 2 | [multi-cluster-runtime](/overview/multi-cluster-runtime) | Operator using mcr libraries | Your operator (built-in) | Non-CRD APIs, complex sync logic |

::: info Important
Both paths require a Kubernetes operator that reconciles your service's resources. The paths differ in how synchronization between kcp and the service cluster is handled, not in whether you need an operator.
:::

## Path 1: api-syncagent

The [api-syncagent](/overview/api-syncagent) is the primary integration mechanism and the right choice for most providers. If you already have a Kubernetes operator with CRDs, the api-syncagent publishes those CRDs as [APIExports](/overview/api-export-binding) in kcp. It handles bidirectional sync (spec flows down from kcp, status flows back up), related resource synchronization, and schema evolution automatically.

You deploy the agent alongside your operator on the service cluster and create `PublishedResource` objects that declare which CRDs to expose. No custom controller code is needed for the sync layer -- the agent handles that entirely.

## Path 2: multi-cluster-runtime

[multi-cluster-runtime](/overview/multi-cluster-runtime) gives the provider full control by building sync logic directly into the operator. It is a Go library extending `controller-runtime`, so the added effort over writing a standard Kubernetes operator is minimal -- you use `mcr` packages instead of standard `controller-runtime` packages.

Use it when your service exposes non-CRD APIs (aggregated or custom API servers), when you need custom transformation logic during sync, or when the controller must coordinate state across multiple clusters. There is no separate sync agent to deploy and maintain -- your operator handles everything.

## Path 3: kube-bind <Badge type="warning" text="WIP" />

[kube-bind](https://github.com/kube-bind/kube-bind) will serve a dual role in Platform Mesh. First, it enables vanilla Kubernetes clusters to connect to the mesh as service providers, publishing their APIs Platform Mesh. Second, it allows consumers to extend their Platform Mesh control plane to their own workload clusters -- resources from the consumer's account appear on the workload cluster as if they were originally created there, enabling a fully local development and deployment experience. The [Scenarios](/scenarios/details) page illustrates how kube-bind fits into provider-to-consumer and provider-to-provider topologies. This integration path is currently under development.

## What's Next

- [api-syncagent](/overview/api-syncagent) -- deep dive into the CRD-based sync agent
- [multi-cluster-runtime](/overview/multi-cluster-runtime) -- architecture and patterns for custom syncers
- [APIExport & APIBinding](/overview/api-export-binding) -- the cross-workspace sharing mechanism all paths build on
- [Provider Quick Start](/guides/provider-quick-start) -- step-by-step guide to deploying your first service provider
