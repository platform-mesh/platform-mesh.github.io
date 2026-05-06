# Portal

## Purpose

The **Portal** is the primary web interface for Platform Mesh. It is an Angular microfrontend shell built on the [Luigi](https://luigi-project.io) framework that composes IAM, Marketplace, and any custom extensions into a single, cohesive user experience.

The Portal acts as the **orchestration layer** for the entire Platform Mesh UI surface. Its responsibilities are:

- **Workspace navigation** — lets users traverse the kcp workspace hierarchy (root → org → account → namespace) with context-aware navigation nodes that update as the selected workspace changes
- **Org / account / namespace management** — surfaces CRUD operations for the main Platform Mesh entities, delegating rendering to embedded microfrontends
- **Kubeconfig download** — generates and serves a ready-to-use kubeconfig scoped to the current workspace
- **Home dashboard** — shows a summary of the current workspace context (owner, path, service bindings)
- **Terminal-as-a-Service** — an in-browser shell powered by xterm.js and a ttyd-based WebSocket backend, available when the `terminal` feature toggle is enabled
- **Microfrontend orchestration** — loads and frames IAM UI, Marketplace UI, and any registered extension microfrontends inside Luigi iframes with shared authentication context
- **Authentication shell** — handles the OIDC / OAuth2 login flow via the Luigi OAuth2 plugin and forwards JWT tokens to all child microfrontends

## Runtime role

It lets users onboard organizations, navigate accounts, and navigate the kcp workspace hierarchy. All routing is owned by **Luigi**, not the Angular router — Luigi handles deep links, iframe lifecycle, and context propagation to child microfrontends. Navigation nodes (accounts, namespaces, IAM, Marketplace, Terminal) are built dynamically in TypeScript service classes that implement Luigi's node configuration interfaces.

Every navigation node is scoped to a **kcp workspace path** (for example `root:orgs:my-org:my-account`). 
The backend derives the active workspace path from the authenticated user's context and injects it into the 
Luigi `globalContext`, making it available to all child microfrontends without additional round-trips.

## Repository

- [github.com/platform-mesh/portal](https://github.com/platform-mesh/portal)

## Related

- [Explore the example MSP](/tutorials/explore-example-msp.md)
- [IAM UI](./iam-ui.md)
- [Marketplace](./marketplace.md)
- [Kubernetes GraphQL gateway](./kubernetes-graphql-gateway.md)
