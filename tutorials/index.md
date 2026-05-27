# Learning path

Tutorials are for learning by doing. Follow them in order if this is your first time using Platform Mesh.

## Before you start

Set up a local Platform Mesh environment first: [Set up Platform Mesh locally](/how-to-guides/set-up-platform-mesh-locally.md). The tutorials assume a running cluster.

## Recommended sequence

1. [Explore the example MSP](./explore-example-msp.md) - use the portal, create an organization and account, and provision the example HttpBin service.
2. [Provider quick start](./provider-quick-start.md) - publish the HttpBin provider API with api-syncagent and verify the consumer flow.
3. [Consume a service from a controller](./consume-service-from-controller.md) - run a Go controller that watches HttpBin resources from the consumer side.
4. [Build a multicluster-runtime provider](./build-multicluster-runtime-provider.md) - run a custom Go provider controller that syncs MongoDB resources across clusters.

## After the tutorials

Use [How-to guides](/how-to-guides/) for specific local tasks, or read [Concepts](/concepts/) to understand the architecture behind what you just ran.

## Community and support

Platform Mesh welcomes contributions from the community. The project's [contributing guide](https://github.com/platform-mesh/.github/blob/main/CONTRIBUTING.md) covers how to find work, open pull requests, and review changes. If you have any questions or want to leave feedback, please reach out via [our community channels](/community/).

## Related sections

- [How-to guides](/how-to-guides/) - task-focused operational instructions.
- [Concepts](/concepts/) - architecture, personas, and interaction patterns.
- [Reference](/reference/) - component and object reference material.
