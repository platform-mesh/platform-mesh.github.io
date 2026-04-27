# Authentication

Authentication in Platform Mesh establishes a verified identity for every interaction, whether initiated by a human user, an automated pipeline, or a service-to-service call.
The platform standardizes on **OpenID Connect (OIDC)** as the primary authentication protocol, providing a consistent, token-based identity layer across all participants in the mesh.
In addition, <Project>kcp</Project> natively supports Kubernetes service accounts, enabling workloads and automation to authenticate directly without requiring an external identity provider.

Keycloak is configured as an OIDC provider through <Project>kcp</Project>'s **authentication configuration** mechanism, the same declarative approach used to configure any OIDC-compatible identity provider.
For user-facing identity providers, Keycloak acts as the federation layer through its identity brokering mechanism.
For machine identity issuers, such as Kubernetes cluster JWT issuers or GitHub Actions OIDC, where identity brokering through Keycloak does not apply, <Project>kcp</Project>'s support for OIDC configuration at the workspace level enables direct integration at the account level.
This ensures that the authentication layer is not hardwired to a single provider or federation path but rather configured through standard Kubernetes primitives.

## Internal Identity Provider

Keycloak[^1] serves as the internal Identity Provider (IDP) within Platform Mesh.
As a centralized identity and access management solution implementing OIDC, OAuth 2.0, and SAML 2.0, Keycloak provides the authentication surface through which all platform interactions are verified.

Key aspects of Keycloak's role within Platform Mesh:

- **Token-Based Identity:** Keycloak issues JWT-based access tokens, ID tokens, and refresh tokens following OIDC standards. These tokens carry identity claims that downstream services consume to establish the caller's identity without repeated authentication.
- **Authentication Flows:** Platform Mesh leverages Keycloak's support for standard OIDC flows. The portal uses the Authorization Code grant for interactive browser sessions, while `kubectl` uses the Authorization Code grant with PKCE (Proof Key for Code Exchange) as a public client against <Project>kcp</Project>.
- **Tenant-Aligned Realms:** Platform Mesh creates a dedicated Keycloak realm per organization, providing isolated user stores, client configurations, and authentication policies that align with the hierarchical <Term>account model</Term>.

## Identity Federation

A critical requirement for any platform operating across organizational boundaries is the ability to integrate with existing identity infrastructure.
Platform Mesh supports connecting multiple OpenID Connect-compatible identity providers, allowing organizations to integrate with their existing identity infrastructure.

Keycloak addresses this through its identity brokering mechanism.
External identity providers (corporate OIDC providers, SAML identity providers, LDAP directories) can be connected as federated sources.
Users authenticate against their existing corporate IDP, and Keycloak translates the external identity into a consistent internal representation, ensuring that downstream authorization decisions operate on a normalized identity regardless of the authentication source.

This approach enables the "bring your own IDP" model essential for multi-organizational service ecosystems while maintaining a uniform authentication contract across the mesh.

[^1]: [Keycloak](https://www.keycloak.org/)
