# Watch and sync

Platform Mesh controllers reconcile resources across many workspaces from a single process. They use [`kcp-dev/multicluster-provider`](https://github.com/kcp-dev/multicluster-provider) on top of `controller-runtime`, with kcp's APIExport virtual workspace as the data source.

See [Virtual workspaces](./virtual-workspaces.md) for the kcp endpoint primitives this builds on.

## Primitives

| Primitive | Platform Mesh role |
| --- | --- |
| `multicluster-provider` | controller-runtime extension that exposes `mgr.GetCluster(ctx, name)` and threads `req.ClusterName` through reconcilers. |
| `pathaware` provider flavor | Watches by workspace path; used when the controller follows the workspace tree. |
| `apiexport` provider flavor | Watches by `APIExportEndpointSlice`; used when the controller reconciles all consumers of an export. |
| `mcreconcile.Request` | `reconcile.Request` plus `ClusterName`; identifies which workspace a reconcile event came from. |
| `kcp.io/cluster` annotation | Set by kcp on objects returned through wildcard reads; controllers use it to look up the source workspace. |
| `controllerutil.CreateOrUpdate` | Standard controller-runtime helper; works against `cluster.GetClient()` from multicluster-provider. |

## Manager wiring (account-operator)

The account-operator wires an `apiexport` provider against an `APIExportEndpointSlice` and gives it to a multi-cluster manager:

```go
// account-operator/cmd/operator.go
// import "github.com/kcp-dev/multicluster-provider/apiexport"
provider, err := apiexport.New(restCfg, operatorCfg.Kcp.ApiExportEndpointSliceName, apiexport.Options{
    Log:    &ctrl.Log,
    Scheme: scheme,
})
if err != nil {
    log.Fatal().Err(err).Msg("creating APIExport provider")
}

mgr, err := mcmanager.New(restCfg, provider, mcmanager.Options{
    Scheme:                 scheme,
    Metrics:                metricsserver.Options{BindAddress: defaultCfg.Metrics.BindAddress},
    BaseContext:            func() context.Context { return ctx },
    HealthProbeBindAddress: defaultCfg.HealthProbeBindAddress,
    LeaderElection:         defaultCfg.LeaderElectionEnabled,
    LeaderElectionID:       "8c290d9a.platform-mesh.io",
})
```

## Reconciler signature

Reconcilers take `mcreconcile.Request` instead of `reconcile.Request`. The `ClusterName` field identifies the workspace the event came from:

```go
// account-operator/internal/controller/account_controller.go
func (r *AccountReconciler) SetupWithManager(mgr mcmanager.Manager, cfg *platformmeshconfig.CommonServiceConfig, log *logger.Logger, eventPredicates ...predicate.Predicate) error {
    return mcbuilder.ControllerManagedBy(mgr).
        Named(accountReconcilerName).
        For(&v1alpha1.Account{}).
        WithOptions(controller.TypedOptions[mcreconcile.Request]{
            MaxConcurrentReconciles: cfg.MaxConcurrentReconciles,
            RateLimiter:             r.rateLimiter,
        }).
        Complete(r)
}

func (r *AccountReconciler) Reconcile(ctx context.Context, req mcreconcile.Request) (ctrl.Result, error) {
    return r.lifecycle.Reconcile(ctx, req)
}
```

## Talking to the right workspace

Controllers do not hold a single client. They get a per-workspace client from the manager using the cluster name attached to the reconcile request:

```go
// account-operator/pkg/subroutines/workspace/workspace.go
func (r *WorkspaceSubroutine) Process(ctx context.Context, obj client.Object) (subroutines.Result, error) {
    instance := obj.(*v1alpha1.Account)
    cn := clusteredname.MustGetClusteredName(ctx, obj)
    clusterName := cn.ClusterID.String()

    clusterRef, err := r.mgr.GetCluster(ctx, clusterName)
    if err != nil {
        return subroutines.OK(), err
    }
    clusterClient := clusterRef.GetClient()

    createdWorkspace := &kcptenancyv1alpha.Workspace{
        ObjectMeta: metav1.ObjectMeta{Name: instance.Name},
    }
    if _, err = controllerutil.CreateOrUpdate(ctx, clusterClient, createdWorkspace, func() error {
        createdWorkspace.Spec.Type = &kcptenancyv1alpha.WorkspaceTypeReference{
            Name: kcptenancyv1alpha.WorkspaceTypeName(workspaceTypeName),
            Path: orgsWorkspacePath, // "root:orgs"
        }
        return controllerutil.SetOwnerReference(instance, createdWorkspace, clusterClient.Scheme())
    }); err != nil {
        return subroutines.OK(), err
    }
    return subroutines.OK(), nil
}
```

The same pattern is used by the [security-operator](../security-operator.md) for IAM Store reconciliation and by [api-syncagent](../api-syncagent.md) for resource sync.

## Related

- [Virtual workspaces](./virtual-workspaces.md) — the kcp endpoint multicluster-provider connects to
- [API sharing](./api-sharing.md) — `APIExportEndpointSlice` configuration
- [account-operator](../account-operator.md), [security-operator](../security-operator.md), [api-syncagent](../api-syncagent.md), [multicluster-runtime](../multicluster-runtime.md)
