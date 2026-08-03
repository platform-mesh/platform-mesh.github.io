---
title: Air-gapped Platform Mesh deployment
personas: [platform-owner]
---

# Air-gapped Platform Mesh deployment

Install Platform Mesh in an environment that cannot reach public container registries.

You copy the whole product into your own registry once, with a single command. You then
tell the cluster to use that registry. From there the installation is the normal one.
Platform Mesh rewrites every image reference it manages so that nothing reaches out to
the internet.

::: warning Development preview
This is verified on Kind against a published release, but it is not yet guarded by a
release gate. Expect it to work; do not yet expect it to keep working without checking.
:::

## How it works

Platform Mesh ships as an [OCM](https://ocm.software) component: a manifest that lists
every chart and every image belonging to a release.

`ocm transfer` copies that component and all its images into your registry, and rewrites
the addresses inside the manifest as it goes. When the operator later installs a chart, it
reads the image address from the transferred manifest rather than from the chart's
defaults, and writes it into the Helm values.

That is the whole trick, and it has a pleasant consequence: there is no air-gap mode. The
same configuration works either way. Point it at a public registry and the injected values
happen to match the chart defaults; point it at yours and everything comes from yours.

## Before you start

You need:

- **OCM CLI v1**, version 0.24.0 or newer. Not the v2 CLI: releases are written by v1
  tooling, and the two generations handle uploads differently. Do not mix them against the
  same registry.
- **A registry** the target cluster can reach, and credentials that can push and pull.
- **Platform Mesh operator v0.83.0 or newer.** Older versions inject only the image tag and
  leave the registry pointing at the public default, so the transfer has no effect.

::: warning Use the charts from the release
Third-party charts are fine. openfga, cert-manager, Traefik, etcd-druid and the
OpenTelemetry operator are all upstream charts and all get localized. What matters is not
who wrote the chart but that the release knows how to address its images: which values
field holds them, and whether that field expects a separate registry or a host-qualified
repository.

That knowledge is tied to a chart version. If you install a different version than the one
in the release, or a fork, or a copy you patched, the values field may have moved and the
injection lands nowhere. Nothing will tell you: the release installs, the pods start, and
they pull from the chart's own defaults.
:::

## 1. Copy the release into your registry

On a machine with internet access, pull the release into a transport archive:

```bash
ocm transfer componentversion \
  --recursive --copy-resources \
  ghcr.io/platform-mesh//github.com/platform-mesh/platform-mesh:<version> \
  ./platform-mesh-<version>.ctf
```

Both flags matter. `--recursive` follows references to the components a release is built
from; `--copy-resources` puts the images themselves into the archive instead of leaving
pointers to where they used to live.

Carry the archive across the gap, as a directory or a tar, and push it into your
registry:

```bash
ocm transfer componentversion \
  ctf::./platform-mesh-<version>.ctf//github.com/platform-mesh/platform-mesh:<version> \
  registry.internal/platform-mesh
```

Then check that the images really arrived as images:

```bash
ocm get componentversions -r registry.internal/platform-mesh//github.com/platform-mesh/platform-mesh:<version> -o yaml \
  | grep -A2 'type: ociImage'
```

Each entry should say `type: ociArtifact` and point into your registry. If you see
`localBlob` instead, that image was carried across but never unpacked into the registry.
The operator cannot use it, and the corresponding `Resource` will stay not ready.

## 2. Tell the cluster which registry to use

The transfer changed the addresses *inside the manifest*. It did not tell your cluster
where to find the manifest in the first place. That is what the `Repository` object does:

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: Repository
metadata:
  name: platform-mesh
  namespace: platform-mesh-system
spec:
  interval: 15m
  repositorySpec:
    type: OCIRegistry
    baseUrl: registry.internal
    subPath: platform-mesh
```

::: tip Do not leave the interval at one minute
An installation has around sixty `Resource` objects, and each of them resolves against
this repository. At a one-minute interval that is a steady stream of requests for
something that only changes when you transfer a new release. A self-hosted Harbor will
start rate-limiting you.

Fifteen minutes is a reasonable starting point. Nothing depends on a short interval here:
a new release is picked up when you change the version, not when the repository polls.
:::

This object is not something extra you create for air-gapped installs. It is part of the
bootstrap manifests you apply anyway, next to Flux and the OCM controller. You are
changing one field in it.

It also has to be you, not the operator. The operator's own image lives in that registry,
so the address must be known before the operator can run at all.

**This is the only air-gap-specific change.** Everything after this is the normal
installation.

## 3. Install

Install as usual. For each image, the operator creates a `Resource` object, looks up its
address in the transferred manifest, and writes it into the Helm values before the chart
is applied.

## What you have to mirror yourself

Two groups of images are outside the operator's reach.

**The bootstrap layer** runs before the operator exists, so it cannot be localized by it:
the six Flux controllers, the OCM controller, and kro.

**Your Kubernetes distribution**: API server, controller manager, scheduler, proxy,
CoreDNS, etcd, your CNI, your storage provisioner. These have nothing to do with Platform
Mesh.

Everything else, including the operator's own image, is handled for you.

## Check that it worked

**Did every image get an address?** Empty columns mean nothing was injected:

```bash
kubectl get resources.delivery.ocm.software -A \
  -o custom-columns='NAME:.metadata.name,TAG:.status.additional.tag,REPO:.status.additional.repository'
```

**Is anything still pulling from outside?** Bootstrap and distribution images are expected
here; anything else is a gap:

```bash
kubectl get pods -A -o jsonpath='{range .items[*]}{.spec.containers[*].image}{"\n"}{end}' \
  | tr ' ' '\n' | sort -u | grep -v registry.internal
```

**Did anything fail to pull?**

```bash
kubectl get pods -A --field-selector=status.phase!=Running
```

::: tip These checks only mean something with the gap closed
While the cluster still has internet access, a wrongly configured image pulls happily from
its public default. Every check above passes and the installation is still not air-gap
capable. Run them once with egress blocked, or they prove nothing.
:::

## When something goes wrong

**A pod pulls from Docker Hub, which you never configured anywhere.**

This looks stranger than it is. Some charts expect the registry to be part of
`image.repository`, so `ghcr.io/kcp-dev/kcp-operator` rather than a separate `registry`
field. If the operator writes the repository without the host, the reference is no longer
qualified, and the container runtime completes it for you. On containerd and Docker that
means `docker.io`, so a missing host surfaces as a Docker Hub pull. On CRI-O it depends on
`unqualified-search-registries`, and the pull may fail outright instead.

Those images need the `image-ref: combined` annotation, which keeps the registry inside the
repository. It affects openfga, kcp-operator, init-agent, etcd-druid and the OpenTelemetry
operator.

**A `Resource` stays not ready with `resource with identity … not found`.**

The release you transferred does not declare that image. Check the component version.

**A service pulls from the public registry and nothing reports an error.**

The service has no image declared, so no `Resource` was created and the chart default
applies. Nothing fails, nothing warns, and you only notice once the gap is closed. The second
check above finds these.
