# Explore the example MSP

This tutorial uses the local setup with example data to show the Platform Mesh portal workflow from first login to provisioning a managed service.

::: warning Development preview
The local setup is under active development. Features and workflows may change.
:::

## Clone the setup repository

```bash
git clone https://github.com/platform-mesh/helm-charts.git
cd helm-charts
git checkout 0.3.0
```

## Run the setup with example data

::: code-group

```bash [Task]
task local-setup:example-data
task local-setup:example-data:iterate
```

```bash [Script]
kind delete cluster --name platform-mesh
./local-setup/scripts/start.sh --example-data
```

:::

After the script completes, it prints `Installation Complete` and shows the portal URL.

![Task local-setup output](/img/msp-task-local.png)

## Register a user

Open the portal URL shown in the terminal.

![Platform Mesh Portal](/img/pm-portal.png)

For first-time access, select **Register**.

![Platform Mesh Register](/img/pm-register.png)

In the local setup, the registration email is automatically confirmed. The browser redirects to organization onboarding.

## Onboard an organization

Create your first organization.

![Platform Mesh Organisation](/img/pm-portal-org.png)

After onboarding, the organization appears in the organization switcher. A popup shows the default password `password`. Use it in the next login step.

![Platform Mesh Organisation Login](/img/pm-org-login.png)

Enter your email and the default password. After login, update the password.

![Platform Mesh Organisation Update password](/img/pm-org-update-password.png)

Then update the account information.

![Platform Mesh Organisation Update account information](/img/pm-org-update-accountinformation.png)

After completing this flow, the portal UI opens.

![Platform Mesh Portal UI](/img/pm-portal-ui.png)

## Create an account

Open the **Accounts** page.

![Platform Mesh Accounts](/img/pm-accounts.png)

Create a new account.

![Platform Mesh Demo Account](/img/pm-demo-account.png)

Step into the account from the portal, or download its kubeconfig to work with it through `kubectl`.

Each account is its own [control plane](/concepts/control-planes.md).

![Platform Mesh Demo Kubeconfig](/img/pm-demo-account-kc.png)

The default and `kube-system` namespaces are created automatically for the account.

![Platform Mesh Account Namespace](/img/pm-namespace.png)

## Provision the HttpBin service

Inside the namespace, view the available services. HttpBin demonstrates the managed service provider pattern. The operator backing this demo is in [`platform-mesh/example-httpbin-operator`](https://github.com/platform-mesh/example-httpbin-operator).

![Platform Mesh Default Namespace](/img/pm-demo-ns.png)

Create a service instance.

![Platform Mesh Bin Create](/img/pm-bin-create.png)

After provisioning completes, the service becomes available in the account.

![Platform Mesh Bin Ready](/img/pm-bin-ready.png)

Open the service URL.

![Local HttpBin](/img/httpbin-local.png)

You can also inspect the local cluster resource behind the example. In production, managed service providers usually run outside the Platform Mesh control plane.

![Local HttpBin in Cluster](/img/pm-bin-cluster.png)

## Next

Continue with [Provider quick start](./provider-quick-start.md) to publish your own service from the provider side.

Optional branches:

- [Access kcp admin](/how-to-guides/access-kcp-admin.md) to inspect the workspace tree behind the portal.
- [Access Keycloak](/how-to-guides/access-keycloak.md) to see how the organization maps to a realm.
- [Account model](/concepts/account-model.md) for how the organization and account you created map to kcp workspaces.
- [Why Platform Mesh?](/concepts/why-platform-mesh.md) for the motivation behind the model.
