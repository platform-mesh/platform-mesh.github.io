# Security

The Platform Mesh project hosts many different user-facing repositories under the [`platform-mesh`](https://github.com/platform-mesh) GitHub organization. This page describes how the project detects, triages, remediates, and discloses security vulnerabilities.

The scope of this document is:

- Vulnerabilities reported through the official security process as described in the [SECURITY.md] file,
- Vulnerabilities discovered in third-party dependencies

[SECURITY.md]: https://github.com/platform-mesh/.github/blob/main/SECURITY.md

## Security response team

A dedicated Security Response Team owns all vulnerability-related activity. Responsibilities include receiving and acknowledging vulnerability reports, reviewing automated findings, coordinating fixes, publishing GitHub Security Advisories and CVEs, and communicating with reporters and users throughout the process.

For an up-to-date list of all team members, see [the `platform-mesh/security` GitHub team](https://github.com/orgs/platform-mesh/teams/security).

## Reporting vulnerabilities

Please do **NOT**:

- Report potential security vulnerabilities through GitHub issues or other public channels,
- Reach out to specific Security Response Team members

Instead, please follow the process explained in the [SECURITY.md] file.

## Staying up to date

Information about security fixes and dependency updates are disclosed in **the changelog** upon publishing a new release. Hence, we strongly recommend that all users [subscribe to release notifications](https://github.blog/changelog/2018-11-26-watch-releases/) in GitHub repositories of projects they use.

## Handling security vulnerabilities

This section describes how security vulnerabilities are handled, assessed, fixed, and communicated to the end user community.

### Direct vulnerability reports

Upon receiving a vulnerability report, the Security Response Team will act on it immediately. The reporter is expected to receive an acknowledgement within one business day of submitting a report.

The Security Response Team will do an assessment, and if needed, take action to fix or mitigate the vulnerability in a private fork of the affected repository. Once ready, the fix will be included in the next release. For vulnerabilities that are classified as high or critical severity, an out-of-band release will be performed. Depending on the affected repository's release policy, the security fix will be backported to previous releases.

**NOTE:** Reports that consist solely of automated scanner output — without proof that the vulnerability is reachable in Platform Mesh — are not treated as confirmed vulnerabilities. The team evaluates whether the affected code path is actually invoked. This policy applies equally to direct reports and automated findings.

Communication to the end user community depends on the severity of the vulnerability.

#### Low and medium severity vulnerabilities

In most cases, vulnerabilities rated as low and medium will **not** be pre-announced. Those vulnerabilities, including details of the vulnerabilities, will be communicated upon publishing a release containing the fix. Also, we will not issue a CVE number for those vulnerabilities; only a GitHub Security Advisory will be published.

#### High and critical severity vulnerabilities

Vulnerabilities rated high and critical are communicated differently from other vulnerabilities:

- A security release pre-announcement will be sent at least 24 hours before the release without any details about the vulnerability that's being fixed
- Security releases will be created according to the communicated timeline
- Details about vulnerabilities will be published 24-48 hours after the security releases are created

Both a CVE number and a GitHub Security Advisory will be issued for these vulnerabilities.

#### Information disclosure

Public disclosure happens through GitHub Security Advisories. A draft advisory is created on the affected repository upon receiving a report, enabling confidential fix development via Private Security Forks.

Each advisory must contain a description, affected versions, patched versions, CVSS severity, and a CVE identifier (if applicable). The fix is highlighted in the changelog under a dedicated **Security Fixes** section. The advisory automatically feeds into the GitHub Advisory Database, so downstream consumers of libraries are also notified via GitHub.

### Vulnerabilities in dependencies

As every project that uses external dependencies, Platform Mesh is potentially vulnerable to discovered vulnerabilities in those dependencies. In many cases, those vulnerabilities are not actually exploitable within the project, but to minimize risks, we have tooling that automatically updates dependencies for which a vulnerability is discovered or published.

In most cases, there will be no special out-of-band releases for vulnerable dependency updates; instead, those will be included in regular scheduled releases. There will be no special communication about these updates. All information will be included in the changelog upon publishing a release. We will not issue a CVE number or GitHub Security Advisory in these cases, as there is already a CVE number or Advisory from the dependent project.

An exception is highly-rated vulnerabilities that can be exploited; those will be handled similarly to high and critical severity vulnerabilities in Platform Mesh:

- A security release pre-announcement will be sent at least 24 hours before the release without any details about the vulnerable dependency
- Security releases will be created according to the communicated timeline
- Details about vulnerabilities will be published 24-48 hours after the security releases are created

## Security posture

The Platform Mesh project runs frequent checks to ensure the proper security posture in all user-facing repositories. For that, OpenSSF Scorecard is used. More details about that can be found in [the OpenSSF Scorecard document](./scorecard.md).
