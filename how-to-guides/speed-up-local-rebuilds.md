---
title: Speed up local rebuilds
personas: [platform-owner, service-provider]
---

# Speed up local rebuilds

Use cached setup when iterating on the local cluster. The cached path uses local Docker registry mirrors so image pulls are reused across runs.

## Run the cached setup

::: code-group

```bash [Task]
task local-setup:cached
task local-setup:cached:iterate
```

```bash [Script]
kind delete cluster --name platform-mesh
./local-setup/scripts/start.sh --cached
./local-setup/scripts/start.sh --cached
```

:::

The first cached run primes the local registry mirrors. Subsequent runs reuse them, so cluster recreation is significantly faster.

For details on the registry mirror behavior, see the [local-setup README](https://github.com/platform-mesh/helm-charts/blob/main/local-setup/README.md).

## Related

- [Set up Platform Mesh locally](/how-to-guides/set-up-platform-mesh-locally.md)
- [Troubleshoot local setup](/how-to-guides/troubleshoot-local-setup.md)
