# IAM Store

The **Store** is the Platform Mesh custom resource that provisions an [OpenFGA](https://openfga.dev/) authorization store and seeds it with an initial schema and relationship tuples. Each [Account](/concepts/account-cr) in the hierarchy gets its own Store, and the Store is what gives kcp's [authorizer chain](/overview/architecture) the ability to make ReBAC (relationship-based) authorization decisions for that Account.

::: info Where it comes from
The Store CR is defined in the API group `core.platform-mesh.io/v1alpha1` and is reconciled by the IAM service in the Platform Mesh stack. The IAM service connects to OpenFGA, creates the store, installs the authorization model, and writes the initial relationship tuples.
:::

## Schema

```yaml
apiVersion: core.platform-mesh.io/v1alpha1
kind: Store
metadata:
  name: orgs
spec:
  coreModule: |
    module core

    type user

    type role
      relations
        define assignee: [user, user:*]

    type tenancy_kcp_io_workspace
      relations
        define owner: [role#assignee]
        define member: [role#assignee]

        define create_core_platform-mesh_io_accounts: member
        define list_core_platform-mesh_io_accounts: member
        define watch_core_platform-mesh_io_accounts: member

  tuples:
  - object: role:authenticated
    relation: assignee
    user: user:*
  - object: tenancy_kcp_io_workspace:orgs
    relation: member
    user: role:authenticated#assignee
```

| Field | Purpose |
|---|---|
| `spec.coreModule` | An OpenFGA authorization model written in the OpenFGA DSL. Defines the types (`user`, `role`, `tenancy_kcp_io_workspace`, etc.) and the relations between them that PM's authorizer chain checks. |
| `spec.tuples` | Initial relationship tuples installed in the store at creation time. Typically: who is a member of the root workspace, what default roles exist, who is the initial admin. |
| `spec.modules` (optional) | Additional model fragments that extend the core module. Used to layer per-service authorization on top of the base model. |

## Who Creates It

| Use case | Created by |
|---|---|
| Root organization Store | Platform owner, deployed alongside the Account hierarchy in the local-setup or production GitOps repo. |
| Per-Account Store | Account-operator and IAM service, automatically when an Account CR is reconciled. The platform owner does not create these by hand. |
| Service-specific authorization extensions | Service provider, when their APIExport requires custom relationship types beyond what the base module covers. |

## What Happens When You Apply One

1. The IAM service picks up the Store CR.
2. It calls the OpenFGA admin API to create a new store with the name from `metadata.name`.
3. It writes the authorization model from `spec.coreModule` (and optional `spec.modules`) to OpenFGA.
4. It installs all `spec.tuples` as initial relationship tuples.
5. It records the OpenFGA store ID in the Store's `.status` so other components (notably the kcp authorizer) can find it.
6. From this point on, any kcp authorization decision in the Account's workspace flows through this OpenFGA store.

When the Account hierarchy grows, child Accounts' Stores can reference parent relationships, so permissions inherit down the tree without the platform owner having to copy tuples manually.

## How It Connects to kcp

OpenFGA is wired into kcp via the [authorizer chain](/overview/architecture). When an API request arrives at a workspace:

1. kcp authenticates the user (Keycloak / OIDC).
2. The authorizer chain runs: standard Kubernetes RBAC first, then the OpenFGA authorizer.
3. The OpenFGA authorizer translates the request into a ReBAC check against the Store associated with the request's workspace.
4. If the check returns `allowed`, the request proceeds; otherwise it is denied.

This means **every API call in a Platform Mesh cluster is authorized through OpenFGA**, not just calls that explicitly use it. The Store CR is therefore not optional for any Account that needs to be usable.

## Dynamic Schema Updates

When a new APIExport is published or a new APIBinding is activated, the IAM service updates the Account's Store with the relations that govern access to those new resources. Service providers do not need to write OpenFGA schemas by hand for standard resources — the IAM service generates the tuples and types based on the bound APIs.

For services that need custom relationships (e.g., "owner of a database can grant read-only access to a team"), the provider can supply additional model fragments via `spec.modules` or via service-specific extensions.

## Where This Appears

- Every Account in the hierarchy has an associated Store.
- The local-setup applies a root `orgs` Store that establishes the base authorization model used by all child Accounts.
- The IAM service Helm chart (`charts/iam-service`) wires OpenFGA into the cluster and is the runtime that processes these CRs.

## What's Next

- [**Account CR**](/concepts/account-cr) — the resource that triggers Store provisioning for each Account
- [**Account Model**](/concepts/account-model) — how Accounts (and their Stores) compose into a hierarchy
- [OpenFGA documentation](https://openfga.dev/docs) — the upstream authorization engine and its modeling language
