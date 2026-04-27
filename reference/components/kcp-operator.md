# kcp-operator

[kcp-operator](https://github.com/kcp-dev/kcp-operator) is the Kubernetes operator that deploys and manages a kcp installation. Platform Mesh ships kcp-operator as a chart in [helm-charts](https://github.com/platform-mesh/helm-charts) and uses its CRDs to provision the kcp control plane.

This page covers the operator CRs Platform Mesh applies. The operator itself is upstream; this is reference for how Platform Mesh wires it up.

## Primitives

| CRD | Platform Mesh role |
| --- | --- |
| `RootShard` | Defines the root kcp shard (image, etcd, certificates, cache). Platform Mesh ships one per environment. |
| `Shard` | Additional shards in a sharded deployment. See [kcp sharding](./sharding.md). |
| `FrontProxy` | The single TLS-terminating ingress. References a `RootShard`. |
| `CacheServer` | Cross-shard cache for replicated kcp resources. Embedded inside `RootShard` in non-sharded setups. |
| `Kubeconfig` | Generates client kubeconfigs scoped to specific paths and identities. Platform Mesh uses this for operator service accounts. |

## RootShard and FrontProxy

The minimal kcp deployment is a `RootShard` plus a `FrontProxy`. Platform Mesh's resource-broker example ships a working pair (production setups override the etcd, image tag, hostnames, and cert issuer):

```yaml
# resource-broker/examples/kcp-certs/platform/kcp.yaml
apiVersion: operator.kcp.io/v1alpha1
kind: RootShard
metadata:
  name: root
spec:
  image:
    tag: v0.30.0
  shardBaseURL: https://broker-platform-control-plane:32111
  external:
    hostname: broker-platform-control-plane
    port: 32443
  certificates:
    issuerRef:
      group: cert-manager.io
      kind: Issuer
      name: selfsigned
  cache:
    embedded:
      enabled: true
  etcd:
    endpoints: [http://kcp-etcd-client.default.svc.cluster.local:2379]
---
apiVersion: operator.kcp.io/v1alpha1
kind: FrontProxy
metadata:
  name: frontproxy
spec:
  rootShard:
    ref:
      name: root
  certificateTemplates:
    server:
      spec:
        dnsNames: [localhost]
        ipAddresses: [127.0.0.1]
```

In sharded local-setup, `embedded.cache.enabled` is replaced by a separate `CacheServer` and additional `Shard` CRs. See [kcp sharding](./sharding.md).

## Kubeconfig

Platform Mesh operators (account-operator, security-operator, api-syncagent) need scoped kubeconfigs. The operator generates them from `Kubeconfig` CRs that reference the target `RootShard` or `FrontProxy` and the workspace path the kubeconfig should default to. The generated kubeconfig is mounted into the operator pod by helm-charts.

## Repository

- Upstream: [kcp-dev/kcp-operator](https://github.com/kcp-dev/kcp-operator)
- Chart: `platform-mesh/helm-charts:charts/kcp-operator`

## Related

- [kcp](./kcp.md) — what this operator deploys
- [kcp sharding](./sharding.md) — sharded `RootShard` + `Shard` + `CacheServer` topology
