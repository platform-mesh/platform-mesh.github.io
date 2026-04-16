# MongoDB Provider Example

This guide walks through building a Platform Mesh provider using [multi-cluster-runtime](/overview/multi-cluster-runtime) -- the advanced integration path for when [api-syncagent](/overview/api-syncagent) is not sufficient. The example uses the MongoDB Community Operator and a custom Go controller to sync MongoDB resources between kcp workspaces and a downstream Kubernetes cluster.

The full source code is available at [`platform-mesh/example-mongodb-multiclusterruntime`](https://github.com/platform-mesh/example-mongodb-multiclusterruntime) on GitHub.

::: warning Intentionally Minimal
This example is intentionally minimal and does not handle object collisions or related resources. Production implementations would need additional logic for conflict resolution, finalizer management, error recovery, and multi-namespace support.
:::

## Why multi-cluster-runtime for MongoDB?

Most providers should start with [api-syncagent](/overview/api-syncagent), which handles bidirectional synchronization through YAML configuration alone. The MongoDB example uses multi-cluster-runtime instead because it demonstrates a class of integration where you need more control:

- **Complex lifecycle management** -- the MongoDB Community Operator has its own reconciliation stages (pending, running, failed) that benefit from custom status mapping rather than generic status sync.
- **Full control over sync logic** -- the developer decides exactly which fields are synced, how they are transformed, and when status is reported back.
- **Works for any API type** -- this pattern is not limited to CRDs. It works equally well with aggregated API servers and custom API servers that api-syncagent cannot publish.
- **Compile-time safety** -- the sync logic is Go code, giving you type checking, IDE support, and the full Go testing ecosystem.

### Comparison with the HttpBin Approach

The [HttpBin example](/guides/httpbin-example) uses api-syncagent: you configure `PublishedResource` objects in YAML, and the agent handles schema creation, sync, and status feedback automatically. The MongoDB example takes the opposite approach: you hand-craft the API schema, write the reconciler in Go, and control every step of the data flow.

Both paths produce the same result from the consumer's perspective -- a Kubernetes API available through an [APIBinding](/overview/api-export-binding) in their workspace. The difference is in how the provider builds and operates the integration.

## Architecture

The architecture has three components communicating through two connections:

```mermaid
flowchart TB
    subgraph kcp["kcp"]
        direction TB
        ARS["APIResourceSchema<br>(MongoDB)"]
        AE["APIExport<br>(mongodb-provider)"]
        AE --> ARS

        subgraph cw1["Consumer Workspace A"]
            AB1["APIBinding"]
            MDB1["MongoDB<br>(desired state)"]
        end

        subgraph cw2["Consumer Workspace B"]
            AB2["APIBinding"]
            MDB2["MongoDB<br>(desired state)"]
        end

        AB1 -.-> AE
        AB2 -.-> AE
    end

    subgraph controller["Custom Controller"]
        MCR["multi-cluster-runtime<br>+ kcp apiexport provider"]
    end

    subgraph downstream["Downstream Kubernetes Cluster"]
        OP["MongoDB Community<br>Operator"]
        MDBC1["MongoDBCommunity<br>(Workspace A)"]
        MDBC2["MongoDBCommunity<br>(Workspace B)"]
        OP --> MDBC1
        OP --> MDBC2
    end

    MCR -- "watches all bound<br>workspaces via<br>virtual workspace" --> AE
    MCR -- "creates/updates<br>MongoDBCommunity" --> downstream
    downstream -- "status feedback" --> MCR
    MCR -- "syncs status back<br>to consumer" --> kcp

    style kcp fill:none,stroke:#1a56db,stroke-width:3px,color:inherit
    style controller fill:none,stroke:#7c3aed,stroke-width:3px,color:inherit
    style downstream fill:none,stroke:#10b981,stroke-width:3px,color:inherit
    style cw1 fill:none,stroke:#3b82f6,stroke-width:3px,color:inherit
    style cw2 fill:none,stroke:#3b82f6,stroke-width:3px,color:inherit

    linkStyle 0,1 stroke:#868e96,stroke-width:3px
    linkStyle 2,3 stroke:#868e96,stroke-width:3px
    linkStyle 4,5 stroke:#868e96,stroke-width:3px
    linkStyle 6 stroke:#4dabf7,stroke-width:3px
    linkStyle 7 stroke:#4dabf7,stroke-width:3px
    linkStyle 8 stroke:#69db7c,stroke-width:3px
    linkStyle 9 stroke:#69db7c,stroke-width:3px
```

**kcp** holds the APIExport, the APIResourceSchema that defines the MongoDB API shape, and all the consumer workspaces that bind to it. Consumers create MongoDB resources in their own workspaces -- they never touch the downstream cluster directly.

**The custom controller** uses multi-cluster-runtime with the kcp `apiexport` provider. The provider discovers all consumer workspaces that have an APIBinding to the MongoDB APIExport and presents them as a unified stream of events. The controller connects to both kcp (for watching consumer resources) and the downstream cluster (for managing actual MongoDB instances).

**The downstream Kubernetes cluster** runs the MongoDB Community Operator, which handles the real work of provisioning and managing MongoDB instances. The custom controller creates `MongoDBCommunity` objects here and reports their status back to kcp.

## Defining the API in kcp

Unlike api-syncagent -- where the agent automatically creates `APIResourceSchema` objects from CRDs on the service cluster -- with multi-cluster-runtime the developer hand-crafts both the schema and the export. This gives full control over what the consumer API looks like, independent of what the downstream CRD looks like.

### APIResourceSchema

The `APIResourceSchema` defines the API shape as consumers will see it. It is similar to a CRD spec but does not automatically serve an API -- it must be referenced by an APIExport.

```yaml
apiVersion: apis.kcp.io/v1alpha1
kind: APIResourceSchema
metadata:
  name: v1.mongodbcommunity.mongodbcommunity.mongodb.com
spec:
  group: mongodbcommunity.mongodb.com
  names:
    kind: MongoDBCommunity
    listKind: MongoDBCommunityList
    plural: mongodbcommunity
    singular: mongodbcommunity
  scope: Namespaced
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                members:
                  type: integer
                type:
                  type: string
                  enum:
                    - ReplicaSet
                version:
                  type: string
                security:
                  type: object
                  properties:
                    authentication:
                      type: object
                      properties:
                        modes:
                          type: array
                          items:
                            type: string
                users:
                  type: array
                  items:
                    type: object
                    properties:
                      name:
                        type: string
                      db:
                        type: string
                      passwordSecretRef:
                        type: object
                        properties:
                          name:
                            type: string
                      roles:
                        type: array
                        items:
                          type: object
                          properties:
                            name:
                              type: string
                            db:
                              type: string
            status:
              type: object
              properties:
                phase:
                  type: string
                version:
                  type: string
      subresources:
        status: {}
```

Key points about this schema:

- **The `metadata.name` follows kcp convention:** `<version-prefix>.<plural>.<group>`. The version prefix prevents collisions when schemas evolve (since APIResourceSchema specs are immutable).
- **The schema is a subset of the downstream CRD.** You do not need to expose every field the MongoDB Community Operator supports. Expose only what consumers should configure.
- **The `status` subresource is declared** so that the controller can update status independently of spec.

### APIExport

The `APIExport` references the schema and makes it available for binding:

```yaml
apiVersion: apis.kcp.io/v1alpha1
kind: APIExport
metadata:
  name: mongodb-provider
spec:
  resources:
  - group: mongodbcommunity.mongodb.com
    name: mongodbcommunity
    schema: v1.mongodbcommunity.mongodbcommunity.mongodb.com
    storage:
      crd: {}
```

Once created in a provider workspace, any consumer workspace can create an [APIBinding](/overview/api-export-binding) referencing this export to gain access to the MongoDB API. The APIExport also gets an automatically generated identity (an SHA-256 hash) that uniquely identifies this provider's MongoDB API, preventing conflicts with other providers who might export the same group/resource/version combination.

## The Custom Controller

The controller is a standard Go program built on `controller-runtime`, extended with multi-cluster-runtime packages. The key imports come from three repositories:

- [`kubernetes-sigs/multicluster-runtime`](https://github.com/kubernetes-sigs/multicluster-runtime) -- the multi-cluster manager, builder, and reconcile types
- [`kcp-dev/multicluster-provider`](https://github.com/kcp-dev/multicluster-provider) -- the kcp `apiexport` provider that discovers bound consumer workspaces
- The downstream cluster's Go types for `MongoDBCommunity` objects

### Setting Up the Multi-Cluster Manager

The entry point creates a multi-cluster manager using the kcp `apiexport` provider. This provider connects to the APIExport's virtual workspace endpoint and discovers all consumer workspaces that have created an APIBinding to the MongoDB APIExport.

```go
import (
    "github.com/kcp-dev/multicluster-provider/apiexport"
    mcmanager "sigs.k8s.io/multicluster-runtime/pkg/manager"
    "k8s.io/client-go/tools/clientcmd"
    "sigs.k8s.io/controller-runtime/pkg/manager"
)

func main() {
    // Build a rest.Config from the kcp kubeconfig
    kcpConfig, err := clientcmd.BuildConfigFromFlags("", kcpKubeconfig)
    if err != nil {
        log.Fatal(err)
    }

    // The kcp apiexport provider discovers consumer workspaces
    // that have bound to the MongoDB APIExport
    provider, err := apiexport.New(kcpConfig, apiexport.Options{})
    if err != nil {
        log.Fatal(err)
    }

    // Create a multi-cluster manager backed by this provider
    // targetKubeconfig points to the downstream cluster
    mgr, err := mcmanager.New(targetConfig, provider, manager.Options{})
    if err != nil {
        log.Fatal(err)
    }

    // Register the controller (see next section)
    // ...

    // Start the provider and manager
    ctx := ctrl.SetupSignalHandler()
    go provider.Run(ctx, mgr)
    mgr.Start(ctx)
}
```

The manager takes two kubeconfigs: one for kcp (passed to the provider) and one for the downstream target cluster (used as the manager's "home" config). The provider runs in its own goroutine, continuously discovering and reporting changes to the set of bound consumer workspaces.

### Registering the Controller

Controller registration follows the familiar `ControllerManagedBy` pattern from controller-runtime, using the multi-cluster variants:

```go
import (
    mcbuilder "sigs.k8s.io/multicluster-runtime/pkg/builder"
    mcreconcile "sigs.k8s.io/multicluster-runtime/pkg/reconcile"
)

err = mcbuilder.ControllerManagedBy(mgr).
    Named("mongodb-sync").
    For(&mongodbv1.MongoDBCommunity{}).
    Complete(mcreconcile.Func(reconcileMongoDB))
```

The `For(&mongodbv1.MongoDBCommunity{})` call tells the controller to watch for `MongoDBCommunity` resources across all consumer workspaces discovered by the provider. When a consumer creates, updates, or deletes a MongoDB resource in their workspace, the controller receives a reconcile event.

### The Reconcile Loop

The reconcile function is where the sync logic lives. Each invocation receives an `mcreconcile.Request` that includes a `ClusterName` field identifying which consumer workspace triggered the event.

```go
func reconcileMongoDB(
    ctx context.Context,
    req mcreconcile.Request,
) (ctrl.Result, error) {
    log := ctrl.LoggerFrom(ctx).WithValues(
        "cluster", req.ClusterName,
        "name", req.Name,
        "namespace", req.Namespace,
    )

    // 1. Get a client scoped to the consumer's kcp workspace
    kcpCluster, err := mgr.GetCluster(ctx, req.ClusterName)
    if err != nil {
        return ctrl.Result{}, err
    }
    kcpClient := kcpCluster.GetClient()

    // 2. Fetch the MongoDB resource from the consumer workspace
    var kcpMongo mongodbv1.MongoDBCommunity
    err = kcpClient.Get(ctx, req.NamespacedName, &kcpMongo)
    if err != nil {
        if apierrors.IsNotFound(err) {
            // Resource deleted in kcp -- clean up downstream
            return handleDeletion(ctx, req)
        }
        return ctrl.Result{}, err
    }

    // 3. Build the downstream MongoDBCommunity object
    downstreamMongo := &mongodbv1.MongoDBCommunity{
        ObjectMeta: metav1.ObjectMeta{
            Name:      req.Name,
            Namespace: req.Namespace,
        },
        Spec: kcpMongo.Spec,
    }

    // 4. Create or update on the downstream cluster
    targetClient := mgr.GetClient() // client for the downstream cluster
    _, err = controllerutil.CreateOrUpdate(ctx, targetClient, downstreamMongo,
        func() error {
            downstreamMongo.Spec = kcpMongo.Spec
            return nil
        })
    if err != nil {
        return ctrl.Result{}, err
    }

    // 5. Sync status back to kcp
    kcpMongo.Status.Phase = downstreamMongo.Status.Phase
    kcpMongo.Status.Version = downstreamMongo.Status.Version
    err = kcpClient.Status().Update(ctx, &kcpMongo)
    if err != nil {
        return ctrl.Result{}, err
    }

    log.Info("Reconciled MongoDB",
        "phase", downstreamMongo.Status.Phase,
        "version", downstreamMongo.Status.Version,
    )
    return ctrl.Result{}, nil
}
```

The key steps in each reconciliation cycle:

1. **Get a workspace-scoped client** using <code v-pre>mgr.GetCluster(ctx, req.ClusterName)</code>. The `ClusterName` maps to the logical cluster in kcp that represents the consumer workspace.
2. **Read the desired state** from the consumer's workspace in kcp.
3. **Build the downstream object.** In this minimal example, the spec is copied directly. A production controller might transform fields, inject defaults, or map the consumer-facing API to a different downstream shape.
4. **Create or update** the `MongoDBCommunity` resource on the downstream cluster where the MongoDB Community Operator will reconcile it into a running database.
5. **Sync status back** to the consumer workspace. The consumer sees the `phase` and `version` fields update as the database progresses through its lifecycle.

### Deletion Handling

When a consumer deletes a MongoDB resource in their kcp workspace, the controller receives a reconcile event where the `Get` call returns `NotFound`. At that point, the controller removes the corresponding `MongoDBCommunity` object from the downstream cluster:

```go
func handleDeletion(
    ctx context.Context,
    req mcreconcile.Request,
) (ctrl.Result, error) {
    targetClient := mgr.GetClient()

    downstreamMongo := &mongodbv1.MongoDBCommunity{
        ObjectMeta: metav1.ObjectMeta{
            Name:      req.Name,
            Namespace: req.Namespace,
        },
    }

    err := targetClient.Delete(ctx, downstreamMongo)
    if err != nil && !apierrors.IsNotFound(err) {
        return ctrl.Result{}, err
    }

    return ctrl.Result{}, nil
}
```

A production implementation would use finalizers to ensure that the downstream resource is fully cleaned up before the kcp resource is removed. The minimal example omits this for clarity.

## Running the Example

### Prerequisites

| Requirement | Purpose |
|-------------|---------|
| A running kcp instance | Hosts the APIExport and consumer workspaces |
| MongoDB APIExport and APIResourceSchema applied to kcp | Defines the provider API (YAML shown above) |
| A Kubernetes cluster with the MongoDB Community Operator installed | Runs the actual MongoDB instances |
| Go toolchain (1.21+) | Builds the custom controller |
| Two kubeconfig files | One for kcp, one for the downstream cluster |

### Apply the API Definitions

First, apply the `APIResourceSchema` and `APIExport` to your provider workspace in kcp. The sample files are in the `sample/` directory of the repository:

```bash
KUBECONFIG=kcp.kubeconfig kubectl apply -f sample/mongo-api.yaml
```

### Build and Run the Controller

```bash
# Clone the repository
git clone https://github.com/platform-mesh/example-mongodb-multiclusterruntime.git
cd example-mongodb-multiclusterruntime

# Build
go build -o mongodb-controller .

# Run
./mongodb-controller \
  --kcp-kubeconfig=/path/to/kcp.kubeconfig \
  --target-kubeconfig=/path/to/downstream.kubeconfig
```

The controller connects to both kcp and the downstream cluster. It begins watching the APIExport's virtual workspace for MongoDB resources created by consumers and syncs them to the downstream cluster.

### Verify from a Consumer Workspace

In a consumer workspace that has an APIBinding to `mongodb-provider`, create a MongoDB resource:

```yaml
apiVersion: mongodbcommunity.mongodb.com/v1
kind: MongoDBCommunity
metadata:
  name: my-database
  namespace: default
spec:
  members: 3
  type: ReplicaSet
  version: "6.0.5"
  security:
    authentication:
      modes:
        - SCRAM
  users:
    - name: admin
      db: admin
      passwordSecretRef:
        name: admin-password
      roles:
        - name: clusterAdmin
          db: admin
        - name: userAdminAnyDatabase
          db: admin
```

The controller detects this resource, creates a corresponding `MongoDBCommunity` object on the downstream cluster, and the MongoDB Community Operator provisions a replica set. As the operator updates the status on the downstream cluster, the controller syncs the `phase` and `version` fields back to the consumer's workspace.

## Comparison with HttpBin Approach

| Aspect | HttpBin (api-syncagent) | MongoDB (multi-cluster-runtime) |
|--------|------------------------|-------------------------------|
| **Integration mechanism** | api-syncagent (generic agent) | Custom Go controller |
| **Sync logic** | Handled by the agent automatically | Developer writes the reconciler |
| **API definition** | CRD on service cluster, auto-converted via `PublishedResource` | Hand-crafted `APIResourceSchema` + `APIExport` |
| **Code required** | YAML configuration only | Go code |
| **Schema control** | Projection (rename kind, group, scope) | Full control over API shape |
| **Status sync** | Automatic (all status subresource fields) | Developer selects which fields to sync |
| **Flexibility** | Moderate | Full control |
| **Effort** | Low to medium | High |
| **Best for** | Standard CRD-based services | Complex lifecycle, non-CRD APIs, custom orchestration |

Both paths produce the same result for consumers: a Kubernetes API available through an APIBinding in their workspace. The provider chooses based on how much control they need.

## When to Choose This Pattern

Reach for multi-cluster-runtime when one or more of the following apply:

- **You need custom transformation logic during sync.** The consumer-facing API shape should differ significantly from the downstream CRD, or fields need to be computed, merged, or split during synchronization.
- **Your service has complex lifecycle stages.** The downstream operator's status model does not map cleanly to what consumers should see, and you need to interpret or aggregate status before reporting it.
- **You are integrating non-CRD API extensions.** The service cluster exposes APIs through aggregated API servers or custom API servers that api-syncagent cannot discover or publish.
- **You need to coordinate across multiple clusters simultaneously.** The controller must read from or write to more than one downstream cluster as part of a single reconciliation -- for example, provisioning resources across regions.
- **You want compile-time safety and Go tooling for your sync logic.** Complex sync rules expressed as Go code are easier to test, debug, and maintain than equivalent YAML-based mutations.

If none of these apply, start with [api-syncagent](/overview/api-syncagent). You can always migrate to multi-cluster-runtime later if your requirements evolve.

## What's Next

- [multi-cluster-runtime](/overview/multi-cluster-runtime) -- understand the library architecture, providers, and reconciliation patterns
- [APIExport and APIBinding](/overview/api-export-binding) -- the cross-workspace sharing mechanism that makes the consumer API work
- [Provider Quick Start](/guides/provider-quick-start) -- try the simpler api-syncagent path first
- [HttpBin Provider Example](/guides/httpbin-example) -- see the api-syncagent integration in action
- [Service Providers](/overview/providers) -- the three integration paths and how to choose between them
- [`example-mongodb-multiclusterruntime` on GitHub](https://github.com/platform-mesh/example-mongodb-multiclusterruntime) -- the full source code for this example
