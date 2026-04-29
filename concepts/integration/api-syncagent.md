# api-syncagent

api-syncagent is the low-effort integration path for providers that already expose Kubernetes CRDs.

## Platform Mesh role

api-syncagent connects a provider service cluster to kcp. It publishes CRD-based provider APIs through APIExports and synchronizes consumer-created resources to the provider service cluster.

```mermaid
flowchart LR
    Consumer["Consumer workspace<br>kcp"]
    Export["Provider APIExport<br>kcp"]
    Agent["api-syncagent"]
    Cluster["Service cluster"]
    Operator["Provider operator"]

    Consumer -- "APIBinding" --> Export
    Export <--> Agent
    Agent <--> Cluster
    Operator --> Cluster
```

## Data direction

Consumer desired state flows from kcp to the service cluster. Provider status flows from the service cluster back to kcp.

```mermaid
flowchart LR
    KcpSpec["kcp spec"]
    ServiceSpec["service cluster spec"]
    ServiceStatus["service cluster status"]
    KcpStatus["kcp status"]

    KcpSpec --> ServiceSpec
    ServiceStatus --> KcpStatus
```

## When to use it

Use api-syncagent when:

- the service already exposes CRDs
- synchronization can follow spec-down/status-up
- the provider wants a configuration-driven integration
- related resources such as Secrets or ConfigMaps need to be synchronized

Use [multi-cluster-runtime](./multi-cluster-runtime.md) when the provider needs full control over synchronization logic.

## How api-syncagent works

A provider using api-syncagent has four moving parts across the kcp control plane and the provider service cluster.

| Component | Runs on | Purpose |
| --- | --- | --- |
| APIExport | kcp provider workspace | Publishes the API for consumers to bind. |
| api-syncagent | Provider service cluster | Bridges kcp and the service cluster and syncs resources bidirectionally. |
| Provider operator | Provider service cluster | Reconciles synced resources into the actual workload. |
| PublishedResource | Provider service cluster | Tells api-syncagent which CRD to publish to kcp. |

Consumers interact only with their kcp workspace. They do not access the provider service cluster directly.

```mermaid
flowchart LR
    subgraph kcp["kcp control plane"]
        direction TB
        pw["Provider workspace"]
        ae["APIExport<br/><i>orchestrate.platform-mesh.io</i>"]
        vw["Virtual workspace<br/><i>APIExport endpoint</i>"]
        cw["Consumer workspace"]
        ab["APIBinding"]

        pw --- ae
        ae --- vw
        cw --- ab
        ab -.binds to.-> ae
    end

    subgraph sc["Provider service cluster"]
        direction TB
        sa["api-syncagent"]
        pr["PublishedResource"]
        ctrl["Provider operator"]
        crd["Provider CRDs"]
        pods["Workload pods +<br/>Service + HTTPRoute"]

        sa --- pr
        ctrl --- crd
        crd --> pods
    end

    sa <-- "spec down / status up" --> vw
    sa -- "reads" --> pr

    style kcp fill:none,stroke:#1a56db,stroke-width:3px,color:inherit
    style sc fill:none,stroke:#7c3aed,stroke-width:3px,color:inherit

    linkStyle 0,1,2,3,4,5,6 stroke:#f59f00,stroke-width:3px
    linkStyle 7 stroke:#4dabf7,stroke-width:3px
    linkStyle 8 stroke:#f59f00,stroke-width:3px
```

## PublishedResource

The provider configures api-syncagent with a `PublishedResource`. It says which service-cluster CRD should be exposed through kcp.

api-syncagent then:

1. Converts the CRD into an APIResourceSchema in kcp.
2. Adds the schema to the provider APIExport.
3. Watches the APIExport virtual workspace for consumer resources.
4. Syncs consumer spec down to the service cluster.
5. Syncs provider status back to the consumer workspace.

The schema name in kcp is versioned and immutable. If the CRD changes, api-syncagent creates a new APIResourceSchema and updates the export.

api-syncagent labels synced service-cluster objects with the source workspace and object identity. Operators can use those labels to derive names and DNS entries that avoid collisions across consumer workspaces.

## Request lifecycle

The HttpBin demo provider in the local setup illustrates the request lifecycle end to end. The same flow applies to any api-syncagent provider — the consumer creates a resource in kcp, api-syncagent projects it to the service cluster, the operator reconciles it into a workload, and status flows back.

```mermaid
sequenceDiagram
    participant Consumer
    participant CW as Consumer workspace
    participant VW as APIExport virtual workspace
    participant Agent as api-syncagent
    participant SC as Provider service cluster
    participant Op as Provider operator

    Consumer->>CW: Create resource
    Note over CW: APIBinding routes the resource<br/>to APIExport storage

    Agent->>VW: Watch detects resource
    Agent->>SC: Create local resource
    Note over SC: Labels encode workspace origin

    Op->>SC: Reconcile workload
    Note over SC: Pods, Service, HTTPRoute start

    Op->>SC: Update status
    Agent->>VW: Sync status back

    Consumer->>CW: Read status
```

The important direction is: spec flows from kcp to the service cluster, and status flows from the service cluster back to kcp.

## Production considerations

In production, the service cluster is owned by the provider team. The provider team runs the operator, CRDs, api-syncagent, and workloads on its own infrastructure.

api-syncagent connects outward to the kcp API endpoint. That means:

- the provider cluster needs outbound HTTPS access to kcp
- kcp does not need inbound network access to the provider cluster
- credentials are stored as a kubeconfig Secret on the provider cluster

Each api-syncagent instance handles one APIExport. A provider with multiple service APIs normally runs multiple agents, each with its own PublishedResource set and APIExport target.

## Extension points

Common ways to extend an api-syncagent provider include:

- adding fields to the published CRD, such as replicas or region placement
- using PublishedResource projection to rename the exposed API shape
- using PublishedResource mutation to inject provider defaults
- declaring related resources, such as Secrets or ConfigMaps, when the service needs to return credentials to consumers

## Upstream documentation

api-syncagent owns the detailed configuration and object semantics. Use the upstream docs for installation, PublishedResource details, endpoint slices, RBAC, and troubleshooting:

- [api-syncagent documentation](https://docs.kcp.io/api-syncagent/v0.5/)
- [api-syncagent getting started](https://docs.kcp.io/api-syncagent/main/getting-started/)

## Related

- [Provider quick start](/tutorials/provider-quick-start.md) — runnable tutorial that builds an api-syncagent provider end to end.
- [multi-cluster-runtime](./multi-cluster-runtime.md) — the alternative path for custom controller logic.
- [Integration paths](../integration-paths.md)
- [api-syncagent component reference](/reference/components/api-syncagent.md)
- [API sharing](../api-sharing.md)
