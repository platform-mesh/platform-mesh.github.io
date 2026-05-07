# Platform Mesh documentation style guide

This guide defines how Platform Mesh documentation is written. It is **inspired by**, not a copy of:

- [Kubernetes documentation style guide](https://kubernetes.io/docs/contribute/style/style-guide/)
- [Google developer documentation style guide](https://developers.google.com/style)

Platform Mesh follows US English, matching the upstream guides and the broader cloud-native ecosystem (Kubernetes, kcp, OpenFGA, etc.).

The guide is intentionally short. If a question is not answered here, fall back to the Kubernetes guide first, then the Google guide.

## Quick reference

| Topic | Rule |
| --- | --- |
| Information architecture | [Diátaxis](https://diataxis.fr) — every page is one of: tutorial, how-to, concept, reference |
| Headings | Sentence case; only first word and proper nouns capitalized |
| API kinds and CRDs | UpperCamelCase, verbatim; for example `APIBinding`, `APIExportPolicy`, `AuthorizationModel` |
| `kcp` | Always lowercase in prose, including at the start of a sentence (rewrite to avoid sentence-initial position) |
| Spelling | US English (`authorization`, `organization`, `behavior`, `color`) |
| Voice | Address the reader as "you"; avoid "we" and "our" |
| Tense | Present tense; avoid "will" / "should" / "may" when stating facts |
| Contractions | Avoid in reference and concept pages; permitted in tutorials and how-to guides for friendlier tone |
| Latin abbreviations | None — write "for example", "such as", "that is" instead of "e.g.", "i.e.", "etc." |
| Cross-references | Every content page ends with a `## Related` section linking to its Diátaxis counterparts |
| Code and identifiers | Backticks for inline code, file paths, field names, flags, env vars |

## Information architecture (Diátaxis)

Every page lives in exactly one Diátaxis quadrant. The four sidebars (`/tutorials/`, `/how-to-guides/`, `/concepts/`, `/reference/`) reflect this. **Do not mix types on a single page** — cross-reference instead.

| Type | What it does | Voice | Code |
| --- | --- | --- | --- |
| Tutorial | Teaches a beginner by guiding them through a complete, working example | Author-led, friendly, second-person | Numbered steps, full commands |
| How-to guide | Helps a competent reader achieve a specific goal | Reader-led, terse, second-person | Recipe form, real values |
| Concept | Builds the reader's mental model and explains *why* | Discursive, third-person, no procedures | No runnable code |
| Reference | Describes the system as it is | Austere, third-person, no opinions | Schemas, tables, exact defaults |

If a page contains procedures *and* explanation, split it.

## Voice and tone

- **Second person.** Address the reader as "you". Avoid "we", "our", "us". Recast: "We recommend X" → "Use X" or "Platform Mesh recommends X".
- **Active voice.** "The operator reconciles the resource" — not "The resource is reconciled by the operator".
- **Present tense for facts.** "The webhook returns a decision" — not "The webhook will return a decision". Future tense is acceptable for genuinely future events ("The next release introduces…").
- **Tutorials are friendlier than reference.** Tutorial prose can be conversational and use contractions. Reference and concept pages stay formal.
- **No marketing or sales tone.** "Platform Mesh delivers a powerful, seamless experience" → cut.

## Spelling and language

**Use US English** in body prose. This matches the upstream guides we draw from and the broader cloud-native ecosystem (Kubernetes, kcp, OpenFGA documentation).

| Recommended (US) | Avoid (UK) |
| --- | --- |
| `authorization`, `authorize`, `authorizer` | `authorisation`, `authorise`, `authoriser` |
| `organization`, `organize` | `organisation`, `organise` |
| `behavior` | `behaviour` |
| `color`, `colored` | `colour`, `coloured` |
| `customize`, `customization` | `customise`, `customisation` |
| `recognize`, `optimize`, `synchronize`, `minimize`, `analyze` | `recognise`, `optimise`, `synchronise`, `minimise`, `analyse` |
| `center`, `meter`, `theater` | `centre`, `metre`, `theatre` |
| `catalog`, `dialog` | `catalogue`, `dialogue` |
| `defense`, `offense` | `defence`, `offence` |
| `license` (both noun and verb) | `licence` (noun) |

**Examples:**

```
Use the Security operator to authorize consumers to bind the APIExport.
Apply the AuthorizationModel resource to extend the schema.
The kcp authorizer chain runs through several stages.
A relationship-based authorization engine.
```

## Capitalization

### Headings

Sentence case. Only the first word and proper nouns are capitalized.

| Recommended | Avoid |
| --- | --- |
| `## Schema transport` | `## Schema Transport` |
| `## Multi-cluster support` | `## Multi-Cluster Support` |
| `## How it fits into Platform Mesh` | `## How It Fits Into Platform Mesh` |
| `## kcp integration` | `## KCP Integration` |
| `## OpenFGA settings` | `## OpenFGA Settings` |

### Project nouns and product names

| Form | When to use |
| --- | --- |
| `kcp` | Always lowercase in prose, including at the start of a sentence. Rewrite to avoid sentence-initial position. Never write `KCP` or `Kcp` in body prose. |
| `Platform Mesh` | Title-cased — it is the project name. |
| `Platform Mesh Portal` | Title-cased — the portal is a named product. |
| `Kubernetes GraphQL gateway` | Sentence case — "gateway" is generic. |
| `OpenFGA` | All-caps `O`, `FGA`. Never `openfga` in prose. |
| `Keycloak` | One word, capital `K`. |
| `api-syncagent` | Lowercase, hyphenated. |
| `multicluster-runtime` | Lowercase, single hyphen. Matches the upstream `kubernetes-sigs/multicluster-runtime` repository name. Never write `multi-cluster-runtime` (two hyphens) in prose. |
| `kube-bind` | Lowercase, hyphenated. |
| `rebac-authz-webhook` | Lowercase, hyphenated. |
| `IAM service`, `IAM UI` | `IAM` is an acronym, stays uppercase. |

### API kinds and CRDs

UpperCamelCase. Match the Go struct exactly. The Kubernetes/kcp convention is `API*`, not `Api*`.

| Recommended | Avoid |
| --- | --- |
| `APIBinding`, `APIExport`, `APIExportPolicy`, `APIResourceSchema`, `APIExportEndpointSlice` | `ApiBinding`, `ApiExport`, `ApiExportPolicy` |
| `Workspace`, `WorkspaceType`, `LogicalCluster` | `workspace` (when referring to the kind), `Workspacetype` |
| `Store`, `AuthorizationModel`, `Invite` | `store`, `authorizationmodel` |

### Headings starting with `kcp`

`kcp` stays lowercase even at the start of a heading. If this looks awkward, rewrite the heading.

```
## kcp integration                       ← acceptable
## Integration with kcp                  ← preferred when natural
```

## Code and syntax formatting

### Inline code

Use backticks for: file paths, field names, environment variables, command-line flags, CLI commands, configuration values, and CRD names when discussed as identifiers.

```
Set the `--kcp-kubeconfig` flag to `/api-kubeconfig/kubeconfig`.
The `Store` CRD is defined in `core.platform-mesh.io/v1alpha1`.
```

API kinds in narrative prose can be unbacked when they read as ordinary nouns:

```
Each Account becomes a kcp workspace.   ← acceptable
Apply the `Account` resource.            ← also acceptable, more code-like
```

Be consistent within a page.

### Code blocks

Always specify the language for syntax highlighting.

````
```yaml
apiVersion: core.platform-mesh.io/v1alpha1
kind: Store
```
````

Do not include shell prompts (`$`, `#`, `>`) in command examples:

```
kubectl get apibindings        ← correct
$ kubectl get apibindings      ← avoid
```

Show commands and their output as separate code blocks.

### Placeholders

Angle brackets, lowercase-with-hyphens, descriptive:

```
kubectl get accounts -n <organization-workspace>
```

Avoid `[brackets]`, `UPPER_SNAKE` (except for actual environment variables), or unhelpful names like `var1` or `name`.

## Lists and tables

- **Oxford comma.** "Tutorials, how-to guides, concepts, and reference."
- **Bulleted lists** for unordered items. **Numbered lists** for sequential procedures.
- Tables for any comparison or lookup with three or more rows. Markdown pipes, no fancy alignment.

## Cross-references

**Every content page ends with a `## Related` section** linking to its Diátaxis counterparts:

- A reference page links to its concept page and any how-to guide that uses it
- A concept page links to its reference page and tutorials that demonstrate it
- A how-to guide links to the concept it assumes and the reference it uses
- A tutorial closes with `## Next` (continuation) and `Optional branches:` (alternatives) instead of `## Related` — this is the established tutorial pattern

Use root-relative paths for cross-section links and relative paths within a section:

```markdown
- [API sharing](./api-sharing.md)                              ← within concepts/
- [api-syncagent reference](/reference/components/api-syncagent.md)   ← cross-section
```

## Forbidden words and phrases

| Avoid | Use instead |
| --- | --- |
| `simply`, `just`, `easily`, `obviously` | (omit — they are condescending and untrue for some readers) |
| `e.g.`, `i.e.`, `etc.` | "for example", "that is", "and so on" (or recast) |
| `above`, `below` (as page references) | A specific link or section reference |
| `we`, `our`, `us` (as the project) | "Platform Mesh", "the project", or recast in active voice |
| `will`, `shall` (when stating present-tense facts) | Present tense |
| `pretty`, `kind of`, `sort of`, `a bit` | Specific quantities or omit |
| `recently`, `new`, `latest` (without a version) | A specific version or release |
| `please` (in instructions) | Imperative mood: "Configure…" not "Please configure…" |
| `awesome`, `powerful`, `seamless`, `cutting-edge` | Specific capabilities |

## Reference page template

Reference component pages (`/reference/components/*.md`) follow this template. Match the order; omit sections that do not apply.

```markdown
# <Component name>

<one-paragraph intro: what this component is and what it integrates with>

::: warning <if alpha/preview>
This component is in alpha. APIs and deployment wiring may change.
:::

## Purpose

<2–4 sentences: what the component owns, what it does not own, who uses it>

## Runtime role

<dependencies, exposed endpoints, ports, runtime configuration that affects behavior>

## How it fits into Platform Mesh

<table of related components and the boundary between this one and each>

## Configuration

<flag tables, env vars, defaults>

## Repository

- [github.com/platform-mesh/<repo>](https://github.com/platform-mesh/<repo>)

## Related

- <links to concept page, sibling components, resource references>
```

The current gold standards for this template are `reference/components/openfga.md` and `reference/components/rebac-authz-webhook.md`.

## Concept page template

Concept pages explain *why* and build a mental model. They have no rigid section structure beyond:

- A clear opening paragraph that frames the topic and links to its reference counterpart
- One or more topic sections (depends on the concept)
- A closing `## Related` section

If a concept page contains procedures or YAML manifests, that material belongs in a how-to guide or a reference page.

## Definition of done for a docs change

A pull request that adds or modifies a content page is ready to merge when:

- The page lives in exactly one Diátaxis section
- Headings use sentence case
- Body prose uses US English (with the proper-noun and code exceptions in [Spelling and language](#spelling-and-language))
- Project nouns use the canonical form from [Capitalization](#capitalization)
- The page ends with a `## Related` section (or `## Next` for tutorials)
- `npm run build` succeeds
- Internal links resolve
- No forbidden words from the [list above](#forbidden-words-and-phrases)

## Tooling (future)

The project does not yet use [vale](https://vale.sh) for automated style enforcement. When that ships, this guide is the source of truth for the rule set.

## Updates

This guide is opinionated and small on purpose. Propose changes via pull request to `STYLE.md` with a one-line rationale. Significant additions should reference the corresponding rule in the upstream guides this is inspired by.
