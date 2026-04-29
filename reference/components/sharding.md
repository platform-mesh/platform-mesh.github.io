# kcp sharding in Platform Mesh

## Purpose

Sharding is a kcp configuration mode that distributes workspaces across multiple shards for horizontal scale. Platform Mesh supports sharded local setups and sharded production deployments.

## Runtime role

A sharded Platform Mesh deployment runs multiple kcp shards behind the front proxy. Workspace state is partitioned across shards while the API surface remains a single endpoint to clients. The Platform Mesh operator and account-operator are aware of the sharded topology and reconcile state across shards.

## Related epic task

- [platform-mesh/backlog#249](https://github.com/platform-mesh/backlog/issues/249)

## Future reference

Add the local-setup sharded topology, shard membership and discovery, cross-shard workspace addressing, operational guidance for adding or removing shards, and any Platform Mesh-specific behavior that differs from upstream kcp sharding.

## Related

- [kcp](./kcp.md)
- [Architecture](/concepts/architecture.md)
- [Set up Platform Mesh locally](/how-to-guides/set-up-platform-mesh-locally.md)
