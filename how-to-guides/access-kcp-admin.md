---
title: Access the kcp admin workspace
personas: [platform-owner]
---

# Access the kcp admin workspace

Use the local setup admin kubeconfig when you need full visibility into the kcp workspaces in a local Platform Mesh instance.

::: tip Admin access
The admin kubeconfig is for platform administrators. It is not a consumer or provider workspace credential.
:::

## Set the kubeconfig

Run this from the `local-setup` directory of the `platform-mesh/helm-charts` repository:

```bash
export KUBECONFIG=$(pwd)/.secret/kcp/admin.kubeconfig
```

## List workspaces

```bash
kubectl get workspaces
```

## Switch workspaces

```bash
kubectl kcp workspace use <workspace-name>
```

This gives access to the root workspace and organization management objects.

## Related

- [Control planes](/concepts/control-planes.md)
- [kcp reference](/reference/components/kcp.md)
