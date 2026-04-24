# ContentConfiguration

**ContentConfiguration** is the Platform Mesh custom resource that registers a UI extension with the Platform Mesh Portal. It carries a [Luigi](https://luigi-project.io/) configuration fragment that tells the Portal how a micro-frontend should appear in the navigation, what entity it represents, and how it should behave.

::: info Where it comes from
ContentConfiguration is defined in the API group `ui.platform-mesh.io/v1alpha1`. It is processed by the Extension Manager Operator (running inside the Portal stack), which validates the configuration, resolves any remote references, and stores the processed result in the resource's `.status` so the Portal can serve it without a runtime dependency on remote endpoints.
:::

## Schema

```yaml
apiVersion: ui.platform-mesh.io/v1alpha1
kind: ContentConfiguration
metadata:
  name: account-home
  labels:
    ui.platform-mesh.io/entity: core_platform-mesh_io_account
spec:
  inlineConfiguration:
    contentType: json   # json | yaml
    content: |-
      {
        "name": "overview",
        "luigiConfigFragment": {
          "data": {
            "nodes": [ ... ]
          }
        }
      }
  # OR remote-loaded:
  # remoteConfiguration:
  #   url: https://example.com/config.yaml
  #   authentication:
  #     type: bearer
  #     secretRef:
  #       name: example-credentials
```

| Field | Purpose |
|---|---|
| `metadata.labels["ui.platform-mesh.io/entity"]` | Attaches this configuration to a navigation entity in the Portal (e.g., `core_platform-mesh_io_account` to extend Account pages). |
| `spec.inlineConfiguration.content` | Luigi config fragment delivered directly. Best for small, self-contained UI extensions. |
| `spec.inlineConfiguration.contentType` | `json` or `yaml` — how to parse `content`. |
| `spec.remoteConfiguration.url` | URL to fetch the Luigi config from. Best when the UI team owns the config independently from the cluster. |
| `spec.remoteConfiguration.authentication` | Auth for the remote URL: `none`, `basic`, `bearer`, or `clientCredentials` with a `secretRef`. |

## Who Creates It

| Use case | Created by |
|---|---|
| Built-in Portal pages (e.g., the Account dashboard) | Platform owner, deployed alongside the Portal as part of the Platform Mesh installation. |
| Provider-supplied extensions (e.g., a custom UI for a database service) | Service provider, packaged with their service or applied during marketplace onboarding. |
| Tenant-specific extensions | Account admin, applied inside the Account's workspace. |

The ContentConfiguration must be created **in a workspace where the Portal's Extension Manager Operator can reconcile it** — typically a Platform Mesh system workspace for built-ins and provider workspaces for service extensions.

## What Happens When You Apply One

1. The Extension Manager Operator picks up the new ContentConfiguration.
2. If `remoteConfiguration` is set, it fetches the remote content (using the configured authentication).
3. It validates the Luigi config fragment against the Portal's schema.
4. It writes the processed (validated, normalized) configuration to `.status`.
5. The Portal queries `.status` at request time to render navigation and load the micro-frontend.

This processing model keeps the Portal highly available: the Portal does not call out to remote URLs at request time, so a failing extension endpoint cannot bring the Portal down.

## Example: Account Dashboard Extension

The following ContentConfiguration registers a "Dashboard" tab on every Account page in the Portal:

```yaml
apiVersion: ui.platform-mesh.io/v1alpha1
kind: ContentConfiguration
metadata:
  name: account-home
  labels:
    ui.platform-mesh.io/entity: core_platform-mesh_io_account
spec:
  inlineConfiguration:
    contentType: json
    content: |-
      {
        "name": "overview",
        "luigiConfigFragment": {
          "data": {
            "nodes": [{
              "entityType": "main.core_platform-mesh_io_account",
              "pathSegment": "dashboard",
              "label": "Dashboard",
              "url": "/assets/platform-mesh-portal-ui-wc.js#generic-detail-view",
              "webcomponent": { "selfRegistered": true }
            }]
          }
        }
      }
```

The label `ui.platform-mesh.io/entity: core_platform-mesh_io_account` tells the Portal: "When rendering an Account page, include this configuration's nodes." The `entityType: main.core_platform-mesh_io_account` inside the Luigi config places the navigation node in the main slot for Account pages.

## Trade-offs

- Inline configurations are limited by the Kubernetes resource size limit (~1 MiB total, less in practice once status is populated). Large extensions should use `remoteConfiguration`.
- Remote configurations require periodic reconciliation to pick up changes — there is no live trigger when the remote endpoint updates.
- Validation happens before configuration is applied, which improves reliability but means broken configs surface as `.status` errors rather than runtime portal failures.

## Where This Appears

- The Platform Mesh Portal renders all UI extensions by reading processed ContentConfigurations.
- Provider services that ship their own UI bundle a ContentConfiguration as part of their marketplace listing.
- The local-setup chart applies several ContentConfigurations to register the built-in Account, Namespace, and core entity views.

## What's Next

- [**Architecture**](/overview/architecture) — see where the Extension Controller fits in the Portal stack
- [**Service Providers**](/overview/providers) — when and why a provider would ship UI extensions
- [Luigi documentation](https://luigi-project.io/docs/) — the upstream micro-frontend framework that defines the config schema
