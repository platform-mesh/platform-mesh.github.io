---
title: Air-gapped Platform Mesh deployment
personas: [platform-owner]
---

# Air-gapped Platform Mesh deployment

Install Platform Mesh in an environment that cannot reach public container registries.

You copy the whole product into your own registry once, using a single command. Then you
tell the cluster to use that registry. From there, installation works exactly like a normal
install: Platform Mesh rewrites every image reference it manages so nothing reaches out to
the internet.

::: warning Development preview
This is verified on Kind against a published release, but it is not yet guarded by a
release gate. Expect it to work; do not yet expect it to keep working without checking.
:::

## How it works

Platform Mesh ships as an [OCM](https://ocm.software) component: essentially a manifest
listing every chart and every image that belongs to a release.

Running `ocm transfer` copies that component, and all its images, into your registry. As it
copies, it rewrites the addresses inside the manifest to point at your registry instead of
the public one.

Later, when the operator installs a chart, it does not use the chart's default image
address. Instead it reads the address from the transferred manifest, and writes that into
the Helm values.

That is the whole trick, and it has a pleasant consequence: there is no separate air-gap
mode. The same configuration works either way. Point it at a public registry and the
injected values happen to match the chart defaults. Point it at your own registry and
everything comes from there instead.

## Before you start

You need:

- **OCM CLI v1**, version 0.24.0 or newer. This matters: not the v2 CLI. Releases are built
  with v1 tooling, and the two generations handle uploads differently, so mixing them
  against the same registry causes problems.
- **A registry** that the target cluster can reach, with credentials that can both push and
  pull.
- **Platform Mesh operator v0.83.9 or newer.** Older versions inject only the image tag and
  leave the registry pointing at the public default, so the transfer has no effect.

::: warning Use the charts from the release
Third-party charts are fine to use. openfga, cert-manager, Traefik, etcd-druid and the
OpenTelemetry operator are all upstream charts, and all of them get localized correctly.
What actually matters is not who wrote the chart, but whether the release knows how to
address its images: which values field holds the address, and whether that field expects a
separate registry or a full host-qualified repository path.

That knowledge is tied to one exact chart version. If you install a different version than
the one in the release, or a fork, or a copy you patched yourself, the values field may have
moved, and the image injection lands nowhere. Nothing will warn you about this: the release
installs, the pods start, and they quietly pull from the chart's own public defaults
instead.
:::

## 1. Copy the release into your registry

On a machine with internet access, pull the release into a transport archive:

```bash
ocm transfer componentversion \
  --recursive --copy-resources \
  ghcr.io/platform-mesh//github.com/platform-mesh/platform-mesh:<version> \
  ./platform-mesh-<version>.ctf
```

Both flags matter here. `--recursive` follows the references to every component the release
is built from. `--copy-resources` puts the actual images into the archive, instead of just
leaving pointers to where they currently live.

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

Each entry should say `type: ociArtifact` and point at your registry. If you see
`localBlob` instead, that image was carried across the gap but never unpacked into the
registry. The operator cannot use it, and the corresponding `Resource` will stay stuck in a
not-ready state.

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
A typical installation has around sixty `Resource` objects, and every one of them resolves
against this repository. At a one-minute interval, that adds up to a steady stream of
requests for something that only actually changes when you transfer a new release. A
self-hosted Harbor will start rate-limiting you well before that.

Fifteen minutes is a reasonable starting point. There is no benefit to a short interval
here: a new release is picked up as soon as you change the version, not when the repository
happens to poll.
:::

This object is not something extra you create for air-gapped installs. It is part of the
bootstrap manifests you apply anyway, next to Flux and the OCM controller. You are just
changing one field in it.

You do have to create this object yourself, though; the operator cannot do it for you. That
is because the operator's own image also lives in this registry, so the registry address
has to be known before the operator can even start running.

**This is the only change to how Platform Mesh itself resolves images.** Getting kubelet
to actually pull them is a separate step, covered next.

## 3. Grant pull access

Having a correct, localized image address is not the same thing as having permission to
pull it. Your registry almost certainly requires authentication, and neither the
`Repository` object above nor the operator itself grants any Pod that access. That
permission is strictly between your cluster and your registry; Platform Mesh does not
manage it.

Two things need to happen, in every namespace that will run a localized image:

1. **A pull secret exists, and every ServiceAccount that already exists references it.**

   ```bash
   kubectl create secret docker-registry registry-auth \
     --docker-server=registry.internal \
     --docker-username=<user> --docker-password=<password> \
     -n <namespace>

   kubectl patch serviceaccount default -n <namespace> \
     -p '{"imagePullSecrets": [{"name": "registry-auth"}]}'
   ```

2. **New ServiceAccounts get the same treatment automatically.** Most charts create their
   own dedicated ServiceAccount as part of their install, and that install usually happens
   well after you ran step 1 for that namespace. So patching only what exists today misses
   everything a later `HelmRelease` still creates. A `MutatingAdmissionPolicy` fixes this
   properly: instead of patching at one point in time, it attaches the pull secret
   automatically, every time a ServiceAccount is created:

   ```yaml
   apiVersion: admissionregistration.k8s.io/v1beta1
   kind: MutatingAdmissionPolicy
   metadata:
     name: inject-registry-pull-secret
   spec:
     failurePolicy: Fail
     matchConstraints:
       resourceRules:
       - apiGroups: [""]
         apiVersions: ["v1"]
         operations: ["CREATE", "UPDATE"]
         resources: ["serviceaccounts"]
     matchConditions:
     - name: not-already-set
       expression: '!has(object.imagePullSecrets) || !object.imagePullSecrets.exists(s, s.name == "registry-auth")'
     mutations:
     - patchType: JSONPatch
       jsonPatch:
         expression: |
           [
             JSONPatch{
               op: "add",
               path: "/imagePullSecrets",
               value: (has(object.imagePullSecrets) ? object.imagePullSecrets : []) +
                      [{"name": "registry-auth"}]
             }
           ]
   ---
   apiVersion: admissionregistration.k8s.io/v1beta1
   kind: MutatingAdmissionPolicyBinding
   metadata:
     name: inject-registry-pull-secret
   spec:
     policyName: inject-registry-pull-secret
   ```

   One detail worth noting: the patch type is `JSONPatch`, not `ApplyConfiguration`. In the
   OpenAPI schema, `imagePullSecrets` is an atomic list rather than a mergeable one, so a
   server-side-apply patch gets rejected outright whenever the create request already sets
   a value for it, even an empty `[]`. Some charts' own ServiceAccount templates do exactly
   that.

::: tip Flux needs its own credential separately
`OCIRepository.spec.secretRef` is resolved separately, by source-controller, in the
`OCIRepository`'s own namespace. This is independent of the ServiceAccount-based pulls that
kubelet does, described above. A chart's Helm-sourced OCI pull and its Pods' image pulls
both read from the same registry, but they authenticate through completely separate
mechanisms. So set `secretRef` on every `OCIRepository` that points at your registry too.
:::

## 4. Install

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
to show up here; anything else means a gap in your mirror:

```bash
kubectl get pods -A -o jsonpath='{range .items[*]}{.spec.containers[*].image}{"\n"}{end}' \
  | tr ' ' '\n' | sort -u | grep -v registry.internal
```

**Did anything fail to pull?**

```bash
kubectl get pods -A --field-selector=status.phase!=Running
```

::: tip These checks only mean something with the gap closed
While the cluster still has internet access, a misconfigured image will happily pull from
its public default instead of failing. Every check above can pass even though the
installation is not actually air-gap capable. Run them once with egress blocked, or they do
not prove anything.
:::

## When something goes wrong

**A pod pulls from Docker Hub, even though you never configured Docker Hub anywhere.**

This looks stranger than it actually is. Some charts expect the registry to be baked into
`image.repository` itself, for example `ghcr.io/kcp-dev/kcp-operator`, rather than having a
separate `registry` field. If the operator writes only the repository, without the host,
the reference is no longer fully qualified, so the container runtime fills in the missing
piece for you. On containerd and Docker, that default is `docker.io`, which is why a
missing host shows up as a Docker Hub pull. On CRI-O, the behavior depends on
`unqualified-search-registries`, and the pull may just fail outright instead.

Images like this need the `image-ref: combined` annotation, which keeps the registry folded
into the repository string. This affects openfga, kcp-operator, init-agent, etcd-druid and
the OpenTelemetry operator.

**A `Resource` stays not ready, with an error like `resource with identity … not found`.**

This means the release you transferred does not declare that image at all. Check that you
transferred the right component version.

**A service pulls from the public registry, and nothing reports an error.**

This service simply has no image declared for it, so no `Resource` was created, and the
chart's own default just applies quietly. Nothing fails, nothing warns you, and you will
not notice until the gap is actually closed. The second check above is what catches these.
