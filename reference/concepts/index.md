# Platform Mesh objects and kcp primitives

This section is for lookup. It summarizes the objects and primitives that Platform Mesh uses and points to upstream documentation when another project owns the full semantics.

## kcp primitives

- [Control planes and workspaces](./control-planes.md) - logical API boundaries, workspace hierarchy, and the execution model behind accounts.
- [APIExport and APIBinding](./api-export-binding.md) - the provider-consumer API sharing mechanism.

## Platform Mesh objects

- [Account model](./account-model.md) - how organizational boundaries map to control-plane boundaries.
- [Account CR](./account-cr.md) - the resource representing account lifecycle.
- [ContentConfiguration](./content-configuration.md) - portal extension and content configuration.
- [IAM store](./iam-store.md) - account and organization authorization state.
- [Platform Mesh annotations](./platform-mesh-annotations.md) - platform metadata attached to KRM objects.

For broader context and design rationale, see [Concepts](/concepts/).
