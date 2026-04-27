# IAM service

## Purpose

The IAM service provisions and reconciles per-account OpenFGA stores, manages the relationship-based authorization model, and exposes IAM operations consumed by the portal and other Platform Mesh components.

## Runtime role

It owns the lifecycle of IAM Stores (the per-account authorization stores backed by OpenFGA), seeds them with the initial authorization model, and updates them as APIBindings activate or accounts change. It is the runtime peer of the [Account operator](./account-operator.md) for everything authorization-related.

## Repository

- Repository to be confirmed.

## Related epic task

- [platform-mesh/backlog#242](https://github.com/platform-mesh/backlog/issues/242)

## Future component reference

Add the Store custom resource API, account-to-store mapping, dynamic schema updates on APIBinding activation, deployment and configuration, failure modes, and troubleshooting.

## Related

- [IAM UI](./iam-ui.md)
- [OpenFGA](./openfga.md)
- [rebac-authz-webhook](./rebac-authz-webhook.md)
- [Identity and authorization](/concepts/identity-and-authorization.md)
