# Guides

Hands-on guides for building and integrating with Platform Mesh. These guides walk you through real-world tasks with copy-pasteable examples.

::: tip Prerequisites
All guides assume you have a running Platform Mesh instance. If you haven't set one up yet, start with the [Quick Start](/getting-started/quick-start).
:::

## Available Guides

- **[Provider Quick Start](./provider-quick-start)** — Build your first service provider using api-syncagent. Walks through publishing a CRD as an APIExport and verifying bidirectional sync. *Audience: Service Providers | Difficulty: Beginner*

- **[HttpBin Provider Example](./httpbin-example)** — Deep dive into the httpbin Managed Service Provider demo from the provider's perspective. Covers architecture, CRD design, APIExport configuration, and the full reconciliation flow. *Audience: Service Providers | Difficulty: Intermediate*

- **[MongoDB Provider Example](./mongodb-example)** — Build a custom provider using multi-cluster-runtime instead of api-syncagent. Covers the MongoDB Community Operator integration with a custom Go controller. *Audience: Service Providers | Difficulty: Advanced*

## Choosing a Guide

| Guide | Integration Path | Code Required | Best For |
|-------|-----------------|---------------|----------|
| Provider Quick Start | api-syncagent | YAML only | Getting started, standard CRD-based services |
| HttpBin Example | api-syncagent | YAML only | Understanding the full provider architecture |
| MongoDB Example | multi-cluster-runtime | Go code | Custom sync logic, non-CRD APIs |

For background on these integration paths, see [Service Providers](/overview/providers).
