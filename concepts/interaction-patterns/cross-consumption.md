# Cross-consumption

Cross-consumption describes teams composing services across provider boundaries. It is not a separate peer-to-peer consumer model; it is a way to describe how multiple provider APIs can be consumed together in one platform experience.

Use this pattern when a workload, team, or provider offering depends on capabilities from more than one provider.

## Participating personas

| Persona | Role in the pattern |
| --- | --- |
| Platform owner | Ensures account, identity, authorization, and discovery rules allow safe cross-provider consumption. |
| Service providers | Publish independent APIs that can be consumed together. |
| Service consumer | Selects and composes multiple provider APIs into an application or service workflow. |

## How it works

Platform Mesh gives consumers a consistent way to discover and consume APIs from multiple providers. Each provider remains responsible for its own API and runtime. Consumers compose those APIs by creating desired-state resources in their account workspace or through higher-level platform workflows.

![Cross consumption diagram](/diagrams/cross-consumption.svg)

Cross-consumption can also appear inside provider-to-provider relationships. A provider may consume several upstream providers to create a new offering, while still exposing a clean API to its own consumers.

## Ownership boundaries

The consumer owns the composition of requested capabilities. Each provider owns fulfillment for its own API. Platform Mesh owns the shared mediation layer that keeps discovery, authorization, account isolation, and API binding consistent across providers.

This avoids forcing every provider to directly integrate with every other provider, and avoids giving consumers direct access to provider runtimes.
