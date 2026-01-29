## Example MSP

::: warning Development Preview
The local setup is currently under active development. Features and workflows may change.
:::

### 1. Clone the Repository

```bash
git clone https://github.com/platform-mesh/helm-charts.git
cd helm-charts/local-setup
```

### 2. Run the Setup

The setup script automates the entire bootstrap process. Choose one of the following options:

#### Standard Setup

::: code-group

```bash [Task]
# Full setup (deletes existing cluster and creates new one)
task local-setup:example-data

# Iterate on existing cluster (faster, preserves cluster state)
task local-setup:example-data:iterate
```

```bash [Script]
# Full setup (deletes existing cluster and creates new one)
kind delete cluster --name platform-mesh
./scripts/start.sh
```

:::

After the script completes, it will display `Installation Complete ♥ !` along with instructions for accessing the portal.

![Task local-setup output](/img/msp-task-local.png)

---

## Registering a User

Once the setup completes, access the portal via the link displayed in the terminal.

![Platform Mesh Portal](/img/pm-portal.png)

For first-time access, you must register a new user. Click the **Register** link to begin.

![Platform Mesh Register](/img/pm-register.png)

In the local-setup environment, your email from the registration is automatically confirmed. The browser then redirects to the organization onboarding page.

---

## Onboarding an Organisation

After logging in, you can onboard your first organisation.

![Platform Mesh Organisation](/img/pm-portal-org.png)

Once onboarding is complete, the newly created organization will be visible in the `Switch to a different organization` drop down menu and a popup with default password will appear. Copy the default password to be used in the next step.

![Platform Mesh Organisation Login](/img/pm-org-login.png)

Enter your email and the default password from last step. After login, the browser redirects to the password update page.

![Platform Mesh Organisation Update password](public/img/pm-org-update-password.png)

Set a new password for the user in the newly created organization. Another redirect shows the account information update page.

![Platform Mesh Organisation Update account information](public/img/pm-org-update-accountinformation.png)

After completing this step, log in to access the Platform Mesh Portal UI.

![Platform Mesh Portal UI](/img/pm-portal-ui.png)

---

## Account and Namespace

Navigate to the **Accounts** page to create a new account.

![Platform Mesh Accounts](/img/pm-accounts.png)

Create a new account within Platform Mesh.

![Platform Mesh Demo Account](/img/pm-demo-account.png)

After the account is created, you can step into it. There are two methods of access:

1. **Portal UI**: Navigate through the Platform Mesh Portal interface
2. **Kubeconfig**: Download the Kubeconfig file to interact with the account via `kubectl`

Note that each account operates as its own [control plane](../overview/control-planes.md).

![Platform Mesh Demo Kubeconfig](/img/pm-demo-account-kc.png)

A default namespace is automatically created for you within the account. This namespace corresponds to a Kubernetes Namespace in the Control Plane.

![Platform Mesh Account Namespace](/img/pm-namespace.png)
---

## Managed Service Provider: HttpBin

Within the namespace, you can view and provision services. The HttpBin service demonstrates managed service provider capabilities.

![Platform Mesh Default Namespace](/img/pm-demo-ns.png)

Create and provision your first service through Platform Mesh.

![Platform Mesh Bin Create](/img/pm-bin-create.png)

After provisioning completes, the HttpBin service becomes available in your account.

![Platform Mesh Bin Ready](/img/pm-bin-ready.png)

Access the service via the provided link.

![Local HttpBin](/img/httpbin-local.png)

You can also access the HttpBin service running within the local cluster. Note that this is for demonstration purposes only. In production environments, Managed Service Providers operate outside the Platform Mesh scope and are hosted externally. This example illustrates the integration capabilities of Platform Mesh.

![Local HttpBin in Cluster](/img/pm-bin-cluster.png)

---

## Related Concepts

- [Account Model](../overview/account-model.md) - How identity and access work in Platform Mesh
- [Control Planes](../overview/control-planes.md) - Architecture of distributed control plane management
- [Design Decisions](../overview/design-decision.md) - Managed Service Provider patterns
- [Scenarios](../scenarios.md) - Real-world service interaction examples