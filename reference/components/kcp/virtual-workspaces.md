# Virtual workspaces

A virtual workspace is a kcp-published HTTP endpoint that proxies a curated view of objects across many workspaces. Platform Mesh controllers and the rebac-authz-webhook connect to virtual workspaces to watch consumer resources without holding per-workspace credentials.

See [Watch and sync](./watch-and-sync.md) for the controller-runtime layer that consumes these endpoints.

## URL contracts

| Endpoint | Shape | Purpose |
| --- | --- | --- |
| APIExport VW | `/services/apiexport/<provider-path>/<export-name>/clusters/*/...` | Wildcard view of all consumer-bound objects for a given `APIExport`. |
| Initializing-workspace VW | `/services/initializingworkspaces/<initializer-name>/clusters/*/...` | Wildcard view of workspaces awaiting an initializer phase. |
| Terminating-workspace VW | listed in `WorkspaceType.status.virtualWorkspaces[type=terminating]` | Wildcard view of workspaces in the terminating phase the type defines. |

URLs are not constructed by hand. Platform Mesh reads them from kcp status objects.

## Discovering APIExport URLs

`APIExportEndpointSlice` (created alongside each `APIExport`) publishes the virtual-workspace URL of every shard the export is exposed on. Platform Mesh consumes the first endpoint:

```go
// platform-mesh-operator/pkg/subroutines/scoped_provider_kubeconfig.go
// virtualWorkspaceServerURLFromSlice returns status.apiExportEndpoints[0].url
// as the kubeconfig cluster server (kcp's published VirtualWorkspace URL).
func virtualWorkspaceServerURLFromSlice(slice *kcpapiv1alpha1.APIExportEndpointSlice) (string, error) {
    if len(slice.Status.APIExportEndpoints) == 0 {
        return "", fmt.Errorf("no APIExport endpoints in slice %s", slice.Name)
    }
    return slice.Status.APIExportEndpoints[0].URL, nil
}
```

The [rebac-authz-webhook](../rebac-authz-webhook.md) discovers its endpoint the same way, via `--kcp-api-export-endpoint-slice-name`.

## Discovering terminating-phase URLs

`WorkspaceType.status.virtualWorkspaces` lists endpoints for workspaces undergoing each lifecycle phase the type opts into. The [security-operator](../security-operator.md) reads the `terminating` URLs to clean up IAM stores when a workspace is being deleted:

```go
// security-operator/internal/terminatingworkspaces/provider.go
GetVWs: func(obj client.Object) ([]string, error) {
    wst := obj.(*kcptenancyv1alpha1.WorkspaceType)
    var urls []string
    for _, endpoint := range wst.Status.VirtualWorkspaces {
        if endpoint.Type != "terminating" {
            continue
        }
        urls = append(urls, endpoint.URL)
    }
    return urls, nil
},
```

## What you see through a virtual workspace

- Objects come back annotated with `kcp.io/cluster` so the consumer knows the source workspace.
- Authorization runs through the virtual-workspace's own RBAC, not raw `system:masters`.
- Identity hash on the `APIExport` scopes which schemas are visible — providers cannot accidentally see other providers' data of the same group/resource.

## Related

- [API sharing](./api-sharing.md) — `APIExport` and `APIExportEndpointSlice` definitions
- [Watch and sync](./watch-and-sync.md) — consuming these URLs from Go controllers
- [Workspaces](./workspaces.md) — initializer and terminator declarations on `WorkspaceType`
- [rebac-authz-webhook](../rebac-authz-webhook.md), [security-operator](../security-operator.md)
