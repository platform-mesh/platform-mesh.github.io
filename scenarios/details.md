---

outline: deep
---
# Provider to Consumer (P2C)

This section describes high-level scenarios of how the **Platform Mesh** enables secure, declarative, and flexible **Provider to Consumer** (P2C) interactions across clusters, organizations, and teams.

### Problem Description

In a direct **provider to consumer** setting, a provider wants to transfer technical information in a secure way to a consumer for a given service. In this scenario platform mesh is not required, but this pattern can allow to bootstrap more complex scenarios, where teams could want to establish an internal relationship between the clusters.

* The **Provider** must expose as little internal detail as possible.
* The **Consumer** should be able to automatically discover and consume instances of the service.
* Both parties must rely on a secure, declarative, contract-driven interaction.

![P2P Kube Bind Diagram](/diagrams/copy-original.svg)

To make diagrams simpler, we are using the following notation, where dashed lines represent copies of the resources, and solid lines represent the source of truth or object source.

---

## Kube (provider) to Kube (consumer)

The first scenario describes a direct interaction between a service provider and service consumers, when both sides are using vanilla Kubernetes clusters. This scenario is not strictly requiring Platform Mesh, but it can be used to bootstrap more complex scenarios.

### Solution

The provider can offer a **kube-bind backend**, allowing the consumer to:

* Authenticate with **common trusted OIDC**.
* Bind the service’s KRM API (CRDs in the traditional sense) into their own cluster.
* Automatically receive service instances and secrets or other related resources to the service contract.

![P2P Kube Bind Diagram](/diagrams/p2p-kube-bind.svg)


In this scenario, there is an established direct trust between the two clusters using OIDC authentication. The provider exposes only the necessary APIs, and the consumer can declaratively consume service instances. 

---

## Kube (provider) to Platform-Mesh (consumer)

In this scenario the consumer is using **Platform Mesh** as a control plane, which allows to manage multiple teams and clusters in a single place. This is a common scenario for **Internal Developer Platforms (IDP)**, where multiple teams are consuming services. In this case, the provider is maintaining their own Kubernetes cluster, where all business logic is running, and exposing the service APIs using **api-syncagent**. The 1:n consumers are using **kcp** concepts of `APIExport` and `APIBinding` to declaratively consume the services in their own control-planes.

![P2C Kube to Mesh Diagram](/diagrams/p-to-c-kcp-mesh.svg)

Here the provider is exposing only the necessary APIs using `APIExport` and `api-syncagent` machinery to manage API object remapping, and the consumer can declaratively consume service instances using `APIBinding`. The consumer can have multiple clusters, and the control-plane will reconcile the manifests into real-world capabilities.

![P2C Kube to Mesh Diagram](/diagrams/p-to-c-kcp-mesh-multiple.svg)

Same concept would work in the same way with multiple providers, where consumer can bind multiple services from different providers into their own control-plane.

![P2C Kube to Mesh Diagram](/diagrams/cross-consumption.svg)

In the above example, the **Analytics Team** is consuming service from the **Database Team** to create their own services. Each team manages their own cluster(s) and uses `APIBinding` to consume services declaratively. And because the **Analytics Team** constructs their own services inside their own Kubernetes cluster, they need a declarative way to consume services from the **Database Team**. For this they are using `Kube-bind` to establish the relationship between platform mesh and their own cluster for **Database Team** services. This way the source of truth for the services is the Analytics Team's consumer cluster.

## Kube (provider) to Platform-Mesh (consumer) to Kube (consumer)

The nature of Kubernetes is declarative, and the above scenario works well for many use-cases. But it has a challenge. In most cases, consumers want to be able to declare services close to where the workloads are running. In this case, similar to the first scenario, they extend their Platform-Mesh control-plane to their own clusters. For this, **kube-bind** can be used between the consumer-owned **Platform-Mesh** and their own clusters.

![P2C Kube to Mesh Diagram](/diagrams/extended-export.svg)

---

# Provider to Provider (P2P)

This section describes high-level scenarios of how cross-provider service exchange can be achieved using **Platform Mesh**.

### Problem Description

In a direct **provider to consumer** setting, a provider wants to transfer technical information in a secure way to a consumer for a given service. In this scenario Platform-Mesh is not required, but this pattern can allow to bootstrap more complex scenarios, where teams could want to establish an internal relationship between the clusters.

* The **Provider** must expose as little internal detail as possible.
* The **Consumer** should be able to automatically discover and consume instances of the service.
* Both parties must rely on a secure, declarative, contract-driven interaction.

## Kube (provider) to n*Kube (provider)

In this scenario, a provider owning Kubernetes clusters wants to cross-sell or resell their services to other providers, who in turn will resell or cross-sell these services to their own consumers. This is a common scenario in telco or SaaS world, where multiple providers are offering combined or derivative services to their consumers.

![P2P Kube Bind Diagram](/diagrams/kube-to-kube-provider.svg)

In this case, because we use Kubernetes clusters on both sides, **kube-bind** can be used to establish the relationship between the two providers. The level of isolation on the main provider is `namespace`.


---

## How This Fits Into Platform Mesh

The above flows illustrate how **Provider to Consumer** interactions are standardized in the Platform Mesh:

* **Providers** expose declarative APIs using [**APIExports**](../overview/control-planes.md).
* **Consumers** bind to those APIs using **APIBindings**, gaining seamless access through the [**Account Model**](../overview/account-model.md).
* [**Control planes**](../overview/control-planes.md) reconcile declarative manifests into real-world capabilities.
* **Operators and orchestration tools** (kube-bind, KRO, multicluster-runtime) implement automation across boundaries.

This creates a secure, flexible, and decoupled ecosystem where services can be:

* Exposed minimally.
* Discovered and consumed declaratively.
* Composed across organizational or cluster boundaries.
* Governed through the [**Account Model**](../overview/account-model.md) and [**Managed Service Provider pattern**](../overview/design-decision.md).

Ultimately, Platform Mesh provides the **P2C fabric** for multi-team, multi-cluster, and multi-organization service interactions.
