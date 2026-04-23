# IAM

The **IAM module** handles identity and access management for Platform Mesh. It is composed of two layers:

- **Keycloak** — the OIDC identity provider used for authentication. Users log in via Keycloak and receive JWT tokens consumed by all Platform Mesh services.
- **OpenFGA** — a relationship-based authorisation engine (inspired by Google Zanzibar). Fine-grained permissions (e.g. workspace membership, role assignments) are stored as tuples and evaluated by OpenFGA at request time.

## IAM UI

The **IAM UI** is the identity and access management microfrontend for Platform Mesh. It provides user and role management directly
inside the Portal shell, giving workspace administrators full control over who can access a resource and with what permissions.

---

### What It Does

IAM UI lets users manage membership and roles for any Platform Mesh resource (accounts, teams, namespaces, and other Kubernetes-scoped entities). 
The key capabilities are:

- **Browse members** — paginated, searchable, and filterable list of all users assigned to a resource
- **Add members** — invite existing platform users or send email invitations to new users, assigning one or more roles in a single step
- **Assign and remove roles** — update role assignments inline; at least one owner is always enforced
- **Leave a scope** — a user can remove themselves from a resource they belong to

---
