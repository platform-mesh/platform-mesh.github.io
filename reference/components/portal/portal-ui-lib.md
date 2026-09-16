# Portal UI library

## Purpose

The **Portal UI library** (`@platform-mesh/portal-ui-lib`) is the Angular library the [Portal](../portal.md) frontend is built with. It builds on the generic [`@openmfp/portal-ui-lib`](https://www.npmjs.com/package/@openmfp/portal-ui-lib), which provides the Luigi-based portal shell, and adds the implementations required for Platform Mesh functionality: kcp workspace-aware navigation, resource access through the [Kubernetes GraphQL gateway](../kubernetes-graphql-gateway.md), permission checks, and a set of reusable web components.

The library ships two artifacts:

- **Angular library** — service implementations, models, and utilities consumed by the Portal frontend at build time
- **Web component bundle** — `platform-mesh-portal-ui-wc.js`, a set of self-registering custom elements that Luigi loads at runtime

## Package contents

The Angular library is split into secondary entry points:

| Entry point | Contents |
|---|---|
| `@platform-mesh/portal-ui-lib/portal-options` | `*ServiceImpl` classes passed to `providePortal()` from `@openmfp/portal-ui-lib`: custom global nodes, header bar (breadcrumbs, namespace selection), Luigi extended global context, navigation redirect strategy, node change hook, node context processing, routing, user profile, and the persistent panel listener |
| `@platform-mesh/portal-ui-lib/services` | Resource and gateway services (Apollo-based GraphQL), instance permissions, account info, logical cluster, kubeconfig Secret, and organization readiness |
| `@platform-mesh/portal-ui-lib/models` | Resource, UI definition, permissions, and account info types |
| `@platform-mesh/portal-ui-lib/utils` | Helpers for JSON paths, GraphQL query building, and resource sanitization |

The web component bundle registers the following custom elements:

| Element | Purpose |
|---|---|
| `generic-list-view` | Generic resource list with create and delete |
| `generic-detail-view` | Generic resource detail page |
| `organization-management` | Organization onboarding and selection |
| `welcome-view` | Welcome page shown outside an organization context |
| `error-component` | Error page |

## Generic UI

The generic UI lets you render list, detail, and create views for any Kubernetes or kcp resource without building a dedicated microfrontend. Instead of shipping UI code, you describe the resource and its views declaratively in the node's [`ContentConfiguration`](/reference/resources/content-configuration.md), and the generic UI web components query the resource through the Kubernetes GraphQL gateway.

### Components

- `generic-list-view` — displays a table of resources, and handles creation and deletion of resources
- `generic-detail-view` — displays an individual resource

### Node configuration

A Luigi node uses a generic UI component by pointing its `url` at the web component bundle and marking it as self-registered:

```json
{
  "url": "/assets/platform-mesh-portal-ui-wc.js#generic-list-view",
  "webcomponent": { "selfRegistered": true, "type": "module" },
  "navigationContext": "accounts"
}
```

A `generic-detail-view` node that is a child of a list view entity inherits its context through Luigi. An independent detail view node provides its own `context.resourceDefinition`.

### Resource definition

The node `context.resourceDefinition` describes the resource and how to render it:

| Field | Purpose |
|---|---|
| `apiGroup`, `version`, `entityCollection`, `entity`, `scope`, `namespace` | Identify the resource in the GraphQL schema |
| `readyCondition` | Optional JSONPath expression and GraphQL properties that decide when a resource is ready |
| `availableWhenNotReady` | Optional; keeps a resource available for navigation and actions while it is not ready (default `false`) |
| `permissionsDefinition` | Optional instance-level and resource-level permission checks that gate the create button, list requests, live-update subscriptions, and edit or delete actions; unknown permissions fail open |
| `ui.logoUrl` | Resource type logo shown in the view header |
| `ui.listView` | Table columns (`fields`), row `actions`, title, description, and optional filter tabs |
| `ui.detailView` | Displayed `fields`, header `actions`, title, description, and `showDownloadKubeconfig` |
| `ui.createView` | Form `fields` for creating and updating resources; for namespaced resources a namespace field is added when no namespace is resolved |

### Field definitions

Every column, form field, and action is a `FieldDefinition`. Field definitions support:

- **Data access** — `property` (with fallback paths), `jsonPathExpression`, and `propertyField` with text transforms
- **Grouping** — multiple values in a single column or row through `group`
- **Rendering** — `uiSettings.displayAs` as `secret`, `boolIcon`, `link`, `tooltip`, `img`, or `button`, plus copy buttons and conditional CSS rules
- **Actions** — `navigate`, `openInModal`, `delete-resource`, and `download-kubeconfig-from-secret-ref`, optionally gated by `requirePermission`
- **Form input** — `required`, static `values`, and `dynamicValuesDefinition` that loads options through a GraphQL query with `{context.<path>}` placeholders resolved from the Luigi context
- **Arrays of objects** — `propertyCollection`, including nested collections, for fields such as `status.conditions`

### Defaults

When neither `listView` nor `detailView` is provided, default views are used. When `createView` is not provided, the view offers no way to create a resource.

For the complete configuration reference and full `ContentConfiguration` examples, see the [generic UI guide](https://github.com/platform-mesh/portal-ui-lib/blob/main/docs/readme-generic-ui.md).

## Angular configuration

A portal application that serves the web component bundle includes the library assets in its `angular.json` build configuration:

```json
{
  "assets": [
    {
      "glob": "**",
      "input": "node_modules/@platform-mesh/portal-ui-lib/assets/",
      "output": "/assets/"
    }
  ]
}
```

## Repository

- [github.com/platform-mesh/portal-ui-lib](https://github.com/platform-mesh/portal-ui-lib)
- [Generic UI guide](https://github.com/platform-mesh/portal-ui-lib/blob/main/docs/readme-generic-ui.md)

## Related

- [Portal](../portal.md)
- [Portal server library](./portal-server-lib.md)
- [Kubernetes GraphQL gateway](../kubernetes-graphql-gateway.md)
- [ContentConfiguration resource](/reference/resources/content-configuration.md)
