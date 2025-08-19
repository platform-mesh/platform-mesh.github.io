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

## KCP to Kube

### Problem Description

TODO

### Solution

api-syncagent is run by the provider to export offerings in the KCP workspace.
Consumers bind the APIExport and use kube-bind the pull the resulting CRD and push instances.

kube-bind can be a kube-bind backend in KCP or konnector run by the consumers.

```mermaid
flowchart LR

    subgraph PC1[Provider Compute 1]
        providerCRD1([CRD1])
        providerCRD2([CRD2])
        instancep1([Instance])
    end


    providerCRD1 --> |api-syncagent| providerwsCRD1
    providerCRD2 --> |api-syncagent| providerwsCRD2

    subgraph KCP
        subgraph PWS[Provider WS]
            providerwsCRD1([CRD1])
            providerwsCRD2([CRD2])
        end

        subgraph CAWS[Consumer A WS]
            consumerawsCRD1([CRD1])
        end

        providerwsCRD1 --> |APIBinding| consumerawsCRD1

        subgraph CBWS[Consumer B WS]
            consumerbwsCRD2([CRD2])
            instancews1([Instance])
        end

        providerwsCRD2 --> |APIBinding| consumerbwsCRD2
        instancews1 --> |VW| instancep1
    end

    consumerawsCRD1 --> |kube-bind| consumeraCRD1

    subgraph CA[Consumer A]
        consumeraCRD1([CRD1])
    end

    consumerbwsCRD2 --> |kube-bind| consumerbCRD2
    instanceb1 --> |kube-bind| instancews1

    subgraph CB[Cosumer B]
        consumerbCRD2([CRD2])
        instanceb1([Instnce])
    end
```

## Internal Development Platform

### Problem Description

TODO

### Solution

KCP used as an internal developer platform with teams offering services that in turn utilize other services on the IDP.

Here the Observability team is offering Elastic instances. For Elastic they need a relational database and chose Postgres, which the Database team offers.

```mermaid
flowchart TD

subgraph KCP
    subgraph DatabaseWS[Database Team Workspace]
        PGExport[Postgres APIExport]
        subgraph PGExportVW[Postgres VW]
            PGInstanceDbWs
        end
    end

    PGExport -.-> PGBinding
    PGInstanceObsWs --> |VW| PGInstanceDbWs

    subgraph ObservabilityWS[Observability Team Workspace]
        PGBinding[Postgres APIBinding]
        PGInstanceObsWs[Postgres Instance]

        ELKExport[Elastic APIExport]
        subgraph ELKExportVW[Elastic VW]
            ELKInstanceProvider[ELK Instance]
        end
    end

    ELKExport -.-> ELKBinding
    ELKInstance --> ELKInstanceProvider

    subgraph ConsumerWs[Consumer]
        ELKBinding[Elastic APIBinding]
        ELKInstance[ELK Instance]
        ELKBinding -.-> ELKInstance
    end
end

subgraph DBKube[Database Team Clusters]
    PGCRD[Postgres CRD]
    PGCRD -.-> |api-syncagent| PGExport

    PGInstanceKube[Postgres Instance]
end

PGInstanceDbWs -.-> |api-syncagent| PGInstanceKube

subgraph ObservabilityKube[Observability Team Clusters]
    ELKCRD[Elastic CRD]
    ELKCRD -.-> |api-syncagent| ELKExport

    ELKInstanceKube[Elastic Instance]
    ELKInstanceKube -.-> ElasticResource
    subgraph ElasticResource[Elastic Resources]
        PGInstanceObsKube[Postgres Instance]
    end

    PGCRDObs[Postgres CRD]
    PGCRDObs -.-> PGInstanceObsKube
end

ELKInstanceProvider -.-> |api-syncagent| ELKInstanceKube
PGBinding -.-> |kube-bind| PGCRDObs
PGInstanceObsKube --> |kube-bind| PGInstanceObsWs
```

