# IAM UI

## Purpose

The **IAM UI** is the identity and access management microfrontend for Platform Mesh. It provides user and role management directly inside the Portal shell, giving workspace administrators full control over who can access a resource and with what permissions.

The key capabilities are:

- **Browse members** — paginated, searchable, and filterable list of all users assigned to a resource
- **Add members** — invite existing platform users or send email invitations to new users, assigning one or more roles in a single step
- **Assign and remove roles** — update role assignments inline; at least one owner is always enforced
- **Leave a scope** — a user can remove themselves from a resource they belong to

## Runtime role

IAM UI calls the [IAM service](./iam-service.md) via GraphQL to read and write authorization state. It surfaces as two independently deployable artifacts inside the Portal:

- **Standalone UI** — a full-page Angular microfrontend loaded by Luigi inside an iframe, mounted at `/ui/iam/ui/`. It handles the members listing page (`/:entityId/members`) and the add-members flow (`/:entityId/add-members`).
- **Web components** — self-registering custom elements loaded by Luigi as ES modules, mounted at `/ui/iam/wc/`. These embed lightweight member views (e.g. a `members-sidebar`) into compound layout slots without a full iframe.

Both artifacts read their runtime context (IAM service URL, tenant, entity, and kcp workspace path) from the Luigi `globalContext`, so they require no static configuration.

```
Luigi globalContext
    ↓
IAM UI (iframe or web component)
    ↓
GraphQL (Apollo) → IAM service
    ↓
OpenFGA tuple evaluation + Keycloak user enrichment
```

**Luigi navigation nodes** registered by the UI:

| PathSegment | EntityType | Visibility | Purpose |
|---|---|---|---|
| `members` | `project/team` | Visible (order 3) | Members listing page |
| `add-members` | `project/team` | Hidden | Add-members dialog |
| `members-sidebar` | `project.overview::compound` | Sidebar slot (order 10) | Members sidebar web component |

## Technology stack

| Component | Technology |
|---|---|
| Framework | Angular 21 |
| UI Components | SAP Fundamental NGX 0.61 |
| Micro-frontend orchestration | Luigi 2.25 |
| GraphQL client | Apollo Angular 13 / Apollo Client 4 |
| Subscriptions transport | SSE (Server-Sent Events) |
| Testing | Vitest 4 |
| Language | TypeScript (ES2022, strict mode) |
| Container | nginx:alpine, served on port 8080 |

## Repository

- [github.com/platform-mesh/iam-ui](https://github.com/platform-mesh/iam-ui)

## Configuration

The UI reads all runtime configuration from the Luigi node context injected by the Portal. No static environment files are required in production. The relevant context fields are:

| Field | Purpose |
|---|---|
| `portalContext.iamServiceApiUrl` | GraphQL endpoint for the IAM service |
| `portalContext.avatarImgUrl` | Base URL for user avatar images |
| `tenantId` | Tenant scope for multi-tenant deployments |
| `entityType` / `entityId` | The resource being administered |
| `resourceDefinition` | Kubernetes resource metadata (group, kind, scope, namespace) |
| `kcpPath` | kcp workspace path for multi-cluster routing |
| `analyticsTrackerConfig` | Optional Matomo analytics configuration |

For local development, copy `.env-example` to `.env` and populate the required values before running.

## Related

- [IAM service](./iam-service.md)
- [Portal](./portal.md)
- [Keycloak](./keycloak.md)
- [Identity and authorization](/concepts/identity-and-authorization.md)
