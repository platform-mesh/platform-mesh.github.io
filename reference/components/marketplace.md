# Marketplace

## Purpose

The **Marketplace** is the service-provider discovery and self-service installation hub for Platform Mesh. It allows workspace users to browse a catalog of available service providers (extensions), view their metadata, and install or uninstall them with a single click.

Under the hood, installing a provider creates a Kubernetes `APIBinding` in the current workspace that points at the provider's `APIExport`, granting the workspace access to the provider's APIs and controllers.

The key capabilities are:

- **Provider catalog** — browsable, searchable, and filterable list of all available service providers
- **Provider details** — full metadata view: description, contacts, documentation, support channels, service level
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

## Configuration

The UI reads all runtime configuration from the Luigi node context injected by the Portal. No static environment files are required in production. The relevant context fields are:

| Field | Purpose |
|---|---|
| `portalContext.crdGatewayApiUrl` | Base URL for the Kubernetes GraphQL Gateway |
| `accountId` | Current workspace scope for install/uninstall operations |
| `token` | Bearer token forwarded to every GraphQL request |
| `analyticsTrackerConfig` | Optional Matomo analytics configuration |
| `uiConfig.filters` | Optional list of `{label, providerMetadataPath}` entries that define the catalog's filter facets |

`uiConfig.filters` drives which filter dropdowns render above the provider catalog and how they behave, without requiring a UI code change:

- Each entry renders one filter control. If the list is empty or absent, no filter row is shown.
- `label` is the filter's display name (e.g. `Category`, `Provider`).
- `providerMetadataPath` is a dot-path resolved against each provider's `ProviderMetadata`, walking through JSON-encoded sub-objects (such as `spec.data`) as needed — e.g. `spec.data.category` or `spec.data.provider`.
- The available options for a filter are the distinct values found at that path across the current catalog. Selecting one or more values narrows the catalog to providers whose resolved value matches a selection; no selection shows every provider.

## Repository

- [github.com/platform-mesh/marketplace-ui](https://github.com/platform-mesh/marketplace-ui)


## Related

- [Portal](./portal.md)
- [Kubernetes GraphQL gateway](./kubernetes-graphql-gateway.md)
- [virtual-workspaces](./virtual-workspaces.md) — serves the `MarketplaceEntry` view this UI consumes
- [Provider to consumer](/concepts/interaction-patterns/provider-to-consumer.md)
