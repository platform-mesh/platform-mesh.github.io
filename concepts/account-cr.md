# Account CR

The **Account** is the central Platform Mesh custom resource that represents an organization, team, project, or environment in the [account hierarchy](/concepts/account-model). Each Account corresponds to a kcp workspace and is the unit at which Platform Mesh provisions identity, authorization, and policy.

::: info Where it comes from
The Account CR is defined by the [account-operator](https://github.com/platform-mesh/account-operator) in the API group `core.platform-mesh.io/v1alpha1`. The operator reconciles Accounts into kcp workspaces, sets up workspace types, and wires identity/authorization for each one.
:::

## Schema

A minimal Account looks like this:

```yaml
apiVersion: core.platform-mesh.io/v1alpha1
kind: Account
metadata:
  name: platform-team
spec:
  type: org              # org | folder
  displayName: "Platform Team"
  creator: alice@example.com
```

| Field | Purpose |
|---|---|
| `spec.type` | Account type. `org` for a root organization (mapped to a kcp workspace type), `folder` for a sub-account / nesting level. |
| `spec.displayName` | Human-readable label used by the Portal and marketplace. |
| `spec.creator` | The user who owns the Account, used as the initial admin in the IAM store. |
| `spec.extensions` | Optional list of `AccountExtension` resources that attach additional configuration to the Account (e.g., quotas, custom policies). |
| `spec.data` | Free-form structured data the Account exposes to the Portal and to children for inheritance. |

## Who Creates It

| Account type | Created by |
|---|---|
| Root organization (`type: org`) | Platform owner, usually as part of onboarding a new tenant. Typically committed in `helm-charts/local-setup` or a similar GitOps repo. |
| Folder / sub-account (`type: folder`) | The parent account's admin (delegated through OpenFGA), often via the Portal or `kubectl`. |

The Account CR is **not** created by service providers or service consumers directly. Providers and consumers operate inside workspaces that the Account hierarchy provisions for them.

## What Happens When You Apply One

When the account-operator sees a new Account CR, it:

1. **Creates a kcp workspace** for the Account under its parent (or at root for `type: org`).
2. **Sets workspace type** based on `spec.type`, applying the right RBAC and initialization policies for an org or folder.
3. **Provisions an IAM Store** (OpenFGA store) for this Account — see [IAM Store](/concepts/iam-store) for details.
4. **Initializes identity** — for `org` accounts, a Keycloak realm is created (or referenced if federation is configured).
5. **Adds finalizers** (`account.core.platform-mesh.io/finalizer`, `workspacetype.core.platform-mesh.io/finalizer`) so deletion is reconciled in the right order.
6. **Writes status** with the workspace path, the IAM store name, and references to the identity realm.

The Account becomes ready when all of the above complete. Until then, the workspace exists but is not usable for binding services or onboarding users.

## Example: A Real Account from local-setup

The following is the root organization account from the Platform Mesh local setup:

```yaml
apiVersion: core.platform-mesh.io/v1alpha1
kind: Account
metadata:
  name: default
spec:
  type: org
  displayName: platform-mesh Org
```

Applied at the root workspace, this provisions the top-level `platform-mesh` organization that all other accounts are children of in a default deployment.

## Where This Appears

- [Provider Quick Start](/guides/provider-quick-start) — the provider workspace lives under an Account in the hierarchy
- [Account Model](/concepts/account-model) — the structural overview
- [IAM Store](/concepts/iam-store) — what gets provisioned alongside each Account

## What's Next

- [**Account Model**](/concepts/account-model) — how Accounts compose into a hierarchy
- [**IAM Store**](/concepts/iam-store) — the OpenFGA store provisioned per Account
- [**Platform Mesh Annotations**](/concepts/pm-annotations) — the labels and finalizers PM uses on Accounts and related objects
