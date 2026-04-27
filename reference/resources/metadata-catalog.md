# Metadata catalog

Platform Mesh uses a small set of API groups, labels, finalizers, and annotations to identify the objects it manages and to wire them into the rest of the stack. This page is the canonical reference for that metadata so that when you see a label like `core.platform-mesh.io/org` or a finalizer like `account.core.platform-mesh.io/finalizer` in a YAML file, you know what owns it and what to expect.

::: tip Where Platform Mesh metadata appears
"Platform Mesh metadata" is a loose phrase. Several mechanisms are in use:

- **API groups** identify the CRDs Platform Mesh defines.
- **Labels** wire Platform Mesh resources into the portal, the marketplace, and identity scoping.
- **Finalizers** ensure the right cleanup order when objects are deleted.
- True **annotations** are used sparingly; most Platform Mesh-specific information lives in dedicated CRD fields rather than annotations on existing kcp or Kubernetes objects.
:::

## API groups

| Group | Owner | Resources |
| --- | --- | --- |
| `core.platform-mesh.io/v1alpha1` | account-operator, IAM service | `Account`, `AccountExtension`, `Store` |
| `ui.platform-mesh.io/v1alpha1` | extension manager operator | `ContentConfiguration`, `ExtensionClass` (portal extensions) |

API resources outside these groups are upstream kcp (`apis.kcp.io`, `tenancy.kcp.io`), upstream Kubernetes, or provider-specific.

## Labels

Platform Mesh attaches labels to its own resources and, in some cases, to upstream resources it manages.

| Label | Used on | Purpose |
| --- | --- | --- |
| `core.platform-mesh.io/org` | WorkspaceTypes managed by the account-operator | Scopes a workspace type to a specific organization so child accounts inherit the right RBAC. |
| `ui.platform-mesh.io/entity` | ContentConfiguration | Attaches the configuration to a portal navigation entity (for example, `core_platform-mesh_io_account` to extend Account pages). |
| `extensions.openmfp.io` | ContentConfiguration (legacy) | Maps to an `ExtensionClass` in older deployments. New deployments prefer `ui.platform-mesh.io/entity`. |

Provider authors generally do **not** need to set Platform Mesh labels on APIExports or APIBindings — onboarding scripts and operators handle that.

## Finalizers

Finalizers ensure that Platform Mesh resources are torn down in the right order — for example, an Account's IAM Store must be cleaned up before the workspace itself is deleted, otherwise stranded permissions remain in OpenFGA.

| Finalizer | Set by | Purpose |
| --- | --- | --- |
| `account.core.platform-mesh.io/finalizer` | account-operator | Holds the Account until its workspace is deleted. |
| `account.core.platform-mesh.io/info` | account-operator | Holds the Account until its account-info status fields are reconciled to children. |
| `workspacetype.core.platform-mesh.io/finalizer` | account-operator (workspacetype subroutine) | Holds the WorkspaceType created for an org until all child workspaces are gone. |
| `platform-mesh.core.platform-mesh.io/finalizer` | platform-mesh-operator | Coordinates teardown of platform-level provider secrets and kcp setup state. |

You should not normally remove these finalizers by hand. If a resource is stuck on a finalizer, check the operator logs to see which subroutine is blocked rather than force-deleting.

## Annotations

Pure annotations on Platform Mesh-managed objects are sparse. The codebase uses Kubebuilder-generated annotations (`controller-gen.kubebuilder.io/version`) on CRDs and standard Kubernetes annotations (for example, `service.binding/*` from the [Service Binding spec](https://servicebinding.io/) on operator-managed objects), but Platform Mesh does not impose a custom annotation scheme on top of them today.

Annotations specifically owned by Platform Mesh use the `core.platform-mesh.io/*` prefix. If you encounter a Platform Mesh annotation in a real cluster that is not documented here, it is likely operator-internal state that is safe to ignore from a user perspective.

## Documentation status

This catalog is updated as Platform Mesh component owners contribute the supported keys, values, and ownership rules. Each future entry should include:

- full key
- value format
- writing component
- reading component
- whether users may set it
- lifecycle and compatibility guarantees

## Related

- [Account resource](./account-resource.md) — uses the `core.platform-mesh.io` API group and its finalizers
- [ContentConfiguration](./content-configuration.md) — uses the `ui.platform-mesh.io` API group and the `ui.platform-mesh.io/entity` label
- [Account model](/concepts/account-model.md)
- [Component reference](/reference/components/)
