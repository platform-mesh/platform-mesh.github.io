# Platform Mesh runtime

The components that run as part of a Platform Mesh installation. Most pages are placeholders for the Platform Mesh 0.3 documentation tasks tracked by [platform-mesh/backlog#201](https://github.com/platform-mesh/backlog/issues/201). Each page is ready for the owning component team to expand with API, deployment, configuration, and troubleshooting details.

## Control plane substrate

- [kcp](./kcp.md) — the control-plane API server Platform Mesh builds on.
- [kcp sharding](./sharding.md) — the sharded deployment topology.

## Platform Mesh operators

- [Platform Mesh operator](./platform-mesh-operator.md)
- [Account operator](./account-operator.md)
- [Security operator](./security-operator.md)

## Identity stack

- [IAM service](./iam-service.md)
- [IAM UI](./iam-ui.md)
- [Keycloak](./keycloak.md)
- [OpenFGA](./openfga.md)
- [rebac-authz-webhook](./rebac-authz-webhook.md)

## API and UI surface

- [Kubernetes GraphQL gateway](./kubernetes-graphql-gateway.md)
- [Portal](./portal.md)
- [Marketplace](./marketplace.md)

## Integration paths

Listed under [Reference > Integration paths](/reference/) — these connect external service runtimes into the mesh and are tracked separately from the Platform Mesh runtime.

- [api-syncagent](./api-syncagent.md)
- [multi-cluster-runtime](./multi-cluster-runtime.md)
