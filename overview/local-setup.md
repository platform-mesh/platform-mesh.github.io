

## Local Setup

The local setup can be used to create a complete PlatformMesh local environment for testing or demo purposes. The local-setup scripts and configuration are located in the [github.com/platform-mesh/helm-charts](https://github.com/platform-mesh/helm-charts) repository, `local-setup` directory. For further documentation refer to the READMEs in the `local-setup` directoring of the `helm-charts` repository.

### Supported platforms

- linux/amd64
- darwin/arm64

### Requirements

- Docker and Kind
- Helm
- Kubectl
- Taskfile https://taskfile.dev/
- mkcert

Additional tooling might be downloaded automatically during setup.

Minimum Docker resources:
- 12 Gb of RAM
- 10 CPUs

### Quick Start

Before running the setup scripts, some local configuration is needed. Add the following entries to your local `/etc/hosts` file


```file
127.0.0.1       kcp.api.portal.dev.local portal.dev.local
127.0.0.1       *.portal.dev.local default.portal.dev.local
```

Run the following commands at the root level of the repository.

```sh
# Full setup (deletes existing cluster and creates new one)
task local-setup
```

After the script is finished, it should print `Installation Complete ♥ !` along with some instructions on navigating to the portal.

You can also iterate on an existing cluster (faster, preserves cluster state):

```sh
# Iterate on existing cluster (faster, preserves cluster)
task local-setup:iterate
```

### Testing local setup

Use the following task:

```sh
# run only once
task test:portal-e2e
```

### Description of the bootstrap procedure

When the `local-setup` task is run, the following steps are performed:

- downloads required tooling in the `bin` directory
- runs the `start.sh` script

The rest of the steps are performed in the start.sh scirpt:

- performs checks - platform compatability and environment
- deletes and creates a fresh KIND cluster named `platform-mesh`
- creates certificates for hosts "*.dev.local" "*.portal.dev.local" in the `certs` directory
- installs FluxCD via Helm in the cluster
- applies base kustomizations: CRDs, KRO, namespaces, OCM, ResourceGraphDefinition
- creates neceserry secrets in the cluster
- applies default kustomize overlay: `platform-mesh-operator` and `ocm-component`
- instanciates the `platform-mesh-operator`
- applies the `PlatformMesh` custom resource to the cluster
- waits until installed resources become ready
- creates a local KCP Kubeconfig
- prints `Installation Complete` message

The main part of the bootstrap procedure is actually delegated to the `platform-mesh-operator`. It creates all required PlatformMesh components and configures them by reconciling the `PlatformMesh` custom kubernetes resource, located on this path: `local-setup/kustomize/components/platform-mesh-operator-resource/platform-mesh.yaml`. For more detailed documentation about the API provided by this resource, see [github.com/platform-mesh/platform-mesh-operator](https://github.com/platform-mesh/platform-mesh-operator).