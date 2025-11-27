## Next Steps

### Working with KCP Workspaces

Platform Mesh uses KCP (Kubernetes Control Plane) to provide multi-tenant control planes. After successful setup, export the KCP kubeconfig to interact with workspaces:

```bash
export KUBECONFIG=$(pwd)/.secret/kcp/admin.kubeconfig
```

This gives you access to the root workspace and organization management.

You can then:

1. **Switch between workspaces**:
   ```bash
   kubectl kcp workspace use <workspace-name>
   ```

2. **List available workspaces**:
   ```bash
   kubectl get workspaces
   ```

### Exploring the Platform

- Browse the **Onboarding Portal** to see available services
- Create service bindings using kubectl
- Explore the multi-tenant architecture through different organization workspaces

::: tip Email Confirmations in Local Setup
When you register or create an organization, the system sends confirmation emails. Since this is a local setup, no real emails are sent. Instead, all emails can be viewed in the **Mailpit** application that's deployed as part of the local setup.

Access Mailpit at: `https://portal.dev.local:8443/mailpit/`

You can use Mailpit to view all sent emails and test email workflows without needing a real email server.
:::

