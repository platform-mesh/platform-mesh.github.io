# Learning path

Tutorials are for learning by doing. Follow them in order if this is your first time using Platform Mesh.

## Before you start

Set up a local Platform Mesh environment first: [Set up Platform Mesh locally](/how-to-guides/set-up-platform-mesh-locally.md). The tutorials assume a running cluster.

## Recommended sequence

1. [Explore the example MSP](./explore-example-msp.md) - use the portal, create an organization and account, and provision the example HttpBin service.
2. [Provider quick start](./provider-quick-start.md) - publish the HttpBin provider API with api-syncagent and verify the consumer flow.

## Provider examples

Read these after the provider quick start to compare concrete provider implementation paths:

- [HttpBin provider example](./examples/httpbin-provider.md) - inspect the local demo provider that uses api-syncagent and PublishedResource.
- [MongoDB provider example](./examples/mongodb-provider.md) - inspect an advanced provider that uses multi-cluster-runtime and a custom Go controller.

## After the tutorials

Use [How-to guides](/how-to-guides/) for specific local tasks, or read [Concepts](/concepts/) to understand the architecture behind what you just ran.

## Related sections

- [How-to guides](/how-to-guides/) - task-focused operational instructions.
- [Concepts](/concepts/) - architecture, personas, and interaction patterns.
- [Reference](/reference/) - component and object reference material.
