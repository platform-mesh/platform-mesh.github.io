# Marketplace

The **Marketplace** is the service-provider discovery and self-service installation hub. 
It allows workspace users to browse a catalog of available service providers (extensions), view their metadata, 
and install or uninstall them with a single click.

Under the hood, installing a provider creates a Kubernetes `APIBinding` in the current workspace that points at the provider's `APIExport`, 
granting the workspace access to the provider's APIs and controllers.

## Marketplace UI

The **Marketplace UI** is an Angular microfrontend application that serves as the service-provider discovery and management hub
within the **Platform Mesh** ecosystem. It enables users to browse, install, and uninstall service providers (extensions) into their
Platform Mesh workspace.

---

### What Is Platform Mesh and what role does the Marketplace UI play?

Platform Mesh is a multi-cluster, multi-tenant platform built on top of [kcp](https://kcp.io) — a Kubernetes control-plane layer that
introduces **workspaces** as isolated, lightweight "clusters." Rather than deploying everything into a single monolithic cluster,
Platform Mesh organizes resources across hierarchical workspaces (accounts → projects → teams).

#### Providers and the APIExport / APIBinding Model

The central mechanism for service delivery in Platform Mesh is the **provider/consumer model**:

- A **Service Provider** (or "extension") is a team or product that wants to offer capabilities (APIs, controllers, storage, tooling) to other workspaces in the platform.
- The provider creates an **`APIExport`** in their workspace — a packaged, versioned set of custom Kubernetes APIs (CRDs + permission claims) that they want to share.
- A consumer workspace that wants to use those capabilities creates an **`APIBinding`** pointing at the provider's `APIExport`. Once bound, the consumer workspace gets access to the provider's APIs and the provider's controllers can act on the consumer's resources.

This model allows providers to operate their controllers centrally while serving many consumer workspaces without installing CRDs in each one.

#### The Marketplace

The **Marketplace** is the catalog layer on top of this mechanism. It stores **`MarketplaceEntry`** custom resources — one per registered provider — that bundle:

- The provider's `APIExport` reference (what is being offered)
- `ProviderMetadata` (display name, description, icon, contacts, documentation, support channels, service level, verification status, tags)
- Installation state (whether the current workspace already has an `APIBinding` for this provider)

The Marketplace UI queries this catalog and lets users install or uninstall providers with a single click, which translates directly into creating or deleting the corresponding `APIBinding` in their workspace.

---

### Key Features

| Feature | Description |
|---|---|
| Provider catalog | Browsable, searchable, filterable list of all available service providers |
| Provider details | Full metadata view: description, contacts, documentation, support channels, service level |
| Install | Creates an `APIBinding` in the current workspace with all required permission claims auto-accepted |
| Uninstall | Deletes the `APIBinding` after a confirmation dialog |
| Theme support | Renders provider icons in light or dark variants based on the active SAP Fiori theme |
| Analytics | Tracks view / install / uninstall events via Matomo |
| "New" badge | Providers created less than 3 months ago are automatically tagged as new |

---
