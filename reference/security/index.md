# Security

The Platform Mesh project hosts many different user-facing repositories under the [`platform-mesh`](https://github.com/platform-mesh) GitHub organization. This page describes how the project detects, triages, remediates, and discloses security vulnerabilities.

The scope of this document is:

- Vulnerabilities reported through the official security process described in the [SECURITY.md] file
- Vulnerabilities discovered in third-party dependencies

[SECURITY.md]: https://github.com/platform-mesh/.github/blob/main/SECURITY.md

## Security response team

A dedicated Security Response Team owns all vulnerability-related activity. Responsibilities include receiving and acknowledging vulnerability reports, reviewing automated findings, coordinating fixes, publishing GitHub Security Advisories and CVEs, and communicating with reporters and users throughout the process.

For an up-to-date list of all team members, see [the `platform-mesh/security` GitHub team](https://github.com/orgs/platform-mesh/teams/security).

## Reporting vulnerabilities

Do **NOT**:

- Report potential security vulnerabilities through GitHub issues or other public channels
- Reach out to specific Security Response Team members directly

Instead, follow the process explained in the [SECURITY.md] file.

## Staying up to date

Information about security fixes and dependency updates is disclosed in **the changelog** when a new release is published. All users are encouraged to [subscribe to release notifications](https://github.blog/changelog/2018-11-26-watch-releases/) in GitHub repositories of projects they use.

## Handling security vulnerabilities

This section describes how security vulnerabilities are handled, assessed, fixed, and communicated to the end user community.

### Direct vulnerability reports

When a vulnerability report arrives, the Security Response Team acts on it immediately. The reporter receives an acknowledgement within one business day of submitting a report.

The Security Response Team performs an assessment and, if needed, takes action to fix or mitigate the vulnerability in a private fork of the affected repository. Once ready, the fix is included in the next release. For vulnerabilities classified as high or critical severity, an out-of-band release is performed. Depending on the affected repository's release policy, the security fix is backported to previous releases.

**NOTE:** Reports that consist solely of automated scanner output — without proof that the vulnerability is reachable in Platform Mesh — are not treated as confirmed vulnerabilities. The team evaluates whether the affected code path is actually invoked. This policy applies equally to direct reports and automated findings.

Communication to the end user community depends on the severity of the vulnerability.

#### Low and medium severity vulnerabilities

In most cases, vulnerabilities rated as low and medium are **not** pre-announced. Those vulnerabilities, including their details, are communicated when a release containing the fix is published. Platform Mesh does not issue a CVE number for these vulnerabilities; only a GitHub Security Advisory is published.

#### High and critical severity vulnerabilities

Vulnerabilities rated high and critical are communicated differently from other vulnerabilities:

- A security release pre-announcement is sent at least 24 hours before the release without any details about the vulnerability being fixed
- Security releases are created according to the communicated timeline
- Details about vulnerabilities are published 24–48 hours after the security releases are created

Both a CVE number and a GitHub Security Advisory are issued for these vulnerabilities.

#### Information disclosure

Public disclosure happens through GitHub Security Advisories. A draft advisory is created on the affected repository when a report is received, enabling confidential fix development via Private Security Forks.

Each advisory must contain a description, affected versions, patched versions, CVSS severity, and a CVE identifier (if applicable). The fix is highlighted in the changelog under a dedicated **Security Fixes** section. The advisory automatically feeds into the GitHub Advisory Database, so downstream consumers of libraries are also notified via GitHub.

### Vulnerabilities in dependencies

Like every project that uses external dependencies, Platform Mesh is potentially vulnerable to issues discovered in those dependencies. In many cases, those vulnerabilities are not actually exploitable within the project, but to minimize risks, the project uses tooling that automatically updates dependencies for which a vulnerability is discovered or published.

In most cases, there are no special out-of-band releases for vulnerable dependency updates; those updates are included in regular scheduled releases. No special communication is issued for these updates — all information is included in the changelog when a release is published. Platform Mesh does not issue a CVE number or GitHub Security Advisory in these cases, because a CVE number or Advisory already exists from the dependent project.

An exception is highly-rated vulnerabilities that can be exploited; those are handled similarly to high and critical severity vulnerabilities in Platform Mesh:

- A security release pre-announcement is sent at least 24 hours before the release without any details about the vulnerable dependency
- Security releases are created according to the communicated timeline
- Details about vulnerabilities are published 24–48 hours after the security releases are created

## Security posture

The Platform Mesh project runs frequent checks to ensure the proper security posture in all user-facing repositories. OpenSSF Scorecard is used for this purpose. For more details, see the [OpenSSF Scorecard document](./scorecard.md).
