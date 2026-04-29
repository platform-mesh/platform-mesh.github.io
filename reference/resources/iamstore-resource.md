# IAM Store resource

## Definition

The `Store` custom resource declares an *IAM store* — a namespace inside the [OpenFGA](/reference/components/openfga.md) engine that holds the authorization model and relationship tuples for one Platform Mesh organization or account. Each Account gets its own IAM store; many IAM stores share a single OpenFGA engine.

The `Store` CR is defined in the API group `core.platform-mesh.io/v1alpha1` and is reconciled by the [IAM service](/reference/components/iam-service.md), which calls OpenFGA to create the store, install the model, and write the initial tuples.

An IAM store typically holds:

- the authorization model (types, relations, permissions)
- relationship tuples seeded at creation
- account and organization relationships maintained over the account's lifetime
- provider-consumer relationships used for access decisions when APIBindings activate

Users should not edit IAM stores manually unless the relevant component documentation says so — the IAM service and [security-operator](/reference/components/security-operator.md) keep the store in sync with the workspace lifecycle.

## Schema

A minimal Store looks like this:

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
  tuples:
    - object: role:authenticated
      relation: assignee
      user: user:*
```

| Field | Purpose |
| --- | --- |
| `spec.coreModule` | The OpenFGA authorization model written in the [OpenFGA modeling language](https://openfga.dev/docs/configuration-language). Defines the types and relations the kcp authorizer chain checks. |
| `spec.tuples` | Initial relationship tuples installed in the store at creation. Typically: who is a member of the root workspace, what default roles exist, who is the initial admin. |
| `spec.modules` | Optional model fragments that extend `spec.coreModule`. Used to layer per-service authorization on top of the base model. |

## Who creates it

| Use case | Created by |
| --- | --- |
| Root organization Store | Platform owner, deployed alongside the Account hierarchy in the local-setup or production GitOps repo. |
| Per-account Store | account-operator and IAM service, automatically when an Account is reconciled. |
| Service-specific authorization extensions | Service provider, when their APIExport requires custom relationship types beyond the base model. |

## Who reconciles it

The IAM service reconciles Store resources and keeps OpenFGA in sync with the spec. The [security-operator](/reference/components/security-operator.md) wires Stores into the workspace lifecycle so each account workspace gets one when it is created and the store is cleaned up when the workspace is deleted.

## What happens when you apply one

1. The IAM service picks up the Store CR.
2. It calls the OpenFGA admin API to create a store with `metadata.name`.
3. It writes the authorization model from `spec.coreModule` (and any `spec.modules`) to OpenFGA.
4. It installs all `spec.tuples` as initial relationship tuples.
5. It records the OpenFGA store ID in `status` so other components (notably the [rebac-authz-webhook](/reference/components/rebac-authz-webhook.md)) can find it.
6. From this point on, any kcp authorization decision in the associated workspace flows through this OpenFGA store.

When a new APIBinding is activated in the workspace, the IAM service updates the Store with the relations governing access to the bound resources. Service providers do not need to write OpenFGA schemas by hand for standard resources.

## Example: root `orgs` store from local setup

The following is the root Store the local-setup applies to seed the `:root:orgs` workspace's authorization model:

```yaml
# platform-mesh-operator: manifests/kcp/02-orgs/store.yaml
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
        define list_core_platform-mesh_io_accounts:   member
        define get_core_platform-mesh_io_accounts:    member
        define watch_core_platform-mesh_io_accounts:  member
  tuples:
    - object: role:authenticated
      relation: assignee
      user: user:*
    - object: tenancy_kcp_io_workspace:orgs
      relation: member
      user: role:authenticated#assignee
```

The two tuples wire every authenticated user into the `orgs` workspace as a `member`, which through the model definition above grants account create/list/get/watch on `core.platform-mesh.io`.

## Related

- [Identity and authorization](/concepts/identity-and-authorization.md) — conceptual model and authorizer chain
- [IAM service](/reference/components/iam-service.md) — the runtime that reconciles Stores
- [OpenFGA](/reference/components/openfga.md) — the authorization engine
- [rebac-authz-webhook](/reference/components/rebac-authz-webhook.md) — connects kcp authorization to the Store
- [OpenFGA modeling language](https://openfga.dev/docs/configuration-language)
