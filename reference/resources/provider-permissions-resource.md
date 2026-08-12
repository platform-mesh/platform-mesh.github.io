# ProviderPermissions resource

## Definition

The `ProviderPermissions` custom resource allows API providers to customize authorization for their resources. It extends the auto-generated [AuthorizationModel](/reference/components/security-operator.md#authorizationmodel) with custom roles and permissions, enabling fine-grained access control beyond Platform Mesh defaults.

The `ProviderPermissions` CR is defined in the API group `providers.platform-mesh.io/v1alpha1` and is reconciled by the [Security operator](/reference/components/security-operator.md) during `APIBinding` reconciliation. When a consumer binds to a provider's API, the Security operator merges the provider's custom relations into the generated authorization model.

Providers create this resource in their workspace under `:root:providers:<provider-name>`, alongside the `APIExport`, `ContentConfiguration`, and other provider resources.

## When to use

Use `ProviderPermissions` when your provider needs to:

- **Add custom permissions** beyond standard CRUD operations (e.g., `scan`, `approve`, `review`)
- **Override default verb permissions** to change which roles can perform standard actions (e.g., restrict `delete` to owners only, or allow a custom `codeviewer` role to `get` resources)
- **Introduce custom roles** with display names and descriptions for the IAM UI

If your provider only needs the default authorization behavior (owner/member roles with standard verb mappings), you do not need a `ProviderPermissions` resource.

## Schema

A minimal `ProviderPermissions` looks like this:

```yaml
apiVersion: providers.platform-mesh.io/v1alpha1
kind: ProviderPermissions
metadata:
  name: orchestrate.platform-mesh.io
spec:
  apiExport:
    ref:
      name: orchestrate.platform-mesh.io
  roles:
    - groupResource: httpbin.orchestrate.platform-mesh.io
      roles:
        - id: codeviewer
          displayName: Code Viewer
          description: Can view code and related resources.
  permissions:
    httpbin.orchestrate.platform-mesh.io:
      defaultPermissions:
        get: "codeviewer or member"
      additionalPermissions:
        scan: "member"
```

| Field | Purpose |
| --- | --- |
| `spec.apiExport.ref.name` | Name of the `APIExport` this configuration applies to. The provider can only define permissions for resources exposed by this APIExport. |
| `spec.roles` | Custom roles grouped by resource type. These roles appear in the IAM UI and can be assigned to users. |
| `spec.permissions` | Per-resource permission configuration. Override default verb permissions or add custom permissions. |

## Roles configuration

The `roles` field defines custom roles for specific resource types. Each entry groups roles by `groupResource`:

```yaml
roles:
  - groupResource: httpbin.orchestrate.platform-mesh.io
    roles:
      - id: codeviewer
        displayName: Code Viewer
        description: Can view code and related resources.
        definition: "[role#assignee] or member"
```

| Field | Purpose |
| --- | --- |
| `groupResource` | Resource type in format `{kind}.{group}` (e.g., `httpbin.orchestrate.platform-mesh.io`). Must match a resource in the provider's APIExport. |
| `roles[].id` | Role identifier. Becomes the relation name in OpenFGA and is used in permission expressions. |
| `roles[].displayName` | Human-readable name shown in the IAM UI. |
| `roles[].description` | Explains what the role does. Shown in the IAM UI. |
| `roles[].definition` | (Optional) OpenFGA relation definition. Defines how the role relation is computed. If omitted, defaults to `[role#assignee]`. |

## Permissions configuration

The `permissions` field configures authorization for specific resource types:

```yaml
permissions:
  httpbin.orchestrate.platform-mesh.io:
    defaultPermissions:
      get: "codeviewer or member"
      update: ""
      delete: "owner"
      patch: ""
      watch: ""
    additionalPermissions:
      scan: "[user:*] or member"
      approve: "owner"
```

| Field | Purpose |
| --- | --- |
| Key (e.g., `httpbin.orchestrate.platform-mesh.io`) | Resource type in format `{kind}.{group}`. Must match a resource in the provider's APIExport. |
| `defaultPermissions` | Override the default permission expressions for standard Kubernetes verbs. |
| `additionalPermissions` | Define custom permissions beyond standard CRUD operations. |

### Default permissions

The `defaultPermissions` section overrides how standard Kubernetes verbs are authorized:

| Verb | Default (if empty) | Description |
| --- | --- | --- |
| `get` | `member` | Read a single resource |
| `update` | `member` | Replace a resource |
| `delete` | `member` | Delete a resource |
| `patch` | `member` | Partially update a resource |
| `watch` | `member` | Watch for resource changes |

Set a verb to an empty string `""` to use the default. Set it to a custom expression to override:

```yaml
defaultPermissions:
  get: "codeviewer or member"  # Custom: codeviewer OR member can get
  delete: "owner"               # Override: only owner can delete
  update: ""                    # Default: member can update
```

### Additional permissions

The `additionalPermissions` section defines custom permissions that don't map to standard Kubernetes verbs:

```yaml
additionalPermissions:
  scan: "[user:*] or member"    # Anyone or member can scan
  approve: "owner"              # Only owner can approve
  review: "codeviewer or owner" # codeviewer OR owner can review
```

These permissions become relations in the OpenFGA authorization model and can be checked by application code.

## Who creates it

| Use case | Created by |
| --- | --- |
| Provider-specific authorization | Provider developer, in their workspace under `:root:providers:<provider-name>` |

Providers create this resource alongside their `APIExport`, `ContentConfiguration`, and other provider resources. The resource name typically matches the APIExport name.

## Who reconciles it

The [Security operator](/reference/components/security-operator.md) reconciles `ProviderPermissions` during `APIBinding` reconciliation. When a consumer binds to a provider's API, the operator:

1. Lists `ProviderPermissions` resources in the provider's workspace
2. Finds the one matching the bound `APIExport`
3. Merges custom relations into the generated `AuthorizationModel`

## What happens when you apply one

1. Provider creates `ProviderPermissions` in their workspace under `:root:providers:<provider-name>`
2. A consumer creates an `APIBinding` to the provider's `APIExport`
3. Security operator reconciles the `APIBinding` and discovers the `ProviderPermissions`
4. Security operator generates an `AuthorizationModel` with the custom relations merged in
5. The Store controller writes the updated model to OpenFGA
6. The [IAM service](/reference/components/iam-service.md) can now query available roles for the resource type
7. Users can be assigned the custom roles through the IAM UI or GraphQL API

When the `ProviderPermissions` resource is updated, the Security operator regenerates affected `AuthorizationModel` resources.

When the `ProviderPermissions` resource is deleted, the Security operator regenerates the `AuthorizationModel` without the custom relations, reverting to default behavior.

## Example: Adding a custom role with permissions

This example shows a provider adding a `codeviewer` role that can read resources and perform a custom `scan` operation:

```yaml
apiVersion: providers.platform-mesh.io/v1alpha1
kind: ProviderPermissions
metadata:
  name: orchestrate.platform-mesh.io
spec:
  apiExport:
    ref:
      name: orchestrate.platform-mesh.io
  roles:
    - groupResource: httpbin.orchestrate.platform-mesh.io
      roles:
        - id: codeviewer
          displayName: Code Viewer
          description: Can view code and related resources.
          definition: "[role#assignee] or member"
        - id: admin
          displayName: Admin
          description: Administrative access with elevated permissions.
          definition: "[role#assignee] or owner"
  permissions:
    httpbin.orchestrate.platform-mesh.io:
      defaultPermissions:
        get: "codeviewer or member"
        update: ""
        delete: "owner"
        patch: ""
        watch: ""
      additionalPermissions:
        scan: "[user:*] or member"
        approve: "admin or owner"
status:
  conditions:
    - type: Ready
      status: "True"
```

This configuration:

- Defines two custom roles: `codeviewer` and `admin`
- Allows `codeviewer` or `member` to perform `get` operations
- Restricts `delete` to `owner` only
- Adds a `scan` permission that anyone (`[user:*]`) or `member` can use
- Adds an `approve` permission for `admin` or `owner`

## Constraints

- **Resource ownership**: Providers can only define permissions for resources exposed by their `APIExport`. Attempting to define permissions for other providers' resources or system resources is rejected.
- **Relation syntax**: Permission expressions use [OpenFGA DSL syntax](https://openfga.dev/docs/configuration-language). Invalid syntax causes the `AuthorizationModel` generation to fail.
- **Parent inheritance**: The `from parent` relation has limitations when multiple providers define roles with the same name. See the RFC for details on `from` operator constraints.

## Related

- [Security operator](/reference/components/security-operator.md) — reconciles ProviderPermissions and generates AuthorizationModels
- [Authorization concepts](/concepts/security/authorization.md) — Platform Mesh two-tier authorization model
- [OpenFGA](/reference/components/openfga.md) — the authorization engine
- [IAM service](/reference/components/iam-service.md) — queries roles and manages user assignments
- [Provider resource](/reference/resources/provider-resource.md) — provisions provider workspaces
