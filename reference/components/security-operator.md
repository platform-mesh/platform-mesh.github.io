# Security operator

## Purpose

The **Security Operator** automates security configuration across your platform mesh environment. It watches for new workspaces and automatically sets up everything needed to manage access control in Platform Mesh: creating authorization stores in [**OpenFGA**](https://openfga.dev/), provisioning realms and clients in [**Keycloak**](https://www.keycloak.org/), and keeping authorization models in sync as your APIs evolve.

Instead of manually configuring authentication and authorization for each new workspace, the Security Operator handles it all for you — ensuring consistent security posture across all organizations within your Platform Mesh deployment. 

## Runtime role

The Security Operator automates security configuration across Platform Mesh:

**Workspace Initialization** — When a new organization is created, operator creates `Store` resource with authorization models and tuples, `IdentityProviderConfiguration` resource that provisions Keycloak realms and OIDC clients, and `WorkspaceAuthenticationConfiguration` resource linking realms to KCP workspaces.

**OpenFGA and Keycloak Management** — Maintains authorization stores (one per organization) with fine-grained access control, writes authorization tuples mapping users to roles and resources, provisions isolated Keycloak realms with OIDC clients, and dynamically extends authorization models when APIs are bound.

**API Export Binding Control** — Enforces deny-by-default binding policy through `ApiExportPolicy` resources, writes authorization tuples to OpenFGA enabling permitted workspaces to create `ApiBinding` resources, and automatically creates `AuthorizationModel` resources in provider workspaces to extend consumer authorization models.

## Repository

- [platform-mesh/security-operator](https://github.com/platform-mesh/security-operator)

## Core Concepts

The Security Operator manages several custom resources that work together to provide comprehensive security automation. Understanding these core concepts is essential for working with the Platform Mesh security model.

### Store

The `Store` resource represents an **OpenFGA** authorization store within the Platform Mesh. Each organization gets its own `Store`, which serves as the foundation for all authorization decisions within that organization's workspaces.

Unlike traditional **RBAC** systems where permissions are evaluated against static role definitions, OpenFGA uses a **relationship-based authorization model**. The `Store` resource bridges Kubernetes and OpenFGA by:

- Maintaining the **core authorization model** that defines permission relationships
- Managing **tuples** that map users to roles and resources
- Automatically extending the authorization model when new APIs are bound

`Store` resources are created during workspace initialization when a new organization is provisioned or during the Platform Mesh installation phase. The Store controller watches these resources and creates corresponding stores in the OpenFGA service, then keeps the authorization model and tuples synchronized.

### AuthorizationModel

An `AuthorizationModel` defines the permission schema for a specific API within an OpenFGA store. While the core authorization model (bundled in each `Store`) covers Platform Mesh's built-in resources, `AuthorizationModel` resources **extend** this base to include provider APIs.

When somebody creates an `ApiBinding` to consume a provider's API, the Security Operator automatically:

1. Creates an `AuthorizationModel` resource in the **provider's workspace**
2. Updates the consumer organization's `Store` with the extended authorization model
3. Enables fine-grained access control for the newly bound API's resources

This dynamic model extension means providers don't need to manually configure authorization for each consumer — the Security Operator handles it automatically as APIs are bound and unbound.

### IdentityProviderConfiguration (IDP)

The `IdentityProviderConfiguration` resource configures **Keycloak** as the identity provider for a workspace. Each organization gets its own **Keycloak realm**, isolated from other organizations, with **OIDC clients** pre-configured for common authentication flows.

An `IdentityProviderConfiguration` resource is created during workspace initialization when a new organization is created and defines:

- The Keycloak realm name
- OIDC clients for web applications and CLI tools
- Redirect URLs for each client
- Token lifespan and authentication policies

The IDP controller provisions these resources in Keycloak and stores client credentials in Kubernetes **secrets**, making them available to applications that need to authenticate users within the workspace.

**Client Types:**

| Client | Type | Purpose |
|--------|------|---------|
| Workspace client | **Confidential** | Web applications and services that can securely store secrets |
| `kubectl` client | **Public** | CLI authentication via OIDC device flow or local callback server |

::: tip
The `kubectl` client is automatically configured with localhost redirect URLs to support `kubectl oidc-login` and similar CLI authentication plugins.
:::

### Invite

The `Invite` resource provides a declarative way to invite users into an organization via email. Rather than manually managing user accounts in Keycloak, administrators can create `Invite` resources that trigger automated invitation workflows.

When an `Invite` is created, the Security Operator:
- Sends an email invitation to the specified address
- Provisions a pending user account in the workspace's Keycloak realm  
- Grants appropriate permissions once the user accepts the invitation

This enables **self-service user onboarding** while maintaining security boundaries between organizations.

### ApiExportPolicy

By default, all API binding in the Platform Mesh is **denied** — workspaces cannot bind to a provider's `APIExport` without explicit permission. The `ApiExportPolicy` resource grants these binding permissions at scale using **workspace path expressions**.

An `ApiExportPolicy` consists of two parts:

| Field | Purpose |
|-------|---------|
| `apiExportRef` | Identifies the `APIExport` to grant access to (name and cluster path) |
| `allowPathExpressions` | List of workspace path patterns that should receive bind permissions |

**Path Expression Syntax:**

- `:root:orgs:example` — Grants permission to exactly this workspace
- `:root:orgs:example:*` — Grants permission to this workspace **and all descendants**

`ApiExportPolicy` resources are typically created by Platform Mesh administrators when publishing APIs for broader consumption. The Security Operator watches these policies and writes the corresponding authorization tuples to OpenFGA, enabling the permitted workspaces to create `ApiBinding` resources.

## Configuration

### OpenFGA Settings

Configure how the Security Operator connects to and manages OpenFGA stores. The `--fga-target` must point to your OpenFGA instance, while the other flags control the authorization model structure and caching behavior.

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

### Keycloak & Identity Provider Settings

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

::: info
The Keycloak client secret is read from the `KEYCLOAK_CLIENT_SECRET` environment variable.
:::

#### SMTP Configuration

Configure email delivery for user invitations and notifications. All SMTP settings are optional — if not configured, email-based features will be disabled.

| Flag | Default | Description |
|---|---|---|
| `--idp-smtp-server` | — | Keycloak SMTP server host |
| `--idp-smtp-port` | `0` | Keycloak SMTP server port |
| `--idp-from-address` | — | SMTP from address for Keycloak emails |
| `--idp-smtp-user` | — | SMTP username |
| `--idp-smtp-password` | — | SMTP password |
| `--idp-smtp-ssl` | `false` | Enable SMTP SSL |
| `--idp-smtp-starttls` | `false` | Enable SMTP STARTTLS |
| `--http-client-timeout-seconds` | `30` | HTTP client timeout in seconds |

### KCP Integration

Configure how the Security Operator connects to KCP workspaces and discovers API exports. These settings control the operator's view of the workspace hierarchy and API surface.

| Flag | Default | Description |
|---|---|---|
| `--kcp-kubeconfig` | `/api-kubeconfig/kubeconfig` | Path to KCP kubeconfig |
| `--api-export-endpoint-slice-name` | `core.platform-mesh.io` | Core APIExportEndpointSlice name |
| `--system-api-export-endpoint-slice-name` | `system.platform-mesh.io` | System APIExportEndpointSlice name |
| `--workspace-path` | `root` | indicates in which workspace workspace type lives. It's used by Initializer and Terminator for providers setup |
| `--workspace-type-name` | `security` | Workspace type name |

### Workspace & Authentication Settings

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

Control which initialization components are active. Disabling an initializer prevents the Security Operator from automatically creating resources of that type during workspace provisioning.

| Flag | Default | Description |
|---|---|---|
| `--initializer-workspace-enabled` | `true` | Enable workspace initialization |
| `--initializer-idp-enabled` | `true` | Enable IDP initialization |
| `--initializer-invite-enabled` | `true` | Enable invite initialization |
| `--initializer-workspace-auth-enabled` | `true` | Enable workspace auth initialization |

### Webhooks

Configure the validating webhook server for CRD validation. Webhooks are disabled by default — enable them to add admission control for Security Operator resources.

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

## Architecture Decision Records

- [ADR-002: APIExport Binding Access Control](https://github.com/platform-mesh/architecture/blob/main/adr/002-apiexport-binding-access-control.md)
