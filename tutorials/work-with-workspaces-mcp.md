# Work with your workspaces through an MCP agent

This tutorial is for [service consumers](/concepts/personas/service-consumer): it connects an AI agent to the Platform Mesh MCP integration and walks through everyday scenarios — discovering what you can manage, querying resources, comparing workspaces, and seeing the authorization model push back. You interact in natural language, and the agent translates your requests into MCP tool calls that always run as your user. [Service providers](/concepts/personas/service-provider) benefit indirectly: every API they publish and consumers bind becomes usable through the agent, with no provider-side work.

::: warning Development preview
The MCP integration is in alpha. Tool names and behavior may change.
:::

## Before you start

You need:

- A local Platform Mesh cluster with the MCP integration deployed, see [Deploy the MCP integration locally](/how-to-guides/deploy-mcp-integration.md)
- An MCP-capable agent. This tutorial uses GitHub Copilot Chat in VS Code, but any MCP client that supports OAuth discovery works the same way.

The demo setup seeds a user `alice@example.com` with access to a small set of workspaces. When you run the scenarios, substitute the workspace names your own `list_kcp_workspaces` call returns.

## Connect the agent

Copy the client configuration from the integration repository into your project:

```bash
cp mcp-integration/examples/copilot/mcp.json .vscode/mcp.json
```

Start the `kcp` MCP server from the editor. The client discovers Keycloak through the OAuth metadata and opens a browser login. Sign in as `alice@example.com` with password `alice-password`.

No token, kubeconfig, or server address ends up in your editor configuration beyond the MCP endpoint URL. Identity comes entirely from the browser login.

## Scenario: which workspaces do I have access to?

Ask the agent:

> Which workspaces do I have access to?

The agent calls `list_kcp_workspaces`. The answer contains exactly the workspaces your user can access, nothing else. There is no "all workspaces" view to fall back to: the list is computed from your identity by the access virtual workspace.

## Scenario: what can I manage here?

Ask:

> What APIs can I use in the team-a workspace?

The agent calls `list_kcp_apibindings` for that workspace and reports the bound APIs. The list reflects the actual `APIBinding` resources, so it shows what service providers have made available in this specific workspace rather than a generic API catalog.

## Scenario: inspect resources

Ask:

> Show me the ConfigMaps in team-a and summarize what they configure.

The agent lists the resources with `list_resources` and reads individual objects with `get_resource`. Follow up with diagnosis questions:

> Is anything in this workspace not ready?

The agent reads the status conditions of the objects and reports the ones with failing conditions.

## Scenario: compare workspaces

Ask:

> Are team-a and team-b configured the same?

The agent lists the relevant resources in both workspaces and reports the differences, for example a ConfigMap that exists in one workspace but not the other. Cross-workspace queries like this are the main advantage over a single-cluster MCP server: the agent fans out over your workspaces in one conversation.

## Scenario: apply the same change everywhere

This scenario needs the `write` toolset, see [Enable additional toolsets](/how-to-guides/deploy-mcp-integration.md#enable-additional-toolsets).

Ask:

> Create a ConfigMap named team-settings with the key log-level set to debug, identically in team-a and team-b. Show me what you plan to create first.

The agent proposes the objects, waits for your confirmation, then calls `create_resource` once per workspace and reports the result for each. If one workspace fails, the agent reports that failure instead of hiding it behind a partial success.

Clean up the same way:

> Delete the team-settings ConfigMap from both workspaces.

## Scenario: the authorization boundary

Ask for something your user cannot access:

> List the resources in the root workspace.

The tool call fails with a scope error, and the agent tells you the workspace is not accessible. This is the core guarantee of the integration: the MCP server impersonates you on every request, so the agent can never see or change anything your own permissions do not allow. There is no service account to borrow.

## What you saw

- The agent discovered your workspaces and their bound APIs from live data
- Queries and comparisons spanned multiple workspaces in one conversation
- Writes were proposed, confirmed, and applied per workspace
- Every result was bounded by your own permissions, enforced by kcp

## Next

Read [MCP integration](/concepts/mcp-integration.md) for the architecture behind what you just used, including the request path and the authorization model.

Optional branches:

- [Identity and authorization](/concepts/identity-and-authorization.md) for how kcp evaluates the impersonated requests.
- [Access the kcp admin workspace](/how-to-guides/access-kcp-admin.md) to inspect the workspace tree the agent navigated.
