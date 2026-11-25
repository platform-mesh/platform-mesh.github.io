# Platform Mesh Manifesto

## What is Platform Mesh?
Platform Mesh provides a decentralized marketplace
- For service providers to publish their services
- For consumers to order those services

## Why Platform Mesh?

Platform Mesh exists to solve the problem of vendor lock-in. It makes services from any vendors discoverable, orderable, and manageable.

## Benefits
Platform Mesh serves three personas: platform owners, service providers, and service consumers. Read more about [Personas](https://platform-mesh.io/main/concepts/personas/)
- Platform owners: who run a Platform Mesh instance
    - No vendor lock-in, get governance and centralized management such as identity, accounts structure, observability, metering (planned)
- Service providers: who provide their services
    - Can easily offer their services, can leverage out-of-the-box declarative UI for service configuration
- Service consumers: who use services
    - Can easily discover available services and order them. No vendor lock-in

## Use cases
- Internal service platform: For your application developers to order services they need
- Interconnected service platform: For connecting several service platforms together and managing them in one place

## Why Platform Mesh and not other similar decentralized offers?
- Consumers (usually application developers) can order services using tools they are already familiar - kubectl
- Lower bus factor: open source, many active maintainers, under NeoNephos Foundation
- Out-of-the-box experience: governance, centralized management, UI Portal, declarative UI for services to bootstrap your own marketplace

## What Platform Mesh IS NOT?
- A single publicly available central platform where service providers and consumers can publish or consume services. Right now, our adopters install and run their own Platform Mesh instance in their own environment. This might change in the future, if someone decides to operate a publicly available Platform Mesh for general service providers and consumers.