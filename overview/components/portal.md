# Portal

The **Portal** is the primary web interface for Platform Mesh. 
It is an Angular microfrontend shell built on the [Luigi](https://luigi-project.io) framework that composes IAM, 
Marketplace, and any custom extensions into a single, cohesive user experience.

---

## Purpose and Responsibility

The Portal acts as the **orchestration layer** for the entire Platform Mesh UI surface. Its responsibilities are:

- **Workspace navigation** — lets users traverse the KCP workspace hierarchy (root → org → account → namespace) with context-aware navigation nodes that update as the selected workspace changes
- **Org / account / namespace management** — surfaces CRUD operations for the main Platform Mesh entities, delegating rendering to embedded microfrontends
- **Kubeconfig download** — generates and serves a ready-to-use kubeconfig scoped to the current workspace
- **Home dashboard** — shows a summary of the current workspace context (owner, path, service bindings)
- **Terminal-as-a-Service** — an in-browser shell powered by xterm.js and a ttyd-based WebSocket backend, available when the `terminal` feature toggle is enabled
- **Microfrontend orchestration** — loads and frames IAM UI, Marketplace UI, and any registered extension microfrontends inside Luigi iframes with shared authentication context
- **Authentication shell** — handles the OIDC / OAuth2 login flow via the Luigi OAuth2 plugin and forwards JWT tokens to all child microfrontends

---

## Key Concepts

### Luigi Micro-Frontend Orchestration

All routing inside the Portal is owned by **Luigi**, not the Angular router. 
The Angular router is intentionally empty; Luigi handles deep links, iframe lifecycle, and context propagation to child microfrontends. 
Navigation nodes (accounts, namespaces, IAM, Marketplace, Terminal) are built dynamically in TypeScript service classes that implement Luigi's node configuration interfaces.

### KCP Workspace Context

Every navigation node is scoped to a **KCP workspace path** (e.g. `root:orgs:my-org:my-account`). 
The backend derives the active workspace path from the authenticated user's context and injects it into the Luigi `globalContext`, 
making it available to all child microfrontends without additional round-trips.
