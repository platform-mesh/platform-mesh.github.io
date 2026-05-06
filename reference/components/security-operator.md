# Security operator

## Purpose

The **Security operator** automates security configuration across your platform mesh environment. It watches for new workspaces and automatically sets up everything needed to manage access control in Platform Mesh: creating authorization stores in [**OpenFGA**](https://openfga.dev/), provisioning realms and clients in [**Keycloak**](https://www.keycloak.org/), and keeping authorization models in sync as your APIs evolve.

Instead of manually configuring authentication and authorization for each new workspace, the Security operator handles it all for you — ensuring consistent security posture across all organizations within your Platform Mesh deployment. 

## Runtime role

The Security operator automates security configuration across Platform Mesh:

**Workspace initialization** — Security operator initializes workspaces of `org` and `account` type. For an `org` workspace, the operator creates a `Store` resource with authorization model and tuples, an `IdentityProviderConfiguration` resource that provisions Keycloak realm and OIDC clients, and a `WorkspaceAuthenticationConfiguration` resource linking realms to kcp workspaces. For an `account` type workspace, the operator creates tuples with account creator information.

**OpenFGA and Keycloak management** — Maintains authorization stores (one per organization) with fine-grained access control, writes authorization tuples mapping users to roles and resources, provisions isolated Keycloak realms with OIDC clients, and dynamically extends authorization models when APIs are bound.

**APIExport binding control** — Enforces deny-by-default binding policy through `APIExportPolicy` resources, writes authorization tuples to OpenFGA enabling permitted workspaces to create `APIBinding` resources, and automatically creates `AuthorizationModel` resources in provider workspaces to extend consumer authorization models.

## Repository

- [platform-mesh/security-operator](https://github.com/platform-mesh/security-operator)

## Core concepts

The Security operator manages several custom resources that work together to provide comprehensive security automation. 

### Store

The `Store` resource represents an **OpenFGA** authorization store within the Platform Mesh. Each organization gets its own `Store`, which serves as the foundation for all authorization decisions within that organization's workspaces.

The `Store` resource bridges Kubernetes and OpenFGA by:

- Maintaining the **core authorization model** that defines permission relationships
- Managing **tuples** that map users to roles and resources
- Automatically extending the authorization model when new APIs are bound

`Store` resources are created during workspace initialization when a new organization is provisioned or during the Platform Mesh installation phase. The Store controller watches these resources and creates corresponding stores in the OpenFGA service, then keeps the authorization model and tuples synchronized.

**Example Store resource:**

```yaml
apiVersion: core.platform-mesh.io/v1alpha1
kind: Store
metadata:
  name: test
  finalizers:
  - core.platform-mesh.io/fga-store
  - core.platform-mesh.io/fga-tuples
spec:
  coreModule: |
    module core

    type user

    type role
      relations
        define assignee: [user,user:*]

    type core_platform-mesh_io_account
      relations
        define parent: [core_platform-mesh_io_account]

        define owner: [role#assignee] or owner from parent
        define member: [role#assignee] or owner

        define get: member
        define update: member
        define patch: member
        define delete: owner

        define create_core_platform-mesh_io_accounts: member
        define list_core_platform-mesh_io_accounts: member
        define watch_core_platform-mesh_io_accounts: member

        # org and account specific
        define watch: member

        define create_core_platform-mesh_io_accountinfos: member
        define list_core_platform-mesh_io_accountinfos: member
        define watch_core_platform-mesh_io_accountinfos: member

        define list_core_kcp_io_logicalclusters: member
        define watch_core_kcp_io_logicalclusters: member

        # IAM specific
        define manage_iam_roles: owner
        define get_iam_roles: member
        define get_iam_users: member

        # APIExport binding control
        define bind_inherited: [apis_kcp_io_apiexport] or bind_inherited from parent
        define bind: [apis_kcp_io_apiexport] or bind_inherited

    type core_platform-mesh_io_accountinfo
      relations
        define parent: [core_platform-mesh_io_account]

        define member: member from parent
        define owner: owner from parent

        define get: member
        define watch: member

        # IAM specific
        define manage_iam_roles: owner
        define get_iam_roles: member
        define get_iam_users: member

    type core_kcp_io_logicalcluster
      relations
        define parent: [core_platform-mesh_io_account]

        define member: member from parent

        define get: member
        define watch: member
  tuples:
  - object: role:core_platform-mesh_io_account/<logical-cluster-name>/<account-name>/owner
    relation: assignee
    user: user:<user-email>
  - object: core_platform-mesh_io_account:<logical-cluster-name>/<account-name>
    relation: owner
    user: role:core_platform-mesh_io_account/<logical-cluster-name>/<account-name>/owner#assignee
status:
  storeId: 01KQF7C00X593KN79515TFA4VG
  authorizationModelId: 01KQS6VBH2DWWEQDZJ3Z55RB31
  conditions:
  - type: Ready
    status: "True"
    reason: Complete
    message: all subroutines completed successfully
  managedTuples:
  - object: role:core_platform-mesh_io_account/<logical-cluster-name>/<account-name>/owner
    relation: assignee
    user: user:<user-email>
  - object: core_platform-mesh_io_account:<logical-cluster-name>/<account-name>
    relation: owner
    user: role:core_platform-mesh_io_account/<logical-cluster-name>/<account-name>/owner#assignee
```

**Key fields:**

- **`spec.coreModule`**: The OpenFGA authorization model in DSL format, defining permission relationships for Platform Mesh core resources. The same core model is used across all organizations. See the [security-operator Helm chart values](https://github.com/platform-mesh/helm-charts/blob/0e2ae8fb755cf2a8eecdeff55eff5c1bce47e635/charts/security-operator/values.yaml#L115) for the configuration source.

- **`spec.tuples`**: Initial authorization tuples that map users to roles. Tuple identifiers include the **logical cluster name** (the name of the kcp cluster where the [account](/concepts/account-model.md) is created) and the account name, forming a globally unique reference like `core_platform-mesh_io_account:<logical-cluster-name>/<account-name>`.

- **`status.storeId`**: The OpenFGA store ID assigned when the store is created in OpenFGA.

- **`status.authorizationModelId`**: The OpenFGA model ID for the current authorization schema version.

- **`status.managedTuples`**: Tuples that were successfully written to OpenFGA, mirroring the spec tuples once reconciliation completes.
Note that OpenFGA contains additional tuples created during account initialization and other operations — `managedTuples` only tracks the tuples explicitly declared in the `Store` resource spec.

### AuthorizationModel

An `AuthorizationModel` defines the permission schema for a specific API within an OpenFGA store. The common authorization model for every organization in OpenFGA consists of two parts: the **core module** from the `Store` resource and **auto-generated schemas** based on Kubernetes resources, generated by the security-operator during `Store` reconciliation. `AuthorizationModel` resources **extend** this base model with provider API-specific permissions.

When somebody creates an `APIBinding` to consume a provider's API, the Security operator automatically:

1. Creates an `AuthorizationModel` resource in the **provider's workspace**
2. Updates the consumer organization's `Store` with the extended authorization model
3. Enables fine-grained access control for the newly bound API's resources

This dynamic model extension means providers do not need to manually configure authorization for each consumer — the Security operator handles it automatically as APIs are bound and unbound.

**Example AuthorizationModel resource:**

```yaml
apiVersion: core.platform-mesh.io/v1alpha1
kind: AuthorizationModel
metadata:
  name: orchestrate-platform-mesh-io-httpbins-<organization name>
  finalizers:
  - core.platform-mesh.io/fga-tuples
spec:
  model: |
    module httpbins

    extend type core_namespace
      relations
        define create_orchestrate_platform-mesh_io_httpbins: owner
        define list_orchestrate_platform-mesh_io_httpbins: member
        define watch_orchestrate_platform-mesh_io_httpbins: member

    type orchestrate_platform-mesh_io_httpbin
      relations
        define parent: [core_namespace]
        define member: [role#assignee] or owner or member from parent
        define owner: [role#assignee] or owner from parent
        
        define get: member
        define update: member
        define delete: member
        define patch: member
        define watch: member

        define manage_iam_roles: owner
        define get_iam_roles: member
        define get_iam_users: member
  storeRef:
    cluster: <logical-cluster-name>
    name: <organization-name>
```

**Key fields:**

- **`spec.model`**: The OpenFGA authorization model extension in DSL format. This model extends the core authorization model with provider API-specific types and permissions. In this example, it defines permissions for the `orchestrate_platform-mesh_io_httpbin` resource type and extends `core_namespace` to include httpbin-related operations.

- **`spec.storeRef`**: Reference to the consumer organization's `Store` resource. The `cluster` field contains the logical cluster name, and `name` contains the organization name. The Security operator uses this reference to merge the authorization model extension into the consumer's OpenFGA store.

### IdentityProviderConfiguration (IDP)

The `IdentityProviderConfiguration` resource configures **Keycloak** as the identity provider for a workspace. Each organization gets its own **Keycloak realm**, isolated from other organizations, with **OIDC clients** pre-configured for common authentication flows.

An `IdentityProviderConfiguration` resource is created during workspace initialization when a new organization is created and defines:

- The Keycloak realm name
- OIDC clients for web applications and CLI tools
- Redirect URLs for each client
- Token lifespan and authentication policies

The IDP controller provisions these resources in Keycloak and stores client credentials in Kubernetes **secrets**, making them available to applications that need to authenticate users within the workspace.

**Client types:**

| Client | Type | Purpose |
|--------|------|---------|
| Workspace client | **Confidential** | Web applications and services that can securely store secrets |
| `kubectl` client | **Public** | CLI authentication via OIDC device flow or local callback server |

::: tip
The `kubectl` client is automatically configured with localhost redirect URLs to support `kubectl oidc-login` and similar CLI authentication plugins.
:::

**Example IdentityProviderConfiguration resource:**

```yaml
apiVersion: core.platform-mesh.io/v1alpha1
kind: IdentityProviderConfiguration
metadata:
  name: <organization-name>
  finalizers:
  - core.platform-mesh.io/idp-finalizer
spec:
  registrationAllowed: true
  clients:
  - clientName: <organization-name>
    clientType: confidential
    redirectUris:
    - http://localhost:8000/callback*
    - http://localhost:4300/callback*
    - http://sub.localhost:4300/callback*
    - https://<organization-name>.portal.localhost:8443/*
    postLogoutRedirectUris:
    - https://<organization-name>.portal.localhost:8443/logout*
    secretRef:
      name: portal-client-secret-<organization-name>-<organization-name>
      namespace: default
  - clientName: kubectl
    clientType: public
    redirectUris:
    - http://localhost:8000
    - http://localhost:18000
    secretRef:
      name: portal-client-secret-<organization-name>-kubectl
      namespace: default
status:
  conditions:
  - type: Ready
    status: "True"
    reason: Complete
    message: all subroutines completed successfully
  managedClients:
    <organization-name>:
      clientId: acce553c-4644-497e-a089-05a7c856370c
      registrationClientUri: https://portal.localhost:8443/keycloak/realms/<organization-name>/clients-registrations/openid-connect/acce553c-4644-497e-a089-05a7c856370c
      secretRef:
        name: portal-client-secret-<organization-name>-<organization-name>
        namespace: default
    kubectl:
      clientId: 11e0418a-af32-48c5-837e-9581343e4249
      registrationClientUri: https://portal.localhost:8443/keycloak/realms/<organization-name>/clients-registrations/openid-connect/11e0418a-af32-48c5-837e-9581343e4249
      secretRef:
        name: portal-client-secret-<organization-name>-kubectl
        namespace: default
```

**Key fields:**

- **`spec.registrationAllowed`**: Controls whether self-registration is enabled in the Keycloak realm.

- **`spec.clients`**: List of OIDC clients to provision in the Keycloak realm. Each client specifies its type (`confidential` or `public`), redirect URIs for authentication callbacks, post-logout redirect URIs, and a reference to the Kubernetes secret where credentials are stored.

- **`status.managedClients`**: Map of successfully provisioned clients in Keycloak. For each client, the status includes the Keycloak-assigned `clientId`, the `registrationClientUri` used for OIDC Dynamic Client Registration updates, and the secret reference. The Security operator uses this information to manage client lifecycle through the OIDC protocol.

### Invite

The `Invite` resource provides a declarative way to invite users into an organization via email. Rather than manually managing user accounts in Keycloak, administrators can create `Invite` resources that trigger automated invitation workflows.

When an `Invite` is created, the Security operator:
- Sends an email invitation to the specified address
- Provisions a pending user account in the workspace's Keycloak realm  
- Grants appropriate permissions once the user accepts the invitation

This enables **self-service user onboarding** while maintaining security boundaries between organizations.

**Example Invite resource:**

```yaml
apiVersion: core.platform-mesh.io/v1alpha1
kind: Invite
metadata:
  name: <invite-name>
spec:
  email: <user-email>
status:
  conditions:
  - type: Ready
    status: "True"
    reason: Complete
    message: all subroutines completed successfully
```

**Key fields:**

- **`spec.email`**: The email address of the user to invite. The Security operator sends an invitation email to this address and provisions a pending user account in the organization's Keycloak realm.

### APIExportPolicy

By default, all API binding in the Platform Mesh is **denied** — workspaces cannot bind to a provider's `APIExport` without explicit permission. The `APIExportPolicy` resource grants these binding permissions at scale using **workspace path expressions**.

An `APIExportPolicy` consists of two parts:

| Field | Purpose |
|-------|---------|
| `apiExportRef` | Identifies the `APIExport` to grant access to (name and cluster path) |
| `allowPathExpressions` | List of workspace path patterns that should receive bind permissions |

**Path expression syntax:**

- `:root:orgs:example` — Grants permission to exactly this workspace
- `:root:orgs:example:*` — Grants permission to this workspace **and all descendants**

`APIExportPolicy` resources are typically created by Platform Mesh administrators when publishing APIs for broader consumption. The Security operator watches these policies and writes the corresponding authorization tuples to OpenFGA, enabling the permitted workspaces to create `APIBinding` resources.

**Example APIExportPolicy resource:**

```yaml
apiVersion: core.platform-mesh.io/v1alpha1
kind: APIExportPolicy
metadata:
  name: orchestrate.platform-mesh.io
  finalizers:
  - system.platform-mesh.io/apiexportpolicy-finalizer
spec:
  apiExportRef:
    name: orchestrate.platform-mesh.io
    clusterPath: root:providers:httpbin-provider
  allowPathExpressions:
  - :root:orgs:*
status:
  conditions:
  - type: Ready
    status: "True"
    reason: Complete
    message: all subroutines completed successfully
  managedAllowExpressions:
  - :root:orgs:*
```

## Configuration

### OpenFGA settings

Configure how the Security operator connects to and manages OpenFGA stores. The `--fga-target` must point to your OpenFGA instance, while the other flags control the authorization model structure and caching behavior.

| Flag | Default | Description |
|---|---|---|
| `--fga-target` | — | OpenFGA API target address |
| `--fga-store-id-cache-ttl` | `24h` | TTL for the OpenFGA store ID cache |
| `--fga-object-type` | `core_platform-mesh_io_account` | OpenFGA object type for account tuples |
| `--fga-parent-relation` | `parent` | OpenFGA parent relation name |
| `--fga-creator-relation` | `owner` | OpenFGA creator relation name |
| `--core-module-path` | — | Path to the core module FGA model file |
| `--migrate-authorization-models` | `false` | Enable one-time authorization model migration |
| `--allow-member-tuples-enabled` | `false` | Enable allow-member tuples management |

::: tip
Use `--migrate-authorization-models=true` only during initial setup or major version upgrades. This flag performs a one-time migration and should not be left enabled in production.
:::

### Keycloak and identity provider settings

Configure Keycloak connection and identity provider behavior. The base URL and client credentials are required for operator authentication, while SMTP settings enable email-based user invitations.

| Flag | Default | Description |
|---|---|---|
| `--keycloak-base-url` | — | Keycloak base URL |
| `--keycloak-client-id` | `security-operator` | Keycloak client ID for operator authentication |
| `--idp-realm-deny-list` | — | Comma-separated list of Keycloak realms to ignore |
| `--idp-access-token-lifespan` | `28800` | Keycloak access token lifespan in seconds (8 hours) |
| `--idp-registration-allowed` | `false` | Enable Keycloak self-registration |
| `--idp-additional-redirect-urls` | — | Additional redirect URLs for Keycloak clients |
| `--idp-kubectl-client-redirect-urls` | `http://localhost:8000`, `http://localhost:18000` | Redirect URLs for kubectl Keycloak client |
| `--set-default-password` | `false` | Enable setting default password for IDP users |
| `--http-client-timeout-seconds` | `30` | HTTP client timeout in seconds |

::: info
The Keycloak client secret is read from the `KEYCLOAK_CLIENT_SECRET` environment variable.
:::

#### SMTP configuration

Configure email delivery for user invitations and notifications. All SMTP settings are optional — if not configured, email-based features are disabled.

| Flag | Default | Description |
|---|---|---|
| `--idp-smtp-server` | — | Keycloak SMTP server host |
| `--idp-smtp-port` | `0` | Keycloak SMTP server port |
| `--idp-from-address` | — | SMTP from address for Keycloak emails |
| `--idp-smtp-user` | — | SMTP username |
| `--idp-smtp-password` | — | SMTP password |
| `--idp-smtp-ssl` | `false` | Enable SMTP SSL |
| `--idp-smtp-starttls` | `false` | Enable SMTP STARTTLS |

### kcp integration

Configure how the Security operator connects to kcp workspaces and discovers API exports. These settings control the operator's view of the workspace hierarchy and API surface.

| Flag | Default | Description |
|---|---|---|
| `--kcp-kubeconfig` | `/api-kubeconfig/kubeconfig` | Path to kcp kubeconfig |
| `--api-export-endpoint-slice-name` | `core.platform-mesh.io` | Core APIExportEndpointSlice name |
| `--system-api-export-endpoint-slice-name` | `system.platform-mesh.io` | System APIExportEndpointSlice name |
| `--workspace-path` | `root` | indicates in which workspace workspace type lives. It's used by Initializer and Terminator for providers setup |
| `--workspace-type-name` | `security` | Workspace type name |

### Workspace and authentication settings

Configure workspace initialization behavior and JWT token validation. The base domain is used to construct issuer URLs, while claim names determine how user identity is extracted from tokens.

| Flag | Default | Description |
|---|---|---|
| `--base-domain` | `portal.dev.local:8443` | Base domain for constructing issuer URLs |
| `--group-claim` | `groups` | ID token group claim name |
| `--user-claim` | `email` | ID token user claim name |
| `--additional-audiences` | — | Additional audiences to trust in workspace JWT authentication |
| `--domain-ca-lookup` | `false` | Enable lookup of domain CA from Kubernetes secret |
| `--development-allow-unverified-emails` | `false` | Allow unverified emails in development mode |

::: warning
Only enable `--development-allow-unverified-emails` in non-production environments. This flag bypasses email verification and should never be used in production.
:::

### Initializers

Control which initialization components are active. Disabling an initializer prevents the Security operator from automatically creating resources of that type during workspace provisioning.

| Flag | Default | Description |
|---|---|---|
| `--initializer-workspace-enabled` | `true` | Enable workspace initialization |
| `--initializer-idp-enabled` | `true` | Enable IDP initialization |
| `--initializer-invite-enabled` | `true` | Enable invite initialization |
| `--initializer-workspace-auth-enabled` | `true` | Enable workspace auth initialization |

### Webhooks

Configure the validating webhook server for CRD validation. Webhooks are disabled by default — enable them to add admission control for Security operator resources.

| Flag | Default | Description |
|---|---|---|
| `--webhooks-enabled` | `false` | Enable validating webhooks |
| `--webhooks-port` | `9443` | Webhook server port |
| `--webhooks-cert-dir` | `/tmp/k8s-webhook-server/serving-certs` | Webhook certificate directory |

::: info
Refer to the [component repository](https://github.com/platform-mesh/security-operator) for the full configuration reference and environment variable options.
:::


## Related

- [Identity and authorization](/concepts/identity-and-authorization.md)
- [OpenFGA](./openfga.md)
- [rebac-authz-webhook](./rebac-authz-webhook.md)
- [Account operator](./account-operator.md)
- [Keycloak](./keycloak.md)
- [IAM Store resource](/reference/resources/iamstore-resource.md)
- [Account resource](/reference/resources/account-resource.md)

## Architecture decision records

- [ADR-002: APIExport Binding Access Control](https://github.com/platform-mesh/architecture/blob/main/adr/002-apiexport-binding-access-control.md)
