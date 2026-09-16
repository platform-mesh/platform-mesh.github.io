# Portal server library

## Purpose

The **Portal server library** (`@platform-mesh/portal-server-lib`) is the NestJS library the [Portal](../portal.md) backend is built with. It builds on the generic [`@openmfp/portal-server-lib`](https://www.npmjs.com/package/@openmfp/portal-server-lib), which provides the `PortalModule` that serves the frontend, handles the OAuth2 flow, and assembles the Luigi configuration. The Platform Mesh library supplies the implementations that connect that module to kcp, Keycloak, and the Platform Mesh authorization stack.

## Provided implementations

The library exports its providers from `@platform-mesh/portal-server-lib/portal-options`. The Portal backend passes them to `PortalModule.create()`:

| Export | Implements | Responsibility |
|---|---|---|
| `PMAuthConfigProvider` | `AuthConfigService` | Resolves the organization from the request host, reads the OIDC client from the `IdentityProviderConfiguration` resource in kcp, and returns the authorization and token endpoints from OIDC discovery |
| `PMLogoutService` | `LogoutCallback` | Ends the session at the identity provider on logout |
| `PMRequestContextProvider` | `RequestContextProvider` | Adds the organization and whether the request targets an organization subdomain to the request context |
| `PMPortalContextService` | `PortalContextProvider` | Resolves `${org-name}` and `${org-subdomain}` placeholders in portal context URLs and adds the public kcp workspace URL |
| `AccountEntityContextProvider` | `EntityContextProvider` | Provides the context values for the `account` entity |
| `KubernetesServiceProvidersService` | `ServiceProviderService` | Lists [`ContentConfiguration`](/reference/resources/content-configuration.md) resources for the current organization and account through kcp, and returns them together with the resolved node permissions |
| `ContentConfigurationServiceProvidersService` | `ServiceProviderService` | Alternative service provider that reads `ContentConfiguration` resources through the `contentconfigurations` [virtual workspace](../virtual-workspaces.md) of the [Kubernetes GraphQL gateway](../kubernetes-graphql-gateway.md) |
| `KcpKubernetesService` | — | Kubernetes client for kcp, configured from `KUBECONFIG_KCP` |
| `PermissionsProxyService`, `AuthzWebhookService` | — | Resolve navigation node and resource instance permissions through the `/batch-authz` endpoint of the [rebac-authz-webhook](../rebac-authz-webhook.md), configured by `OPENMFP_PORTAL_CONTEXT_AUTHZ_WEBHOOK_URL`; when unset, permission checks fail open |
| `PermissionsController` | — | Exposes `POST /rest/permissions/resource-check` for instance-level permission checks from the frontend |

Outside an organization subdomain, both service providers return the welcome node configuration instead of `ContentConfiguration` resources.

## Repository

- [github.com/platform-mesh/portal-server-lib](https://github.com/platform-mesh/portal-server-lib)

## Related

- [Portal](../portal.md)
- [Portal UI library](./portal-ui-lib.md)
- [Keycloak](../keycloak.md)
- [rebac-authz-webhook](../rebac-authz-webhook.md)
