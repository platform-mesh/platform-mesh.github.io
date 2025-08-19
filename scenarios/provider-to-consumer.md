---
outline: deep
---
# Provider to Consumer (P2C)

## Kube to Kube

### Problem Description

In a provider to consumer setting a Provider wants to transfer technical
information in a secure way to a Consumer for a Service.

The Provider wants to expose as little information as needed while
giving the Consumer the ability to automatically consume instances of
the Service and retrieve the required information to interact with the
Service.

### Solution

The Provider can offer a kube-bind backend, allowing the Consumer to
authenticate with OIDC and to bind the CRD of the Service into their
Cluster - or any KRM API.

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

## Kube to KCP to Kube

### Problem Description

The problem is specified on the example of an Internal Developer
Platform (IDP). Teams can be Providers and Consumer of Services.

The Database Team (DB) offers a Postgres Service.
The Observability Team (Obs) wants to use the Postgres Service as the
database for their Elastic service.
The Webshop Team (WS) wants to use the Postgres Services as the database
for the Webshops they maintain for their customers and the Elastic
Service for logging and metrics.

This diagram shows the premise of the problem:

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

Not pictures is the teams using e.g. GitOps to manage the components of
their services, which are running in the respective clusters.

### Tools Solution

This solution focuses on using commonly available tools to manage and
apply the manifests.

The Obersvability Team uses KRO (Kubernetes Resource Orchestrator) to
instantiate their Elastic Service, including the Postgres Instance from
the Database Team.

Since KRO works only on one Cluster they are using kube-bind to pull the
CRD of the Postgres Services from the APIBinding they created in their
workspace to their compute cluster.

The postgres instance for an elastic service is created as part of the
KRO Resource Graph Definition, which is mirrored back to KCP by
kube-bind.

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

The Webshop team uses their own operator to manage their Webshop, which
they wrote using multicluster-runtime, allowing them to interact with
many clusters at once.

The Webshop team maintains definitions of the Webshop instances in their
KCP Workspace and are deploying resources based on these definitions
where they are needed.

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

The operator also provides the information from the database and elastic
service to the webshop instance.
