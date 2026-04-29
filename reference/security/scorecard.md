# OpenSSF Scorecard

## What it is

[OpenSSF Scorecard](https://scorecard.dev) is an automated tool from the Open Source Security Foundation (OpenSSF) that assesses repositories against a set of [security best-practice checks](https://github.com/ossf/scorecard/blob/main/docs/checks.md) and assigns each a score of 0–10. Unlike vulnerability scanners that flag specific CVEs, Scorecard evaluates the project's **security posture** - whether the repository is configured to prevent vulnerabilities from being introduced in the first place.

## Why we use it

Scorecard gives Platform Mesh continuous, public posture monitoring:

- **Surfaces regressions** - runs on every push to `main` and weekly, so policy drift is caught quickly rather than discovered in a security audit.
- **Public visibility** - results are published to `scorecard.dev` and linked via a per-repo badge, so adopters can verify our security hygiene without having to audit the repositories themselves.
- **Complements other tools** - Renovate handles automated dependency updates and the Scorecard verifies that the surrounding process (branch protection, code review, signed artifacts, etc.) is in good shape.

## How it's configured

We use a reusable workflow defined in [`platform-mesh/.github`](https://github.com/platform-mesh/.github): `platform-mesh/.github/.github/workflows/job-ossf-scorecard.yml`.

Each participating repository calls it from its own caller workflow. In this repository the caller is [`.github/workflows/ossf-scorecard.yml`](https://github.com/platform-mesh/platform-mesh.github.io/blob/main/.github/workflows/ossf-scorecard.yml). It triggers on:

- Push to `main`
- Weekly cron (Mondays at 04:30 UTC)
- Manual `workflow_dispatch`

## Which repositories are scored

Scorecard is applied to the repositories that ship the Platform Mesh product - core services and operators, shared libraries, and shipped artifacts - as well as repositories that adopters depend on directly:

- `security-operator`, `account-operator`, `platform-mesh-operator`, `extension-manager-operator`
- `iam-service`, `iam-ui`, `kubernetes-graphql-gateway`, `portal`, `resource-broker`
- `virtual-workspaces`, `rebac-authz-webhook`
- `golang-commons`, `subroutines`, `portal-server-lib`, `portal-ui-lib`
- `helm-charts`, `custom-images`, `upstream-images`
- `provider-quickstart`, `ocm`, `platform-mesh.github.io`
- `platform-mesh/.github`

Samples, templates, PoCs, and meta repositories (e.g., `backlog`, `architecture`, `community`) are intentionally excluded. Applying Scorecard to repositories that have no releases, no shipped binaries, or are meant to be copied rather than depended on produces misleading low scores on checks that simply do not apply. See the discussion on [backlog#227](https://github.com/platform-mesh/backlog/issues/227) for the full rationale and the canonical list.

## Where to see results

| Location | What you see |
|---|---|
| Repository `README.md` | Badge linking to the public Scorecard viewer for that repo |
| [scorecard.dev viewer](https://scorecard.dev/viewer/?uri=github.com/platform-mesh/platform-mesh.github.io) | Detailed breakdown of every check, with pass/fail and a short explanation |
| GitHub **Security** tab → Code scanning | SARIF results uploaded after each run; visible to org members |

## How to interpret scores

Each check is scored independently and the overall score is a weighted average from 0 (worst) to 10 (best). The [OpenSSF checks documentation](https://github.com/ossf/scorecard/blob/main/docs/checks.md) explains what each check measures and how to improve it. A score of 7 or above is generally considered a healthy posture for an actively maintained open-source project. If a check is failing, the Scorecard viewer shows the specific reason and links to remediation guidance.
