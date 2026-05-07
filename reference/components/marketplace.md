# Marketplace

## Purpose

The **Marketplace** is the service-provider discovery and self-service installation hub for Platform Mesh. It allows workspace users to browse a catalog of available service providers (extensions), view their metadata, and install or uninstall them with a single click.

Under the hood, installing a provider creates a Kubernetes `APIBinding` in the current workspace that points at the provider's `APIExport`, granting the workspace access to the provider's APIs and controllers.

The key capabilities are:

- **Provider catalog** — browsable, searchable, and filterable list of all available service providers
- **Provider details** — full metadata view: description, contacts, documentation, support channels, service level, and verification status
- **Install** — creates an `APIBinding` in the current workspace with all required permission claims auto-accepted
- **Uninstall** — deletes the `APIBinding` after a confirmation dialog
- **Theme support** — renders provider icons in light or dark variants based on the active SAP Fiori theme
- **"New" badge** — providers created less than 3 months ago are automatically tagged as new

## Runtime role

The Marketplace UI is a single-page Angular microfrontend loaded by Luigi inside an iframe, mounted at `/ui/marketplace/ui/`. It reads its runtime context (API gateway URL, account scope, auth token) from the Luigi `globalContext` and connects to the [Kubernetes GraphQL Gateway](./kubernetes-graphql-gateway.md) to query `MarketplaceEntry` resources and execute `APIBinding` mutations.

```
Luigi globalContext
    ↓
Marketplace UI (iframe)
    ↓
GraphQL (Apollo) → Kubernetes GraphQL Gateway
    ↓
MarketplaceEntry resources + APIBinding create/delete
```

**Luigi navigation nodes** registered by the UI:

| PathSegment | EntityType | Visibility | Purpose |
|---|---|---|---|
| `marketplace` | `main.core_platform-mesh_io_account` | Visible (order 700) | Provider catalog listing |
| `provider/:providerName` | account | Hidden | Provider detail view |

The active `accountId` is forwarded from the Luigi context to every GraphQL request so that `spec.installed` reflects the binding state of the current workspace.

## Technology stack

| Component | Technology |
|---|---|
| Framework | Angular 21 |
| UI components | SAP Fundamental NGX 0.61 |
| Micro-frontend orchestration | Luigi 2.22 |
| State management | NgRx 21 |
| GraphQL client | Apollo Angular / Apollo Client 4 |
| Subscriptions transport | SSE (Server-Sent Events) |
| i18n | Angular localization (English, German) |
| Testing | Vitest 4 |
| Language | TypeScript (ES2022, strict mode) |
| Container | nginx:alpine, served on port 8080 |

## Configuration

The UI reads all runtime configuration from the Luigi node context injected by the Portal. No static environment files are required in production. The relevant context fields are:

| Field | Purpose |
|---|---|
| `portalContext.crdGatewayApiUrl` | Base URL for the Kubernetes GraphQL Gateway |
| `accountId` | Current workspace scope for install/uninstall operations |
| `token` | Bearer token forwarded to every GraphQL request |
| `analyticsTrackerConfig` | Optional Matomo analytics configuration |

## Repository

- [github.com/platform-mesh/marketplace-ui](https://github.com/platform-mesh/marketplace-ui)


## Related

- [Portal](./portal.md)
- [Kubernetes GraphQL gateway](./kubernetes-graphql-gateway.md)
- [API sharing](/concepts/api-sharing.md)
- [Provider to consumer](/concepts/interaction-patterns/provider-to-consumer.md)
