# Why Platform Mesh?

Platform Mesh exists to make services discoverable, orderable, and manageable through a common declarative API model.

Traditional infrastructure often separates IaaS, PaaS, and SaaS into different layers, tools, and lifecycle models. Platform Mesh treats those service capabilities as declarative resources that can be offered by providers and consumed through a consistent Kubernetes Resource Model interface.

## Problem

Service consumers need to discover and order capabilities without learning every provider's runtime, tenant model, and operational interface.

Service providers need to expose a clear API contract without giving consumers direct access to implementation details or service runtimes.

Platform owners need a shared control plane for identity, authorization, account structure, service discovery, and lifecycle integration.

## Approach

Platform Mesh separates the service management API from the actual service runtime.

- Providers publish declarative APIs for capabilities.
- Consumers bind those APIs into isolated account workspaces.
- Controllers reconcile requested resources into real services.
- Identity and authorization mediate access across provider and consumer boundaries.

## Design principles

Platform Mesh follows a declarative API model. APIs store desired state; controllers reconcile the real world toward that state.

It also favors decoupled components. A provider should be able to integrate with the mesh without becoming tightly coupled to every other platform component.

## Managed service provider pattern

A managed service provider exposes a lifecycle API for a service capability and owns the automation that fulfills requests for that capability.

This separates:

- the management API that consumers use to order and manage capabilities
- the provider runtime that implements the actual service

The result is a consistent consumer experience while providers retain implementation and operational independence.

## Related

- [Architecture](./architecture.md)
- [Personas](./personas/)
- [Account model](./account-model.md)
- [Integration paths](./integration-paths.md)
