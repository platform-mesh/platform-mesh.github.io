# Troubleshoot local setup

For local-setup specific issues, also check the [local-setup issues in the helm-charts repository](https://github.com/platform-mesh/helm-charts/issues?q=state%3Aopen%20label%3Alocal-setup).

## Docker or Podman is not running

Start Docker Desktop or Podman before running the setup.

For WSL2, verify Docker Desktop WSL integration is enabled.

## Ports are already in use

The local setup expects ports `8443`, `80`, and `443` to be available. Stop conflicting services before running setup.

## Kind cluster creation fails

Delete the existing Kind cluster and retry:

```bash
kind delete cluster --name platform-mesh
task local-setup
```

Check available disk space. The setup needs about 10 GB. Also verify that the container runtime has enough CPU and memory.

## Browser certificate warnings

Reinstall local certificates:

```bash
mkcert -install
```

If warnings continue, see the [certificate troubleshooting guide](https://github.com/platform-mesh/helm-charts/blob/main/local-setup/README.md#certificate-issues).

## Component timeouts

Use cached setup to reduce image pulling:

```bash
task local-setup:cached
```

Verify that all required images can be pulled from your network.

## Enable debug output

Prepend `DEBUG=true` to any setup task:

```bash
DEBUG=true task local-setup:iterate
```

## WSL2 cgroup issues

If Kubernetes crashes because of a cgroup v1 and v2 hybrid state, force WSL2 to use cgroup v2.

Open PowerShell, edit `%USERPROFILE%\.wslconfig`, and add:

```ini
[wsl2]
kernelCommandLine = cgroup_no_v1=all
```

Restart WSL2 after saving the file.

## Clean up the local setup

```bash
kind delete cluster --name platform-mesh
mkcert -uninstall
```
