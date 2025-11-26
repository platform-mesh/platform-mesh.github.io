# Getting Started

This guide will help you set up a local Platform Mesh environment using a Kind (Kubernetes in Docker) cluster. By the end of this guide, you'll have a fully functional Platform Mesh installation running on your local machine.

## Overview

The local setup creates a complete Platform Mesh environment including:

- **Kind cluster** running Kubernetes v1.33.1
- **Core infrastructure**: Flux, Cert-Manager, OCM controller
- **Platform Mesh operator** and all required components
- **Local SSL certificates** for secure communication
- **Onboarding Portal** for managing organizations and services

The local setup scripts and configuration are located in the [platform-mesh/helm-charts](https://github.com/platform-mesh/helm-charts) repository, `local-setup` directory.

## Prerequisites

Before you begin, ensure you have the following tools installed:

### Required Tools

- **Docker** or **Podman** - Container runtime
  - Docker Desktop is recommended for WSL2 users
  - Ensure the container daemon is running before starting setup
- **Kind** - Kubernetes in Docker ([Installation](https://kind.sigs.k8s.io/docs/user/quick-start/))
- **kubectl** - Kubernetes command-line tool (usually installed with Docker Desktop or Kind)
- **Helm** - Kubernetes package manager ([Installation](https://helm.sh/docs/intro/install/))
- **openssl** - Required for SSL certificate generation (typically pre-installed on Linux/macOS)
- **base64** - Required for encoding/decoding operations (standard Unix utility, typically pre-installed)
- **mkcert** - Local certificate generation tool ([Installation](https://github.com/FiloSottile/mkcert?tab=readme-ov-file#installation))

### Optional Tools

- **Task** - Task runner for executing project tasks ([Installation](https://taskfile.dev/installation/))
  - Provides convenient command aliases (e.g., `task local-setup`)
  - Not required - you can run scripts directly
  - When using Task, mkcert can be automatically installed to a local `bin` directory if you have Go installed

### Platform-Specific Notes

::: tip WSL2 Users
WSL version 2.1.5 or higher is required with Docker Desktop WSL2 integration enabled. You'll need to set up mkcert to work across both WSL2 and Windows. See the [WSL2 setup guide](https://github.com/platform-mesh/helm-charts/blob/main/local-setup/README.md#wsl2--windows-mkcert-setup-guide) for detailed instructions.
:::

::: tip macOS Podman Users
Set the environment variable: `KIND_EXPERIMENTAL_PROVIDER=podman`
:::

For detailed installation instructions for each prerequisite, refer to the [helm-charts local-setup README](https://github.com/platform-mesh/helm-charts/blob/main/local-setup/README.md#prerequisites).

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/platform-mesh/helm-charts.git
cd helm-charts/local-setup
```

### 2. Run the Setup

The setup script automates the entire bootstrap process. Choose one of the following options:

#### Standard Setup

::: code-group

```bash [Task]
# Full setup (deletes existing cluster and creates new one)
task local-setup

# Iterate on existing cluster (faster, preserves cluster state)
task local-setup:iterate
```

```bash [Script]
# Full setup (deletes existing cluster and creates new one)
kind delete cluster --name platform-mesh
./scripts/start.sh

# Iterate on existing cluster (faster, preserves cluster state)
./scripts/start.sh
```

:::

After the script is finished, it should print `Installation Complete ♥ !` along with instructions on accessing the portal.

#### Cached Setup (Faster)

Image caching speeds up cluster recreation by using local Docker registry mirrors. The setup script automatically starts the required registry proxies when using cached mode.

::: code-group

```bash [Task]
# Full setup with caching
task local-setup-cached

# Iterate on existing cluster
task local-setup-cached:iterate
```

```bash [Script]
# Full setup with caching
kind delete cluster --name platform-mesh
./scripts/start.sh --cached

# Iterate on existing cluster
./scripts/start.sh --cached
```

:::

::: info Setup Duration
The initial setup typically takes 5-10 minutes, depending on your internet connection and machine performance.
:::

### 3. Configure Local DNS

Add the following entries to your `/etc/hosts` file:

```
127.0.0.1 portal.dev.local kcp.api.portal.dev.local
```

::: tip WSL Users
Also add these entries to the Windows hosts file at `C:\Windows\System32\drivers\etc\hosts`
:::

::: warning Organization Subdomains
Each created organization gets its own subdomain (e.g., `<organization-name>.portal.dev.local`) that must be added to your `/etc/hosts` file:

```
127.0.0.1 <organization-name>.portal.dev.local
```

Remember to add a hosts entry for every organization you create in the platform.
:::

### 4. Access the Services

Once the setup is complete, you can access:

- **Onboarding Portal**: `https://portal.dev.local:8443`
- **KCP API**: `https://kcp.api.portal.dev.local:8443`

::: warning Certificate Trust
You may need to trust the local certificates generated by mkcert. The setup script will attempt to do this automatically, but you may need to manually trust them in your browser or system keychain.

For detailed certificate trust instructions for different platforms (WSL2, Windows, Linux), see the [troubleshooting section](#certificate-trust-issues) below.
:::

## What's Installed?

The local setup deploys the following components:

### Platform Mesh Prerequisites
- **Flux**: GitOps toolkit for continuous delivery
- **KRO**: Kubernetes Resource Orchestrator
- **OCM Controller**: Open Cluster Management controller

### Platform Mesh Infrastructure

The **Platform Mesh Operator** is the core component that deploys and manages all Platform Mesh infrastructure. The complete list of components for a given version is defined in the OCM (Open Component Model) component descriptor.

You can view the Platform Mesh components using:

```bash
ocm get componentversions --repo ghcr.io/platform-mesh github.com/platform-mesh/platform-mesh --latest -oyaml
```

::: details Installing the OCM CLI
If you don't have the OCM CLI installed, you can install it using one of the following methods:

**macOS (Homebrew):**
```bash
brew install open-component-model/tap/ocm
```

**Linux/macOS (Script):**
```bash
curl -s https://ocm.software/install.sh | bash
```

**Manual Installation:**
Download the binary for your platform from the [OCM releases page](https://github.com/open-component-model/ocm/releases).

For more installation options and details, see the [OCM installation documentation](https://ocm.software/docs/getting-started/installation/).
:::

Key components deployed by the operator include:

- **Portal**: A example implementation of a Portal UI based on Platform Mesh
- **Kubernetes GraphQL Gateway**: Generic Grahqpl Gateway that offers a Graphql api for the underlying KCP Control Plane
- **KCP**: Manages Kubernetes-based control planes
- **OpenFGA**: Central Relationship based Authorization system 
- **Keycloak**: Default Identity Provider used for authentication
- **Account Controller**: Handles multi-tenancy and management of accounts and organization
- **Extension Controller**: Handles Micro Frontend configurations and validations

::: details Example Component Structure (YAML)
```yaml
component:
  name: github.com/platform-mesh/platform-mesh
  version: <version>
  provider:
    name: platform-mesh
  resources:
    - componentName: github.com/platform-mesh/account-operator
      name: account-operator
      version: <version>
    - componentName: github.com/crossplane/crossplane
      name: crossplane
      version: <version>
    - componentName: github.com/gardener/etcd-druid
      name: etcd-druid
      version: <version>
    - componentName: github.com/platform-mesh/extension-manager-operator
      name: extension-manager-operator
      version: <version>
    - componentName: github.com/platform-mesh/infra
      name: infra
      version: <version>
    - componentName: github.com/platform-mesh/keycloak
      name: keycloak
      version: <version>
    - componentName: github.com/kcp-dev/kcp-operator
      name: kcp-operator
      version: <version>
    # ... additional components
```
:::

For the complete and up-to-date component list, always refer to the OCM component descriptor using the command above.

## How It Works

The setup script automates the entire bootstrap process:

1. **Environment Validation** - Checks for required dependencies and system compatibility
2. **Cluster Creation** - Creates a Kind cluster with the necessary configuration
3. **Certificate Setup** - Generates local SSL certificates for secure access
4. **Platform Mesh Prerequisites** - Installs Flux, KRO, and OCM
5. **Platform Mesh Installation** - Deploys the Platform Mesh operator and components
6. **Post-Install Configuration** - Creates KCP kubeconfig and validates readiness

The Platform Mesh operator manages the actual component deployment by reconciling the `PlatformMesh` custom resource. For detailed information about the bootstrap process and operator API, see:
- [Platform Mesh Operator](https://github.com/platform-mesh/platform-mesh-operator) - Operator documentation and API reference

## Next Steps

### Working with KCP Workspaces

Platform Mesh uses KCP (Kubernetes Control Plane) to provide multi-tenant control planes. After successful setup, export the KCP kubeconfig to interact with workspaces:

```bash
export KUBECONFIG=$(pwd)/.secret/kcp/admin.kubeconfig
```

This gives you access to the root workspace and organization management.

You can then:

1. **Switch between workspaces**:
   ```bash
   kubectl kcp workspace use <workspace-name>
   ```

2. **List available workspaces**:
   ```bash
   kubectl get workspaces
   ```

### Exploring the Platform

- Browse the **Onboarding Portal** to see available services
- Create service bindings using kubectl
- Explore the multi-tenant architecture through different organization workspaces

::: tip Email Confirmations in Local Setup
When you register or create an organization, the system sends confirmation emails. Since this is a local setup, no real emails are sent. Instead, all emails can be viewed in the **Mailpit** application that's deployed as part of the local setup.

Access Mailpit at: `https://portal.dev.local:8443/mailpit/`

You can use Mailpit to view all sent emails and test email workflows without needing a real email server.
:::

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

## Additional Resources

- [Full Local Setup Documentation](https://github.com/platform-mesh/helm-charts/blob/main/local-setup/README.md) - Comprehensive guide with all details
- [Platform Mesh Helm Charts](https://github.com/platform-mesh/helm-charts) - Source repository
- [Platform Mesh Operator](https://github.com/platform-mesh/platform-mesh-operator) - Operator documentation and API reference
- [Overview](/overview/) - Learn about Platform Mesh architecture
- [Scenarios](/scenarios) - Explore usage scenarios

## Getting Help

If you encounter issues not covered in this guide, we are here to help: Open an issue in the [helm-charts repository](https://github.com/platform-mesh/helm-charts/issues)
