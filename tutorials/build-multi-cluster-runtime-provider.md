# Build a multi-cluster-runtime provider

This tutorial walks you through running a custom Go provider controller using multi-cluster-runtime instead of api-syncagent. You will publish a `MongoDBCommunity` API into kcp and use a custom controller to sync resources from consumer workspaces to a downstream Kubernetes cluster running the MongoDB Community Operator.

By the end of this tutorial, you will have:

- an APIResourceSchema and APIExport for the MongoDB API in a provider workspace
- a custom Go controller running locally that uses multi-cluster-runtime and the kcp APIExport provider
- a consumer workspace that binds the API and creates a MongoDB resource
- a downstream cluster reconciled by the controller, with status flowing back to the consumer

::: warning Development preview
The local setup is under active development. Commands and component versions may change.
:::

## Prerequisites

Before you begin, make sure you have:

- a local Platform Mesh setup from [Set up Platform Mesh locally](/how-to-guides/set-up-platform-mesh-locally.md)
- `kubectl` with the `kubectl-kcp` plugin installed
- Go 1.22+ installed
- Git installed
- a downstream Kubernetes cluster with the [MongoDB Community Operator](https://www.mongodb.com/docs/kubernetes-operator/current/community-operator/) deployed

For background on when this path applies, see [multi-cluster-runtime](/concepts/integration/multi-cluster-runtime.md).

## What you will build

Consumers create `MongoDBCommunity` resources in their kcp workspace. A custom Go controller using multi-cluster-runtime watches all bound consumer workspaces, projects each resource onto the downstream cluster, and syncs selected status fields back.

The full source code is available in [`platform-mesh/example-mongodb-multiclusterruntime`](https://github.com/platform-mesh/example-mongodb-multiclusterruntime).

::: warning Minimal example
This example is intentionally small. It does not cover object collisions, finalizer safety, related resources, multi-namespace placement, or production-grade error recovery.
:::

## Apply the API to the provider workspace

Apply the APIResourceSchema and APIExport defined in the example repository:

```bash
KUBECONFIG=kcp.kubeconfig kubectl apply -f sample/mongo-api.yaml
```

This creates the `mongodb-provider` APIExport that consumer workspaces will bind to.

## Build and run the controller

Clone the example and build the controller:

```bash
git clone https://github.com/platform-mesh/example-mongodb-multiclusterruntime.git
cd example-mongodb-multiclusterruntime

go build -o mongodb-controller .
```

Run the controller against your local kcp endpoint and the downstream cluster:

```bash
./mongodb-controller \
  --kcp-kubeconfig=/path/to/kcp.kubeconfig \
  --target-kubeconfig=/path/to/downstream.kubeconfig
```

The controller uses the kcp APIExport provider to discover all consumer workspaces that have bound to the MongoDB APIExport. Each reconcile request includes a cluster name identifying the workspace that produced the event.

## Create a MongoDB resource in a consumer workspace

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

The controller detects the resource, creates a matching `MongoDBCommunity` object on the downstream cluster, and syncs selected status fields back to the consumer workspace.

## Verify the sync

On the downstream cluster, confirm the resource was created:

```bash
kubectl --kubeconfig /path/to/downstream.kubeconfig \
  get mongodbcommunity --all-namespaces
```

Back in the consumer workspace, watch the status update:

```bash
KUBECONFIG=kcp.kubeconfig kubectl get mongodbcommunity my-database -n default -o yaml
```

Look for `status.phase` and `status.version` populated by the downstream operator.

## What you just did

You ran a custom Go controller that uses multi-cluster-runtime to span kcp consumer workspaces and a downstream Kubernetes cluster. Unlike api-syncagent, the controller decides explicitly how to map spec down, how to handle deletes, and which status fields to surface back. That control is the trade-off the multi-cluster-runtime path makes.

## Next

Continue with [multi-cluster-runtime](/concepts/integration/multi-cluster-runtime.md) for the architecture and the full pattern comparison with api-syncagent.

Optional branches:

- [Provider quick start](./provider-quick-start.md) for the simpler api-syncagent path.
- [Integration paths](/concepts/integration-paths.md) to compare both paths.
- [Service provider persona](/concepts/personas/service-provider.md) for the role context.
