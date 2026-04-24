# Platform Mesh Metadata

Platform Mesh uses a small set of API groups, labels, and finalizers to identify the objects it manages and to wire them into the rest of the stack. This page is a reference for that metadata so that when you see a label like `core.platform-mesh.io/org` or a finalizer like `account.core.platform-mesh.io/finalizer` in a YAML file, you know what owns it and what to expect.

::: tip Annotations vs labels vs API groups
"Platform Mesh annotations" is a loose phrase. In practice, PM uses a few different mechanisms:
- **API groups** identify the CRDs PM defines (`core.platform-mesh.io`, `ui.platform-mesh.io`).
- **Labels** wire PM resources into the Portal, the marketplace, and identity scoping.
- **Finalizers** ensure the right cleanup order when objects are deleted.
- True **annotations** are used sparingly — most PM-specific information is in dedicated CRD fields rather than annotations on existing kcp/Kubernetes objects.
:::

## API Groups

| Group | Owner | Resources |
|---|---|---|
| `core.platform-mesh.io/v1alpha1` | account-operator, IAM service | `Account`, `AccountExtension`, `Store` |
| `ui.platform-mesh.io/v1alpha1` | Extension Manager Operator | `ContentConfiguration`, `ExtensionClass` (Portal extensions) |

API resources outside these groups are either upstream kcp (`apis.kcp.io`, `tenancy.kcp.io`, etc.), upstream Kubernetes, or provider-specific.

## Labels

Platform Mesh attaches labels to its own resources and, in some cases, to upstream resources it manages. Common ones:

| Label | Used on | Purpose |
|---|---|---|
| `core.platform-mesh.io/org` | WorkspaceTypes managed by the account-operator | Scopes a workspace type to a specific organization so child accounts inherit the right RBAC. |
| `ui.platform-mesh.io/entity` | ContentConfiguration | Attaches the configuration to a Portal navigation entity (e.g., `core_platform-mesh_io_account` to extend Account pages). |
| `extensions.openmfp.io` | ContentConfiguration (legacy) | Maps to an ExtensionClass in older deployments. New deployments prefer `ui.platform-mesh.io/entity`. |

When you write your own provider, you generally do **not** need to set PM labels on your APIExports or APIBindings — the platform owner's onboarding scripts and the operators handle this for you.

## Finalizers

Finalizers ensure that PM resources are torn down in the right order — for example, an Account's IAM Store must be cleaned up before the workspace itself is deleted, or stranded permissions remain in OpenFGA.

| Finalizer | Set by | Triggers |
|---|---|---|
| `account.core.platform-mesh.io/finalizer` | account-operator | Holds the Account until its workspace is deleted. |
| `account.core.platform-mesh.io/info` | account-operator | Holds the Account until its account-info status fields are reconciled to children. |
| `workspacetype.core.platform-mesh.io/finalizer` | account-operator (workspacetype subroutine) | Holds the WorkspaceType created for an org until all child workspaces are gone. |
| `platform-mesh.core.platform-mesh.io/finalizer` | platform-mesh-operator | Coordinates teardown of platform-level provider secrets and kcp setup state. |

You should not normally remove these finalizers by hand. If a resource is stuck on a finalizer, check the operator logs to see which subroutine is blocked rather than force-deleting.

## Annotations

Pure annotations on PM-managed objects are sparse. The codebase uses Kubebuilder-generated annotations (`controller-gen.kubebuilder.io/version`) on CRDs and standard Kubernetes annotations (e.g., `service.binding/*` from the [Service Binding spec](https://servicebinding.io/) on operator-managed objects), but PM does not impose a custom annotation scheme on top of them today.

If you encounter a PM annotation in a real cluster that is not documented here, it is likely operator-internal state that is safe to ignore from a user perspective.

## Where This Appears

- [**Account CR**](/concepts/account-cr) — uses the `core.platform-mesh.io` API group and its finalizers
- [**ContentConfiguration**](/concepts/content-configuration) — uses the `ui.platform-mesh.io` API group and the `ui.platform-mesh.io/entity` label
- [**IAM Store**](/concepts/iam-store) — uses the `core.platform-mesh.io` API group
- [**APIExport & APIBinding**](/concepts/api-export-binding) — vanilla kcp objects; PM does not require additional labels on these by default, though provider onboarding may add them

## What's Next

- [**Account CR**](/concepts/account-cr) — see PM API groups and finalizers in a concrete object
- [**ContentConfiguration**](/concepts/content-configuration) — see the `ui.platform-mesh.io/entity` label in use
- [**Architecture**](/overview/architecture) — see how the operators that own this metadata fit together
