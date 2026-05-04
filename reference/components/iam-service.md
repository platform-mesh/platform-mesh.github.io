# IAM service

## Purpose

The **IAM service** is a GraphQL-based identity and access management service for Platform Mesh. It is composed of two integrated layers:

- **Keycloak** — the OIDC identity provider used for authentication. Users log in via Keycloak and receive JWT tokens consumed by all Platform Mesh services. The IAM service uses the Keycloak Admin API for user queries and enrichment.
- **OpenFGA** — a relationship-based authorisation engine (inspired by Google Zanzibar). Fine-grained permissions (e.g. workspace membership, role assignments) are stored as tuples and evaluated by OpenFGA at request time.

The service provisions and reconciles per-account OpenFGA stores, manages the relationship-based authorization model, and exposes IAM operations consumed by the Portal and other Platform Mesh components. It is the runtime peer of the [Account operator](./account-operator.md) for everything authorization-related.

## Runtime role

The IAM service owns the lifecycle of IAM Stores (per-account authorization stores backed by OpenFGA), seeds them with the initial authorization model, and updates them as APIBindings activate or accounts change.

All routing goes through a GraphQL API. Requests pass through a KCP middleware layer that injects user context from the JWT token, then reach resolvers protected by an `@Authorized` directive that evaluates OpenFGA tuples before returning data.

```
GraphQL Request
    ↓
KCP Middleware (injects user context from JWT)
    ↓
GraphQL Resolver (@Authorized directive)
    ↓
OpenFGA tuple evaluation + Keycloak user enrichment
    ↓
Response
```

**Role model** — two roles are defined per resource scope:

| Role | Description |
|---|---|
| `Owner` | Full access to all resources within the account |
| `Member` | Limited access; can view and interact but cannot administrate |

**No traditional database** — authorization state is stored exclusively as OpenFGA tuples, enabling distributed authorization decisions and consistency through KCP coordination.

## Technology stack

| Component | Technology |
|---|---|
| Language | Go 1.26+ |
| API | GraphQL (schema-first via gqlgen) |
| Authorization | OpenFGA (gRPC) |
| Identity provider | Keycloak (OIDC / OAuth2) |
| Multi-cluster | KCP (kcp-dev controller-runtime fork) |
| Observability | OpenTelemetry + zerolog |
| Container | Distroless static binary, non-root (UID 1001) |

## Repository

- [github.com/platform-mesh/iam-service](https://github.com/platform-mesh/iam-service)

## Configuration

| Variable | Purpose |
|---|---|
| `KUBECONFIG` | Path to the Kubernetes / KCP cluster config |
| `KEYCLOAK_CLIENT_SECRET` | Keycloak OAuth2 client secret (environment only — never pass via CLI args) |

Copy `.env.sample` to `.env` and populate the values before running locally.

## Related

- [IAM UI](./iam-ui.md)
- [OpenFGA](./openfga.md)
- [rebac-authz-webhook](./rebac-authz-webhook.md)
- [Identity and authorization](/concepts/identity-and-authorization.md)
