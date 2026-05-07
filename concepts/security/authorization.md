# Authorization

Once an identity is established, Platform Mesh must determine what that identity is permitted to do.
Given the complexity of interactions across hierarchical accounts, [service providers](/concepts/personas/service-provider), and [service consumers](/concepts/personas/service-consumer), Platform Mesh supports a **two-tier authorization model**: Kubernetes RBAC for control-plane-local decisions and OpenFGA for authorization across control plane boundaries.

## Kubernetes-native RBAC

The first tier leverages the built-in Role-Based Access Control[^1] mechanism of Kubernetes.
Since the Platform Mesh API layer is built on the [Kubernetes Resource Model](/concepts/control-planes) and powered by [kcp](https://kcp.io), RBAC is the natural structural access control layer.

Kubernetes RBAC operates at the API resource level, governing which subjects (users, groups, service accounts) can perform which verbs (get, list, create, update, delete) on which resource types within a given workspace.
Each account functions as an isolated [control plane](/concepts/control-planes) with its own RBAC configuration, meaning access policies are always scoped to the control plane they are defined in.
RBAC rules are themselves Kubernetes resources, managed declaratively through the same KRM patterns used for all platform resources, consistent with the [declarative API principle](/concepts/why-platform-mesh).
This extends naturally to Custom Resource Definitions introduced by [Managed Service Providers](/concepts/personas/service-provider): when a service provider exposes new capabilities, the existing RBAC mechanism governs access without additional configuration.

## Fine-grained authorization with ReBAC

The second tier addresses authorization decisions that go beyond what RBAC can express: decisions that depend on relationships between entities such as team memberships, resource ownership, or service subscriptions.

OpenFGA[^2] provides **Relationship-Based Access Control (ReBAC)**, an authorization model based on the Zanzibar approach[^3], where access decisions are derived from a graph of relationships rather than static role assignments.
Authorization state is expressed as relationship tuples, (user, relation, object), and permissions propagate through the graph.
For example, if a team has ordered a service and a user is a member of that team, the user inherits access to that service instance without explicit per-user permission grants.

The hierarchical [account model](/concepts/account-model) maps naturally to this relationship graph, and permissions defined at a parent account can flow to child accounts through relationship inheritance.
Resources from different [service providers](/concepts/personas/service-provider) are represented as distinct resource types in [kcp](https://kcp.io), and access to each is evaluated through the standard SubjectAccessReview mechanism regardless of the provider origin.

## Layered evaluation

Kubernetes RBAC serves as the first gate, enforcing structural access at the API level.
When RBAC can make a definitive decision (granting or denying access based on resource-type permissions), the request is resolved immediately.
When RBAC has no opinion, typically for fine-grained access decisions that depend on relationships rather than resource types, the request is forwarded to OpenFGA through the authorization webhook for relationship-based evaluation.

OpenFGA is integrated through [kcp](https://kcp.io)'s standard **authorization webhook** mechanism.
This means that OpenFGA is not a hardwired component: any authorizer conforming to the Kubernetes authorization webhook interface can be configured as an alternative or additional authorization backend, preserving the platform's commitment to pluggability and decoupling.

## Related

- [Security architecture overview](./)
- [Authentication](./authentication) — how identity is established before authorization runs
- [Identity and authorization](/concepts/identity-and-authorization) — runtime view of the authorizer chain
- [OpenFGA](/reference/components/openfga) — reference for the authorization engine component

[^1]: [Kubernetes RBAC Documentation](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
[^2]: [OpenFGA](https://openfga.dev/)
[^3]: [Zanzibar: Google's Consistent, Global Authorization System](https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/)
