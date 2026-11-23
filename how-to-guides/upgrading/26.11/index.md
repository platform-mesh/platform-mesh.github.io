# Upgrading from Platform Mesh 26.10 to 26.11

These steps are for an installation made with the `platform-mesh-prerequisites` and `platform-mesh-operator` charts, whose profile is the `platform-mesh-profile` ConfigMap in the cluster. `pmctl migrate` moves the data. You upgrade the two charts and apply the new profile yourself.

::: warning Maintenance window
OpenFGA is stopped from step 1 until the rollout in step 4 is done, and Keycloak restarts during the rollout.
:::

If your profile lives somewhere else, such as a GitOps repository, `pmctl migrate` cannot change it. In that case, migrate the data [by hand](openfga-cnpg.md) and make the profile change of step 3 in the repository that owns the profile.

## What changes in 26.11

| Change | What you do |
| --- | --- |
| OpenFGA moves from its bundled PostgreSQL to the shared CNPG cluster. | Run `pmctl migrate` before and after the upgrade (steps 1 and 5). No other change moves data. |
| `security-operator` becomes `pm-openfga-operator`, `rebac-authz-webhook` becomes `pm-openfga-authz-webhook`, and the OpenFGA kinds move to `openfga.platform-mesh.io`. | Nothing during the upgrade, because the operator migrates it. See [OpenFGA API group](openfga-api-group.md). |
| The Keycloak integration moves to `pm-keycloak-operator` and `keycloak.platform-mesh.io`. | Nothing during the upgrade, because the operator migrates it. See [Keycloak API group](keycloak-api-group.md). |

## Before you start

You need:

- `kubectl` and `yq`
- Helm 3.14 or newer (for `--reset-then-reuse-values`)
- `pmctl` of the version you upgrade to, from the [release assets](https://github.com/platform-mesh/platform-mesh/releases)

```shell
export KUBECONFIG=<kubeconfig of the cluster Platform Mesh runs in>
export NS=platform-mesh-system
export FROM=v26.10.2          # the installed version
export V=26.11.0              # the version to upgrade to
export REPO=oci://ghcr.io/platform-mesh/helm-charts
```

Run every step from the same directory. `pmctl migrate` keeps its backup in `./pmctl-migrate` and reads it again in step 5.

::: tip Try it on a local cluster first
`pmctl quickstart` installs a release into a kind cluster the same way the charts do, so you can run the whole upgrade there before you touch a real installation:

```shell
pmctl quickstart --version v26.10.2
export KUBECONFIG=$PWD/platform-mesh.kubeconfig

# Sign up in the portal and create an organization and an account,
# so that there is data to move.

pmctl migrate --from v26.10.2
pmctl quickstart --version $V        # does steps 2 to 4 at once
pmctl migrate --from v26.10.2 --phase after
```

`pmctl quickstart delete` removes the cluster.
:::

## 1. Migrate the data

First check what the upgrade needs. The dry run lists the migration `openfga-cnpg` and changes nothing:

```shell
pmctl migrate --dry-run
```

Then run the migration:

```shell
pmctl migrate --from $FROM
```

`pmctl` stops OpenFGA through the profile, dumps the bundled PostgreSQL, restores the dump into CNPG, and compares both databases. It keeps the dump and the old profile in `./pmctl-migrate`. OpenFGA stays stopped until the upgrade.

::: danger Do not continue if the migration fails
Without the migration, OpenFGA comes up on an empty database after the upgrade, and every user loses every role.
:::

## 2. Upgrade the prerequisites chart

```shell
helm upgrade platform-mesh-prerequisites $REPO/platform-mesh-prerequisites \
  -n $NS --version $V --reset-then-reuse-values --wait
```

Use `--reset-then-reuse-values`, not `--reuse-values`, here and in step 4. `--reuse-values` ignores the defaults the new chart adds, and the operator chart then fails with `nil pointer evaluating interface {}.extraFeatureToggles`.

## 3. Render the 26.11 profile

Helm does not touch the profile on an upgrade, and 26.11 needs a new one that points OpenFGA at CNPG and enables the renamed components. Render it now and apply it in step 4.

```shell
helm get values platform-mesh-operator -n $NS -o yaml > pm-values.yaml

helm template platform-mesh-operator $REPO/platform-mesh-operator \
  -n $NS --version $V -f pm-values.yaml --set-string ocm.version=$V \
  | yq 'select(.kind == "ConfigMap" and .metadata.name == "platform-mesh-profile")' \
  > pm-profile-$V.yaml

grep -c pm-openfga-operator pm-profile-$V.yaml   # must not be 0
```

The result is the profile the chart ships for your `ocm.profile` (`kind` or `production`). If you changed the profile of your installation, make the same changes in `pm-profile-$V.yaml`. You can look them up in `pmctl-migrate/openfga-cnpg-profile-before.yaml`, which is the profile as it was before step 1.

## 4. Upgrade the operator chart and apply the profile

Run this as one command, so that the new operator never reconciles the old profile. [Troubleshooting](#a-helmrelease-hangs-in-running-upgrade-action) describes what happens if it does.

```shell
kubectl -n $NS annotate configmap platform-mesh-profile helm.sh/resource-policy=keep --overwrite && \
helm upgrade platform-mesh-operator $REPO/platform-mesh-operator \
  -n $NS --version $V --reset-then-reuse-values --set-string ocm.version=$V && \
kubectl apply -f pm-profile-$V.yaml && \
kubectl -n $NS annotate platformmesh platform-mesh \
  reconcile.fluxcd.io/requestedAt="$(date -u +%Y-%m-%dT%H:%M:%SZ)" --overwrite
```

The ConfigMap annotation comes first because the chart refuses to upgrade over a profile it created without it.

Wait for the rollout:

```shell
kubectl -n $NS get platformmesh,helmreleases -w
```

The rollout is done when the `PlatformMesh` is `Ready` and every HelmRelease is `True`. By then the HelmReleases `security-operator` and `rebac-authz-webhook` are gone, and `pm-openfga-operator`, `pm-openfga-authz-webhook`, and `pm-keycloak-operator` exist. On a kind cluster this takes 5 to 10 minutes.

## 5. Check the migration

```shell
pmctl migrate --from $FROM --phase after
```

The `after` phase is read-only. It checks that OpenFGA runs on CNPG and that the moved data is there.

## 6. Verify

```shell
kubectl -n $NS logs deploy/platform-mesh-operator | grep -E "keycloak-apigroup-split|openfga-apigroup-split"
kubectl -n $NS get statefulset openfga-postgres                      # NotFound
kubectl -n $NS get deployments | grep -E "security-operator|rebac"   # nothing
```

Log in to the portal as an existing user and check that the organizations and accounts are there and that the user still has access to them. If roles are missing, the OpenFGA migration failed.

## 7. Clean up

Keep the following until you are sure you will not roll back, then remove them:

- Your own `APIExportPolicy`, `IdentityProviderConfiguration`, and `Invite` manifests, and the orphaned `rebac-authz-webhook-*` and `security-*` certificates and secrets. Follow the checklists for the [OpenFGA API group](openfga-api-group.md#operator-checklist) and the [Keycloak API group](keycloak-api-group.md#operator-checklist).
- The PersistentVolumeClaim `data-openfga-postgres-0`, which still holds the old OpenFGA database.
- The `./pmctl-migrate` directory. It holds the dump and the old profile, which can contain credentials.

## Troubleshooting

### `pmctl migrate --phase after`: the profile has not been switched

```
the datastore of OpenFGA does not point at CNPG cluster platform-mesh-pg: the profile has not been switched
```

The 26.11 profile is not applied, so OpenFGA still uses the old database, which is intact. Render the profile (step 3), run the `kubectl apply` of step 4, and run the phase again.

### A HelmRelease hangs in `Running 'upgrade' action`

If the 26.11 operator reconciles the 26.10 profile, even for the few seconds between the two halves of step 4, the pods it rolls out get a gateway address in `hostAliases` that does not exist (`10.96.188.4`). They cannot reach the identity provider and fail. Flux waits 15 minutes for them before it goes on, which also delays the removal of `security-operator`.

Compare the address in the deployments with the address of the gateway:

```shell
kubectl -n $NS get svc platform-mesh-prerequisites-traefik -o jsonpath='{.spec.clusterIP}{"\n"}'
kubectl -n $NS get deployments -o json \
  | jq -r '.items[] | select(.spec.template.spec.hostAliases) | "\(.metadata.name) \(.spec.template.spec.hostAliases[0].ip)"'
```

If the addresses differ, you only need to wait. Once the 26.11 profile is applied, the HelmReleases are correct again, and the hanging ones are retried or removed when their timeout is over.

### The PlatformMesh reports `pm-keycloak-operator-ca-secret` not found

The operator is on 26.11 and the profile is still on 26.10, which does not enable `pm-keycloak-operator`. Apply the 26.11 profile.
