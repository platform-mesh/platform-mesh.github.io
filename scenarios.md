---

outline: deep
---

# Scenarios

This section demonstrates how the **Platform Mesh** enables real-world service interactions across clusters, organizations, and teams. Each scenario showcases practical implementations using the [Account Model](../overview/account-model.md), [Control Planes](../overview/control-planes.md), and ecosystem tools, like **kube-bind**, **API-Syncagent**, **KRO**, and **multicluster-runtime**.

## Available Scenarios

We currently cover few high level scenarios:

* P2C (Provider to Consumer) - Service exchange between service provider and consumer teams, where the provider offers services to internal teams or external customers
* P2P (Provider to Provider) - Service exchange between independent organizations/providers, where they act as a reseller or consume other provider services, to offer a combined or derivative service to their consumers.
* (Soon) C2C (Consumer to Consumer) - Service exchange between inside the teams itself. This is a commonly known as DigitalTwin scenario, or service extending to external internal consumers.
* (Soon) PlatformMesh to PlatformMesh - Service exchange between two independent Platform Mesh installations, where they act as a reseller or consume other provider services, to offer a combined or derivative service to their consumers. While this is very similar to P2P, this scenario will cover more complex use-cases, where both sides are Platform Mesh enabled.

Every of these scenarios has hizgh level description, and multiple implementations patterns. While some of these patterns are overlapping between scenarios, we decided to duplicate them, to make it easier to follow the scenario end-to-end.

### [Provider to Consumer (P2C)](./scenarios/provider-to-consumer.md)

### [Provider to Provider (P2P)](./scenarios/provider-to-provider.md)

#### 🛠️ Advanced Orchestration
Implementation patterns using:
- **KRO (Kubernetes Resource Orchestrator)** for resource graph management
- **multicluster-runtime** for custom operator development
- **kube-bind** for seamless API binding across boundaries

---

## Key Benefits

✅ **Minimal Exposure** - Providers expose only necessary APIs  
✅ **Declarative Consumption** - Consumers discover and bind services automatically  
✅ **Secure by Design** - OIDC authentication and contract-driven interactions  
✅ **Multi-Boundary** - Works across clusters, organizations, and teams  
✅ **Tool Ecosystem** - Integrates with existing Kubernetes tooling

## Related Concepts

- [Account Model](../overview/account-model.md) - How identity and access work in Platform Mesh
- [Control Planes](../overview/control-planes.md) - Architecture of distributed control plane management  
- [Design Decisions](../overview/design-decision.md) - Managed Service Provider patterns
- [kube-bind](https://kube-bind.io) - Tool for binding Kubernetes APIs across clusters
- [KRO (Kubernetes Resource Orchestrator)](https://github.com/kubernetes-sigs/kro) - Tools for abstracting and managing Kubernetes resources
- [multicluster-runtime](https://github.com/kubernetes-sigs/multicluster-runtime) - Framework for managing multi-cluster Kubernetes applications using Controller-Runtime operator patterns.