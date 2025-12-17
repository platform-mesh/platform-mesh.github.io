## Troubleshooting

For local-setup specific issues, check the [local-setup issues on GitHub](https://github.com/platform-mesh/helm-charts/issues?q=state%3Aopen%20label%3Alocal-setup).

### Common Issues

#### Docker/Podman Not Running
- Ensure Docker Desktop or Podman is started
- For WSL2: Verify Docker Desktop WSL integration is enabled

#### Port Conflicts
- Ensure ports 8443, 80, and 443 are not in use by other applications
- Stop conflicting services before running setup

#### Cluster Creation Fails
If the Kind cluster fails to create:
```bash
# Delete the existing cluster
kind delete cluster --name platform-mesh

# Retry setup
task local-setup
```

Check available disk space (need ~10GB) and verify your container runtime has sufficient resources.

#### Certificate Trust Issues

**Quick Fix:**
```bash
# Reinstall certificates
mkcert -install
```

If you continue to see certificate warnings in your browser, you may need platform-specific setup. See the [certificate troubleshooting guide](https://github.com/platform-mesh/helm-charts/blob/main/local-setup/README.md#certificate-issues) for detailed instructions for WSL2, Windows, Linux, and Firefox users.

#### DNS Resolution Not Working

Verify your hosts file entries:
```bash
# On Linux/macOS
cat /etc/hosts | grep portal.dev.local

# On Windows
type C:\Windows\System32\drivers\etc\hosts | findstr portal.dev.local
```

For WSL2 users, check both Linux and Windows hosts files.

#### Component Timeout Issues
- Try to use the cached version, as it needs less image pulling and try again using `task local-setup-cached`
- Verify all required images can be pulled

### Cleaning Up

To remove the local setup:
```bash
# Delete the Kind cluster
kind delete cluster --name platform-mesh

# Remove certificates (optional)
mkcert -uninstall
```

