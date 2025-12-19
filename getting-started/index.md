# Getting Started

This guide will help you set up a local Platform Mesh environment using a Kind (Kubernetes in Docker) cluster. By the end of this guide, you'll have a fully functional Platform Mesh installation running on your local machine.

## Overview

The local setup creates a complete Platform Mesh environment including:

- **Kind cluster** running Kubernetes v1.33.1
- **Core infrastructure**: Flux, Cert-Manager, OCM controller
- **Platform Mesh operator** and all required components
- **Local SSL certificates** for secure communication
- **Onboarding Portal** for managing organizations and services

The local setup scripts and configuration are available in the [platform-mesh/helm-charts release 0.1.0](https://github.com/platform-mesh/helm-charts/releases/tag/0.1.0), `local-setup` directory.

## Prerequisites

Before you begin, ensure you have the following tools installed:

### System Requirements

- **Minimum**: 8 GB RAM, 6 CPUs
- Ensure your Docker/Podman has sufficient resources allocated

### Required Tools

- **Docker** or **Podman** - Container runtime
  - Docker Desktop is recommended for WSL2 users
  - Ensure the container daemon is running before starting setup
- **Kind** - Kubernetes in Docker ([Installation](https://kind.sigs.k8s.io/docs/user/quick-start/))
- **kubectl** - Kubernetes command-line tool (usually installed with Docker Desktop or Kind)
- **kubectl-kcp plugin** - Required when using `--example-data` flag for workspace management ([Installation](https://docs.kcp.io/kcp/main/setup/kubectl-plugin/))
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
WSL version 2.1.5 or higher is required with Docker Desktop WSL2 integration enabled. You'll need to set up mkcert to work across both WSL2 and Windows. See the [WSL2 setup guide](https://github.com/platform-mesh/helm-charts/blob/0.1.0/local-setup/README.md#wsl2--windows-mkcert-setup-guide) for detailed instructions.
:::

::: tip macOS Podman Users
Set the environment variable: `KIND_EXPERIMENTAL_PROVIDER=podman`
:::

For detailed installation instructions for each prerequisite, refer to the [helm-charts local-setup README](https://github.com/platform-mesh/helm-charts/blob/0.1.0/local-setup/README.md#prerequisites).

## Bootstrap process

![Bootstrap process](/docs/public/diagrams/Bootstrap-process.excalidraw.svg)


## Additional Resources

- [Full Local Setup Documentation](https://github.com/platform-mesh/helm-charts/blob/0.1.0/local-setup/README.md) - Comprehensive guide for version 0.1.0
- [Platform Mesh Helm Charts Release 0.1.0](https://github.com/platform-mesh/helm-charts/releases/tag/0.1.0) - Release download
- [Platform Mesh Helm Charts Repository](https://github.com/platform-mesh/helm-charts) - Source repository
- [Platform Mesh Operator](https://github.com/platform-mesh/platform-mesh-operator) - Operator documentation and API reference
- [Overview](/overview/) - Learn about Platform Mesh architecture
- [Scenarios](/scenarios) - Explore usage scenarios

## Getting Help

If you encounter issues not covered in this guide, we are here to help: Open an issue in the [helm-charts repository](https://github.com/platform-mesh/helm-charts/issues)
