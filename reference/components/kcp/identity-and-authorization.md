# Identity and authorization

kcp is the enforcement point for Platform Mesh. Every API request flows through the front proxy, an authentication chain (global + per-workspace), and an authorization chain that ends with the [rebac-authz-webhook](../rebac-authz-webhook.md) calling [OpenFGA](../openfga.md).

See [Identity and authorization](/concepts/identity-and-authorization.md) for the conceptual model.

## Primitives

| Primitive | Platform Mesh role | Upstream |
| --- | --- | --- |
| `kcp-front-proxy` | Single TLS-terminating ingress; all clients connect here. | [Front proxy](https://docs.kcp.io/kcp/main/concepts/sharding/front-proxy/) |
| `--authentication-config` | Cluster-wide OIDC config (kcp flag, takes an `AuthenticationConfiguration`). | [Authentication](https://docs.kcp.io/kcp/main/concepts/authorization/authentication/) |
| `WorkspaceAuthenticationConfiguration` | Per-workspace OIDC config referenced by a `WorkspaceType`. Platform Mesh uses this to give each org its own Keycloak realm. | [Workspace authentication](https://docs.kcp.io/kcp/main/concepts/authorization/authentication/) |
| `--authorization-webhook-config-file` | Wires a `SubjectAccessReview` webhook into the kcp authorizer chain. | [Authorization](https://docs.kcp.io/kcp/main/concepts/authorization/) |
| Built-in authorizer chain | RBAC → required-groups → workspace-content → max-permission-policy → local/global/bootstrap. Webhook layers after. | [Authorization](https://docs.kcp.io/kcp/main/concepts/authorization/) |

## Per-workspace OIDC

The `WorkspaceAuthenticationConfiguration` referenced by the `orgs` `WorkspaceType` (see [Workspaces](./workspaces.md)) defines the JWT issuer, audience, and claim mapping for a workspace subtree. Platform Mesh ships one per shared realm and one per organization (the [security-operator](../security-operator.md) provisions per-org configs dynamically):

```yaml
# platform-mesh-operator/manifests/kcp/workspace-authentication-configuration.yaml
apiVersion: tenancy.kcp.io/v1alpha1
kind: WorkspaceAuthenticationConfiguration
metadata:
  name: orgs-authentication
spec:
  jwt:
    - issuer:
        url: https://{{ .baseDomainPort }}/keycloak/realms/welcome
        audiences:
        {{- range .welcomeAudiences }}
        - {{ . }}
        {{- end }}
        audienceMatchPolicy: MatchAny
        certificateAuthority: |
{{ .domainCADec | indent 10 }}
      claimMappings:
        groups:
          claim: groups
          prefix: ""
        username:
          claim: email
          prefix: ""
```

The security-operator composes per-org issuers from `AccountInfo.Spec.OIDC.Clients`:

```go
// security-operator/internal/subroutine/workspace_authorization.go
audiences := make([]string, 0, len(accountInfo.Spec.OIDC.Clients)+len(r.cfg.AdditionalAudiences))
for clientName, clientInfo := range accountInfo.Spec.OIDC.Clients {
    audiences = append(audiences, clientInfo.ClientID)
}
audiences = append(audiences, r.cfg.AdditionalAudiences...)

jwtAuth := kcptenancyv1alphav1.JWTAuthenticator{
    Issuer: kcptenancyv1alphav1.Issuer{
        URL:       fmt.Sprintf("https://%s/keycloak/realms/%s", r.cfg.BaseDomain, workspaceName),
        Audiences: audiences,
    },
}
```

## Authorizer chain

Platform Mesh ships an `AuthorizationConfiguration` that runs `RBAC` → `Node` → a webhook into rebac-authz-webhook. The match conditions skip RBAC group requests so the webhook does not have to re-authorize standard Kubernetes RBAC traffic:

```yaml
# helm-charts/local-setup/webhook-config/authorization-webhook-config.yaml
apiVersion: apiserver.config.k8s.io/v1beta1
kind: AuthorizationConfiguration
authorizers:
  - { type: RBAC, name: rbac }
  - { type: Node, name: node }
  - type: Webhook
    name: authz-webhook
    webhook:
      authorizedTTL: 30s
      unauthorizedTTL: 30s
      timeout: 3s
      subjectAccessReviewVersion: v1
      matchConditionSubjectAccessReviewVersion: v1
      failurePolicy: NoOpinion
      matchConditions:
        - expression: has(request.resourceAttributes)
        - expression: request.resourceAttributes.group != "rbac.authorization.k8s.io"
      connectionInfo:
        type: KubeConfigFile
        kubeConfigFile: /config/authz-webhook-kubeconfig.yaml
```

## rebac-authz-webhook wiring

The webhook runs as its own deployment. It connects to OpenFGA and watches a specific `APIExportEndpointSlice` so it can resolve workspace identity for incoming `SubjectAccessReview`s:

```yaml
# helm-charts/charts/rebac-authz-webhook/templates/deployment.yaml (excerpt)
args:
  - "serve"
  - "--openfga-addr={{ .Values.openfga.url }}"
  - "--kcp-api-export-endpoint-slice-name={{ .Values.kcp.apiExportEndpointSliceName }}"
  - "--health-probe-bind-address={{ .Values.healthProbeBindAddress }}"
  - "--webhook-cache-miss-max-retries={{ .Values.webhook.cacheMissMaxRetries }}"
  - "--webhook-cache-miss-ttl={{ .Values.webhook.cacheMissTTL }}"
ports:
  - containerPort: 9443  # webhook server (SubjectAccessReview)
  - containerPort: 8080  # metrics
```

## Maximal Permission Policy

`APIExport.spec.maximalPermissionPolicy` puts an upper bound on what consumers can do with the export's resources, even via the `apis.kcp.io:binding:` group prefix. Platform Mesh exposes this to providers but does not centrally drive it.

## Related

- [Identity and authorization](/concepts/identity-and-authorization.md) — chain order and conceptual model
- [rebac-authz-webhook](../rebac-authz-webhook.md) — the webhook component
- [OpenFGA](../openfga.md) — authorization data store
- [Keycloak](../keycloak.md) — identity provider
