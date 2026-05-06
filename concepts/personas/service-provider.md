# Service provider

Service providers build and operate services that can be consumed through Platform Mesh. They define the declarative API contract for a capability and own the automation that turns consumer intent into real service instances.

Provider examples include teams offering databases, certificates, CI/CD pipelines, AI infrastructure, or internal platform services.

## Goal

Expose a service capability through a stable API while keeping implementation details, runtime topology, and provider operations behind the provider boundary.

## Responsibilities

- Define the service API consumers use to request and manage capabilities.
- Publish that API through Platform Mesh so consumers can discover and bind it.
- Reconcile consumer desired state into provider-owned runtime resources.
- Report lifecycle status back to consumers.
- Choose the right integration path for the provider's API and controller model.

## Ownership boundary

The provider owns **what** can be ordered (the API schema) and **how** it gets fulfilled (the controller logic). They do not own the consumer's workspace, the consumer's resources, or the platform runtime. The API contract is the only surface visible across that boundary; everything behind it — clusters, VMs, SaaS calls, internal databases — stays inside the provider.

This separation keeps the lifecycle API consistent even when the underlying implementation changes. A provider can migrate from self-hosted infrastructure to a managed cloud service without breaking consumer workflows.

## Common questions

- Should this provider use api-syncagent or multicluster-runtime?
- Which CRDs or APIs should be exposed to consumers?
- How does consumer desired state reach the provider runtime?
- How does provider status flow back to the consumer workspace?
- How can one provider consume another provider's API?

## Recommended reading

Start with [Integration paths](../integration-paths.md) to choose a mechanism, then read [api-syncagent](../integration/api-syncagent.md) or [multicluster-runtime](../integration/multicluster-runtime.md) depending on the provider model. Use [Interaction patterns](../interaction-patterns/provider-to-consumer.md) to understand provider-to-consumer and provider-to-provider flows, and [API sharing](../api-sharing.md) for the contract between provider and consumer workspaces.

When you are ready for hands-on work, follow the [Provider quick start](/tutorials/provider-quick-start.md) tutorial for the api-syncagent path, then [Build a multicluster-runtime provider](/tutorials/build-multicluster-runtime-provider.md) for the custom-controller path.

## Related

- [Integration paths](../integration-paths.md)
- [API sharing](../api-sharing.md)
- [api-syncagent](/reference/components/api-syncagent.md)
- [multicluster-runtime](/reference/components/multicluster-runtime.md)
