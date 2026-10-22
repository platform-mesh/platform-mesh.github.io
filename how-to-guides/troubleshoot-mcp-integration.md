---
title: Troubleshoot the MCP integration
personas: [platform-owner]
---

# Troubleshoot the MCP integration

This runbook covers the common failure modes of the MCP integration in the local setup. For general cluster problems, see [Troubleshoot the local setup](./troubleshoot-local-setup.md).

## The MCP server rejects a valid login with 401

The most common cause is an audience mismatch. The MCP server — and the Agent Router in front of it — accepts a token only when its `aud` claim contains the expected client ID. Capture the access token the client presented, for example from the MCP client's output or logs, and decode it:

```bash
echo "$TOKEN" | jq -rR 'split(".")[1] | gsub("-";"+") | gsub("_";"/") | @base64d | fromjson | {aud, iss, exp}'
```

If `kcp-mcp` is missing from `aud`, the audience mapper in the Keycloak realm is not applied. Reapply the declarative realm configuration:

```bash
kubectl -n platform-mesh-system delete job mcp-keycloak-config --ignore-not-found
kubectl -n platform-mesh-system apply -f examples/platform-mesh/keycloak/mcp-realm-config.yaml
kubectl -n platform-mesh-system wait --for=condition=complete job/mcp-keycloak-config --timeout=120s
```

Also check `exp`. Demo tokens are short-lived, so an expired token from an earlier session produces the same 401.

## The MCP client never opens a browser login

MCP clients bootstrap authentication through OAuth protected resource metadata. The metadata is served on the dedicated MCP host, not on the general kcp API host. Point the client at:

```text
https://mcp.portal.localhost:8443/services/mcp
```

A client pointed at the kcp API host receives a plain 401 without discovery metadata and cannot start the login flow. The kcp API does not accept MCP tokens at all.

## The Keycloak configuration Job fails on re-run

Kubernetes Job specs are immutable, so applying a changed Job manifest over an existing one fails. Delete the Job first and apply again, as shown in the audience section. The `keycloak-config-cli` import itself is idempotent.

## `list_kcp_workspaces` returns no workspaces

The access virtual workspace returns only workspaces where the caller has access and where the access API is bound. Check both:

1. The `APIBinding` for the access API exists in the workspace. The setup script applies it from `examples/platform-mesh/kcp/`.
2. The user has RBAC in that workspace. The demo grants `oidc:alice@example.com` access through a `ClusterRoleBinding` per demo workspace.

Reapply the workspace seeding for a workspace:

```bash
KUBECONFIG=$KCP_ADMIN_KUBECONFIG kubectl ws use <workspace-path>
KUBECONFIG=$KCP_ADMIN_KUBECONFIG kubectl apply -k examples/platform-mesh/kcp/
```

## Tool calls fail with "workspace not in scope"

This is the authorization model working as designed, not a fault. The MCP server limits every session to the workspaces the access virtual workspace returns for the caller. A request for any other workspace, including `root`, fails with a scope error. If the user needs the workspace, grant access in kcp and the next request picks it up, because scope is re-evaluated per request.

## The virtual workspaces do not become ready

Both charts render kcp-operator `VirtualWorkspace` resources, which require kcp-operator v0.9.0 or newer. Check the resources and the operator version:

```bash
kubectl -n platform-mesh-system get virtualworkspaces
kubectl -n kcp-operator get deploy kcp-operator -o jsonpath='{.spec.template.spec.containers[0].image}'
```

If the `VirtualWorkspace` kind does not exist, upgrade the local setup to a helm-charts release that ships kcp-operator v0.9.0 or newer.

## TLS errors in the MCP client

The local endpoints use certificates signed by the mkcert root CA. The machine that ran local-setup trusts that root. On any other machine, install the mkcert root CA first or the client refuses the connection.

## Write tools are missing

The chart enables only the `core` toolset by default. Enable more toolsets through the chart values, see [Deploy the MCP integration](./deploy-mcp-integration.md#enable-additional-toolsets). After the upgrade, restart the MCP client session so it fetches the new tool list.

## Rotate the demo credentials

All demo identity data is declarative. Change the user or client in `examples/platform-mesh/keycloak/mcp-realm-config.yaml`, then delete and reapply the configuration Job as shown in the audience section. Active tokens stay valid until they expire.

## Related

- [Deploy the MCP integration](./deploy-mcp-integration.md)
- [MCP integration](/concepts/mcp-integration.md)
- [Troubleshoot the local setup](./troubleshoot-local-setup.md)
