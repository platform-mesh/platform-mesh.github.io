# Architecture

Platform Mesh is a composable platform built on the Kubernetes Resource Model. It provides one mechanism for offering, discovering, ordering, and managing services from different providers.

## Component layers

<div class="onion-light">

![Platform Mesh onion architecture diagram](/diagrams/pm-onion-lgt.svg)

</div>
<div class="onion-dark">

![Platform Mesh onion architecture diagram](/diagrams/pm-onion-drk.svg)

</div>

<style>
html.dark .onion-light, html.dark .arch-light { display: none; }
html:not(.dark) .onion-dark, html:not(.dark) .arch-dark { display: none; }
</style>

The **UI layer** includes the Platform Mesh portal and the Kubernetes GraphQL gateway. The portal is the consumer-facing experience. The gateway exposes Platform Mesh and kcp resources through GraphQL for UI clients.

The **core control plane** is kcp. Platform Mesh uses kcp workspaces, APIExports, and APIBindings as its control-plane substrate. The account operator maps Platform Mesh accounts to that workspace hierarchy.

The **identity and authorization layer** uses Keycloak for OpenID Connect authentication and OpenFGA for relationship-based authorization.

The **deployment and supply chain layer** uses Flux and OCM to deliver and reconcile platform components.

The **connectivity layer** connects provider runtimes to the mesh. api-syncagent is the low-effort CRD-based path. multi-cluster-runtime is the custom-controller path. kube-bind can be used where APIs need to be projected into regular Kubernetes clusters.

## Component interaction

<div class="arch-light">

![Platform Mesh high-level architecture](/diagrams/high-level-arch-lgt.svg)

</div>
<div class="arch-dark">

![Platform Mesh high-level architecture](/diagrams/high-level-arch-drk.svg)

</div>

A typical request starts in the portal. The portal calls the Kubernetes GraphQL gateway, which translates the request into Kubernetes Resource Model operations against a kcp workspace. kcp authenticates the request through Keycloak and authorizes it through Kubernetes RBAC and OpenFGA-backed authorization.

When a consumer creates a resource in their workspace, the resource exists in kcp through an APIBinding to a provider APIExport. A provider-side integration mechanism synchronizes the desired state to the provider runtime. The provider operator reconciles the real service and reports status back through the same control-plane path.

## Related

- [Why Platform Mesh?](./why-platform-mesh.md)
- [Control planes](./control-planes.md)
- [Integration paths](./integration-paths.md)
- [Component reference](/reference/components/)
