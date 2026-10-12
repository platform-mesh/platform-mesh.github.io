---
title: Deploy the MCP integration
personas: [platform-owner]
---

# Deploy the MCP integration

This guide installs the MCP integration on a local Platform Mesh cluster. It deploys the access and MCP virtual workspaces from the published Helm charts, configures the kcp front-proxy for OIDC bearer tokens, and seeds a demo user and demo workspaces.

::: warning
The MCP integration is in alpha and the setup described here targets the local development environment. The demo credentials and the permissive demo RBAC are not suitable for production.
:::

## Prerequisites

- A running [local Platform Mesh setup](./set-up-platform-mesh-locally.md) with kcp-operator v0.9.0 or newer
- A kcp admin kubeconfig, created with `local-setup/scripts/createKcpAdminKubeconfig.sh` from the [helm-charts](https://github.com/platform-mesh/helm-charts) repository
- `helm`, `jq`, and `mkcert` on your machine

## Install behind the front-proxy

Clone the integration repository:

```bash
git clone https://github.com/platform-mesh/mcp-integration.git
cd mcp-integration
```

Run the setup script with the path to your kcp admin kubeconfig:

```bash
KCP_ADMIN_KUBECONFIG=/path/to/helm-charts/.secret/kcp/admin.kubeconfig \
  hack/setup-platform-mesh.sh
```

The script applies the declarative configuration under `examples/platform-mesh/` and performs these steps:

1. Installs the `kcp-access-vw` and `kcp-mcp-vw` charts from `oci://ghcr.io/platform-mesh/helm-charts/`.
2. Adds the `/services/access` and `/services/mcp` path mappings to the front-proxy and enables OIDC bearer token authentication against the local Keycloak.
3. Configures the Keycloak `welcome` realm through a `keycloak-config-cli` Job: the demo user `alice@example.com`, the `kcp-mcp` client with an audience mapper, and the OAuth client registration policy.
4. Applies the demo workspace manifests in each demo workspace: the access `APIBinding`, the impersonator RBAC for the MCP server, and the demo user RBAC.
5. Verifies the stack end to end with a real token.

The MCP endpoint is:

```text
https://mcp.portal.localhost:8443/services/mcp
```

## Install behind the Agent Router (optional)

The Agent Router validates the caller's JWT against Keycloak, serves the OAuth discovery metadata itself, and forwards the bearer token to the front-proxy. Use this path when you want an MCP-aware gateway at the edge:

```bash
KCP_ADMIN_KUBECONFIG=/path/to/helm-charts/.secret/kcp/admin.kubeconfig \
  hack/setup-agent-router.sh
```

The script runs the front-proxy setup first, then installs Envoy Gateway and the Agent Router and applies the manifests from `examples/platform-mesh/agent-router/`: a `Gateway` and `EnvoyProxy`, an `MCPRoute` that validates JWTs and routes `/mcp` to the front-proxy, a `BackendTLSPolicy` for the kcp root CA, and an `HTTPRoute` that publishes the router on the local-setup Traefik gateway.

The MCP endpoint for this setup is:

```text
https://agent-router.portal.localhost:8443/mcp
```

## Verify the deployment

The setup script verifies the stack end to end with a real session. To check the deployment manually without credentials, fetch the OAuth discovery metadata:

```bash
curl -s https://mcp.portal.localhost:8443/.well-known/oauth-protected-resource/services/mcp | jq
```

The response names the MCP endpoint as the protected resource and the Keycloak realm as its authorization server:

```json
{
  "resource": "https://mcp.portal.localhost:8443/services/mcp",
  "authorization_servers": ["https://portal.localhost:8443/keycloak/realms/welcome"],
  "bearer_methods_supported": ["header"]
}
```

An unauthenticated request to the MCP endpoint itself returns 401. The definitive check is connecting a real client, which exercises the full login flow.

## Connect an MCP client

Point an MCP client at the endpoint of your setup with no credentials. The client discovers Keycloak through the OAuth protected resource metadata, registers itself, and opens a browser login. Sign in as the demo user `alice@example.com` with password `alice-password`. The TLS certificate is signed by the mkcert root, which the machine that ran local-setup already trusts.

For GitHub Copilot Chat in VS Code, copy `examples/copilot/mcp.json` to `.vscode/mcp.json` in your project and start the `kcp` MCP server from the editor.

## Enable additional toolsets

By default the server exposes the read-oriented `core` toolset. To enable more, upgrade the chart with an explicit toolset list:

```bash
helm upgrade mcp-vw oci://ghcr.io/platform-mesh/helm-charts/kcp-mcp-vw \
  -n platform-mesh-system --reuse-values \
  --set-json 'toolsets=["core","apis","write"]'
```

The `write` toolset adds create, update, patch, scale, and delete tools. The `admin` toolset exposes platform internals such as shards and logical clusters and is not meant for end users.

## Related

- [MCP integration](/concepts/mcp-integration.md)
- [Troubleshoot the MCP integration](./troubleshoot-mcp-integration.md)
- [Work with your workspaces through an MCP agent](/tutorials/work-with-workspaces-mcp.md)
- [Set up Platform Mesh locally](./set-up-platform-mesh-locally.md)
