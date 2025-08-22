---

outline: deep
---
# Provider to Consumer (P2C)

This section describes high-level scenarios of how the **Platform Mesh** enables secure, declarative, and flexible **Provider to Consumer** (P2C) interactions across clusters, organizations, and teams. It builds on concepts such as the [**Account Model**](../overview/account-model.md), [**Control Planes**](../overview/control-planes.md), and [**Managed Service Provider Pattern**](../overview/design-decision.md) to unify service exchange.

## Kube to Kube

### Problem Description

In a direct **provider to consumer** setting, a provider wants to transfer technical information in a secure way to a consumer for a given service.

* The **Provider** must expose as little internal detail as possible.
* The **Consumer** should be able to automatically discover and consume instances of the service.
* Both parties must rely on a secure, declarative, contract-driven interaction.

### Solution

The provider can offer a **kube-bind backend**, allowing the consumer to:

* Authenticate with OIDC.
* Bind the service’s CRD (or any KRM API) into their own cluster.
* Automatically receive service instances and secrets.

```mermaid
flowchart TD

subgraph Provider
    origCRD[Service CRD]
    copyInstance[Service Instance]
    origSecret[Service Secret]
end

origCRD -.-> copyCRD
copyCRD -.-> consumerInstance
consumerInstance --> copyInstance
copyInstance -.-> origSecret
origSecret --> copySecret

subgraph Consumer
    copyCRD[Service CRD]
    consumerInstance[Service Instance]
    copySecret[Service Secret]
end
```

---

## Kube to KCP to Kube

### Problem Description

Within an **Internal Developer Platform (IDP)** setup, multiple teams act both as providers and consumers.

* **Database Team (DB)** offers a Postgres service.
* **Observability Team (Obs)** wants to consume Postgres for their Elastic service.
* **Webshop Team (WS)** wants to consume both Postgres and Elastic services for their applications.

This creates a mesh of dependencies where teams provide and consume services through shared contracts.

```mermaid
flowchart LR

subgraph KCP
    subgraph KCP_DB[root:team:database]
        PGExport[Postgres APIExport]
    end

    subgraph KCP_Obs[root:team:observability]
        PGBindingObs[Postgres APIBinding]
        ElasticExport[Elastic APIExport]
    end
    PGExport -.-> PGBindingObs

    subgraph KCP_WS[root:team:webshop]
        ElasticBinding[Elastic APIBinding]
        PGBindingWS[Postgres APIBinding]
    end
    PGExport -.-> PGBindingWS
    ElasticExport -.-> ElasticBinding
end

subgraph DBCompute[Database Compute Cluster]
    PGCRD[Postgres CRD]
    PGCRD -.-> |api-syncagent| PGExport
end

subgraph ObsCompute[Observability Compute Cluster]
    ElasticCRD[Elastic CRD]
    ElasticCRD -.-> |api-syncagent| ElasticExport
end

subgraph WSCompute[Workshop Compute Cluster]
    Webshop
end
```

Teams use GitOps and declarative manifests to manage components in their respective clusters.

### Tools Solution

The **Observability Team** leverages **KRO (Kubernetes Resource Orchestrator)** to:

* Instantiate Elastic services.
* Pull Postgres CRDs from their APIBinding using **kube-bind**.
* Define resource graphs that mirror Postgres instance requests back to KCP.

```mermaid
flowchart TD

subgraph KCP
    subgraph KCP_DB[root:team:database]
        PGExport[Postgres APIExport]
    end

    subgraph KCP_Obs[root:team:observability]
        ElasticExport[Elastic APIExport]
        PGBindingObs[Postgres APIBinding]
        PGInstanceObsWs[Obs Postgres Instance]
    end
    PGExport -.-> PGBindingObs
end

subgraph DBCompute[Database Compute Cluster]
    PGCRD[Postgres CRD]
    PGCRD -.-> |api-syncagent| PGExport
    PGInstanceObsReal[Obs Postgres Instance]
    PGInstanceObsWs --> PGInstanceObsReal
end

subgraph ObsCompute[Observability Compute Cluster]
    ElasticCRD[Elastic CRD]
    ElasticCRD -.-> |api-syncagent| ElasticExport

    PGCRDObs[Postgres CRD]
    PGBindingObs -.-> |kube-bind| PGCRDObs

    ElasticInstance
    ElasticCRD -.-> ElasticInstance

    PGInstanceObs[Obs Postgres Instance]
    ElasticInstance -.-> PGInstanceObs
    PGCRDObs -.-> PGInstanceObs

    PGInstanceObs --> |kube-bind| PGInstanceObsWs
end
```

### Operator Solution

The **Webshop Team** uses its own **operator** built with **multicluster-runtime**:

* Webshop definitions live in their KCP workspace.
* Operator deploys workloads across clusters.
* Operator consumes Postgres and Elastic bindings.

```mermaid
flowchart LR

subgraph KCP
    subgraph KCP_DB[root:team:database]
        PGExport[Postgres APIExport]
    end

    subgraph KCP_Obs[root:team:observability]
        ElasticExport[Elastic APIExport]
    end

    subgraph KCP_WS[root:team:webshop]
        ElasticBinding[Elastic APIBinding]
        PGBinding[Postgres APIBinding]

        WebshopCRD[Webshop CRD]
        WebshopInstance[Webshop Instance]
        WebshopCRD -.-> WebshopInstance
        WebshopInstanceDB[Webshop Instance PG]
        WebshopInstanceDB --> PGBinding
        WebshopInstanceElastic[Webshop Instance Elastic]
        WebshopInstanceElastic --> ElasticBinding
    end

    PGBinding -.-> PGExport
    ElasticBinding -.-> ElasticExport
end

subgraph WSCompute[Workshop Compute Cluster]
    WebshopOperator[Webshop Operator]
    Webshop
end
WebshopOperator -.-> WebshopInstance
WebshopOperator --> WebshopInstanceDB
WebshopOperator --> WebshopInstanceElastic
WebshopOperator --> Webshop
```

The operator ensures database and observability service data flows securely into webshop workloads.

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
