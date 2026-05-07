# Security

The Platform Mesh project hosts many different user-facing repositories under the [`platform-mesh`](https://github.com/platform-mesh) GitHub organization. This page describes how the project receives reports of, triages, remediates, and discloses security vulnerabilities.

The scope of this document is:

- Vulnerabilities reported through the official security process described in the [SECURITY.md] file
- Vulnerabilities discovered in third-party dependencies

[SECURITY.md]: https://github.com/platform-mesh/.github/blob/main/SECURITY.md

## Security Response Team

A dedicated **Security Response Team** is responsible for all vulnerability-related activity. Responsibilities include receiving and acknowledging vulnerability reports, reviewing automated findings, coordinating fixes, publishing GitHub Security Advisories and CVEs, and communicating with reporters and users throughout the process.

For an up-to-date list of all team members, see [the `platform-mesh/security` GitHub team](https://github.com/orgs/platform-mesh/teams/security).

## Staying Up to Date

Information about security fixes in Platform Mesh and updates to vulnerable dependencies is published in **the changelog** with each new release.

Security fixes in Platform Mesh are also announced on the [`PlatformMesh-Announcement` mailing list](https://lists.neonephos.org/g/PlatformMesh-Announcement). For high and critical severity vulnerabilities, a pre-announcement is sent to the mailing list at least 24 hours before the release.

Users are encouraged to:

- [Subscribe to the mailing list](https://lists.neonephos.org/g/PlatformMesh-Announcement) to receive security announcements and pre-announcements.
- [Subscribe to release notifications](https://github.blog/changelog/2018-11-26-watch-releases/) for the Platform Mesh repositories they use.

## Reporting Vulnerabilities

Do **NOT**:

- Report potential security vulnerabilities through GitHub issues or other public channels
- Contact Security Response Team members directly

**Instead, follow the process explained in the [SECURITY.md] file.**

Platform Mesh follows the principle of [Coordinated Vulnerability Disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure). Reporters are asked to:

- Allow reasonable time to investigate and address the issue before making any information public.
- Make a good faith effort to avoid privacy violations, data destruction, and disruption of services.
- Not exploit the vulnerability beyond what is necessary to verify it.

The Security Response Team commits to:

- Acknowledging receipt of the vulnerability report.
- Providing an estimated timeline for a fix.
- Notifying the reporter when the vulnerability is resolved.

## Handling Security Vulnerabilities

### Direct Vulnerability Reports

When a vulnerability report arrives, the Security Response Team reviews it and, if needed, takes action to fix or mitigate the vulnerability in a private fork of the affected repository. Once ready, the fix is included in the next release. For vulnerabilities rated high or critical, an out-of-band release is performed. The security fix may be backported to previous releases.

**NOTE:** Reports that consist solely of automated scanner output — without proof that the vulnerability is reachable in Platform Mesh — require additional investigation before being treated as confirmed vulnerabilities. The Security Response Team evaluates whether the affected code path is actually invoked in Platform Mesh. If the vulnerability is confirmed to be reachable, it is handled as a confirmed vulnerability. If not, the reporter is notified and the report is closed.

#### Low and Medium Severity Vulnerabilities

In most cases, vulnerabilities rated low or medium are **not** pre-announced. Full details are disclosed when the release containing the fix is published. Platform Mesh does not issue a CVE number for these vulnerabilities, but a GitHub Security Advisory is published alongside the release.

#### High and Critical Severity Vulnerabilities

Vulnerabilities rated high and critical are communicated differently from low and medium severity vulnerabilities:

- A security release pre-announcement is sent at least 24 hours before the release without disclosing details about the vulnerability
- Security releases are created according to the timeline stated in the pre-announcement
- Details about vulnerabilities are published 24–48 hours after the security releases are created

Both a CVE number and a GitHub Security Advisory are issued for these vulnerabilities.

### Vulnerabilities in Dependencies

Like every project that uses external dependencies, Platform Mesh is potentially vulnerable to issues discovered in those dependencies. In many cases, those vulnerabilities are not actually exploitable within Platform Mesh. To minimize risks, the project uses tooling that automatically updates affected dependencies when a vulnerability is discovered or published.

Updates to vulnerable dependencies are typically included in regular scheduled releases and communicated exclusively through the changelog. Vulnerabilities in dependencies that are rated high or critical and confirmed to be exploitable in Platform Mesh are an exception and are handled following the same process as [high and critical severity vulnerabilities](#high-and-critical-severity-vulnerabilities).

Platform Mesh does not issue a CVE number or GitHub Security Advisory for vulnerabilities in dependencies, as one will already exist for the affected upstream project.

### Information Disclosure

Public disclosure happens through GitHub Security Advisories. Each advisory contains a description, affected versions, patched versions, and CVSS severity. For high and critical severity vulnerabilities, a CVE number is also issued. The fix is highlighted in the changelog under a dedicated **Security Fixes** section. The advisory is automatically published to the GitHub Advisory Database, so downstream projects are also notified via GitHub.

## Security Posture

The Platform Mesh project runs regular automated checks to ensure a strong security posture in all user-facing repositories. OpenSSF Scorecard is used for this purpose. For more details, see the [OpenSSF Scorecard document](./scorecard.md).
