# Keycloak

## Purpose

[Keycloak](https://www.keycloak.org/) serves as the internal Identity Provider (IDP) for Platform Mesh, implementing OpenID Connect, OAuth 2.0, and SAML 2.0 standards to provide centralized authentication and identity federation.

## Runtime role

Keycloak integrates with Platform Mesh through two primary paths:

**kcp workspace authentication** — Keycloak is configured as an OIDC provider through kcp's `WorkspaceAuthenticationConfiguration` resources. The Security Operator creates one `WorkspaceAuthenticationConfiguration` per organization, named after the workspace, which configures a JWT authenticator pointing to the Keycloak realm issuer URL (`https://<base-domain>/keycloak/realms/<workspace-name>`). This configuration includes:
- **Audience validation**: All OIDC client IDs from the organization's `AccountInfo` resource, ensuring tokens issued for any client in the realm are accepted
- **Claim mappings**: Extracts user identity from the `email` claim and groups from the `groups` claim in JWT tokens
- **WorkspaceType linking**: The configuration is referenced by all `WorkspaceType` resources labeled with the organization, applying authentication rules to all workspaces of that type

This per-organization JWT configuration enables isolated identity management while maintaining consistent OIDC flows across the mesh.

**Portal authentication** — The portal uses Keycloak's interactive browser-based OIDC flows for user authentication, establishing browser sessions that carry identity claims to downstream services.

**Automated provisioning** — The [Security Operator](./security-operator.md) automatically configures Keycloak through `IdentityProviderConfiguration` resources. When an organization is created, the operator provisions a dedicated Keycloak realm with two pre-configured OIDC clients: a confidential client for web applications (including the portal) and a public client for CLI tools like `kubectl` with PKCE support.

## Repository

- [platform-mesh/keycloak](https://github.com/platform-mesh/keycloak)
- Upstream: [keycloak/keycloak](https://github.com/keycloak/keycloak)

## Future component reference

### Realm lifecycle

Keycloak realms are created, updated, and deleted automatically in sync with organization lifecycle through `IdentityProviderConfiguration` resources managed by the Security Operator.

::: info
See more information about [IdentityProviderConfiguration](/reference/components/security-operator.md#identityproviderconfiguration-idp) in the Security Operator component documentation.
:::

**Creation** — When an organization is created, the Security Operator provisions an `IdentityProviderConfiguration` resource named after the workspace. The IDP controller reconciles this resource and creates a corresponding Keycloak realm with the same name through the Keycloak Admin API.

**Configuration** — Each realm is initialized with standard defaults:

| Setting | Configuration |
|---------|---------------|
| Access token lifespan | Configurable via `--idp-access-token-lifespan` (default: 28800 seconds / 8 hours) |
| SSO session idle timeout | Matches the access token lifespan |
| Email-based authentication | Login with email enabled, email used as username |
| Self-registration | Controlled via `--idp-registration-allowed` flag (default: false) |
| SMTP integration | Optional SMTP configuration for email delivery (invites, password resets, email verification) |

**Updates** — Realm configuration updates are applied through `IdentityProviderConfiguration` spec changes during the reconciliation.

**Deletion** — When an `IdentityProviderConfiguration` is deleted (typically during organization deletion), the finalizer `core.platform-mesh.io/idp-finalizer` ensures:
1. All OIDC clients in the realm are deleted
2. Client secrets stored in Kubernetes are removed
3. The Keycloak realm itself is deleted via the Admin API

This lifecycle ensures that identity infrastructure is automatically provisioned and cleaned up alongside the organizational structure.

### Client management

Each Keycloak realm provisions two OIDC clients by default, both managed through the OIDC Dynamic Client Registration protocol.

**Confidential workspace client** — Used by web applications (including the portal):

| Property | Value |
|----------|-------|
| Client type | `confidential` — requires client secret for token exchange |
| Client name | Matches the organization workspace name |
| Redirect URIs | `https://<workspace-name>.<base-domain>/*` plus any additional URIs from `--idp-additional-redirect-urls` |
| Post-logout redirect URIs | `https://<workspace-name>.<base-domain>/logout*` |
| Grant types | `authorization_code`, `refresh_token` |
| Token endpoint auth method | `client_secret_basic` |
| Secret storage | Kubernetes secret named `portal-client-secret-<workspace>-<workspace>` in the `default` namespace |

**Public kubectl client** — Used by CLI tools:

| Property | Value |
|----------|-------|
| Client type | `public` — no client secret required |
| Client name | `kubectl` |
| Redirect URIs | `http://localhost:8000`, `http://localhost:18000` (configurable via `--idp-kubectl-client-redirect-urls`) |
| Grant types | `authorization_code`, `refresh_token` |
| Token endpoint auth method | `none` (PKCE provides security for public clients) |
| Secret storage | Kubernetes secret named `portal-client-secret-<workspace>-kubectl` (contains registration metadata, not a client secret) |

**Client lifecycle** — Clients are registered using OIDC Dynamic Client Registration and tracked in the `IdentityProviderConfiguration` status:
- **Registration**: Clients are created via the Keycloak registration endpoint on first reconciliation
- **Updates**: Client configuration (redirect URIs, post-logout URIs) is updated when the spec changes
- **Deletion**: Clients removed from the spec are automatically deleted, including their Kubernetes secrets
- **Status tracking**: `ManagedClients` map stores `clientID` and `registrationClientURI` for each provisioned client

Client credentials and registration access tokens are stored in Kubernetes secrets referenced by the `IdentityProviderConfiguration` resource, enabling the controller to manage client lifecycle through the OIDC protocol.


## Related
- [Access Keycloak](/how-to-guides/access-keycloak.md)
- [Authentication](/concepts/security/authentication.md) — authentication concepts and Keycloak's role as internal IDP
- [Identity and authorization](/concepts/identity-and-authorization.md) — runtime view of the authentication and authorization chain
- [Security Operator](./security-operator.md) — automated provisioning of Keycloak realms and clients
