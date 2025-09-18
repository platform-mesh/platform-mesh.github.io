---

outline: deep
---
# Provider to Consumer (P2C)

This section describes high-level scenarios of how cross-provider service exchange can be achieved using **Platform Mesh**.

### Problem Description

In a direct **provider to consumer** setting, a provider wants to transfer technical information in a secure way to a consumer for a given service. In this scenario platform mesh is not required, but this pattern can allow to bootstrap more complex scenarios, where teams could want to establish an internal relationship between the clusters.

* The **Provider** must expose as little internal detail as possible.
* The **Consumer** should be able to automatically discover and consume instances of the service.
* Both parties must rely on a secure, declarative, contract-driven interaction.

![P2P Kube Bind Diagram](/diagrams/copy-original.svg)

To make diagrams simplier, we are using the following notation, where dashed lines represents copy of the resources, and solid lines represents source of truth or object source.

---

## Kube (provider) to n*Kube (provider)

In this scenarion provider, owning kubernetes clusters, wants to cross-sell or resell their services to other providers, who in turn will resell or cross-sell these services to their own consumers. This is a common scenario in telco or SaaS world, where multiple providers are offering combined or derivative services to their consumers.

![P2P Kube Bind Diagram](/diagrams/kube-to-kube-provider.svg)

In this case, because we use Kubernetes clusters on both sides, **kube-bind** can be used to establish the relationship between the two providers. And the level of isolation on the main providers is `namespace`.

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
