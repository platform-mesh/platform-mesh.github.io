# Portal

The **Portal** is the primary web interface for Platform Mesh. It is an Angular microfrontend shell
(built with Luigi) that provides:

- Organisation, account and namespace management
- Workspace navigation through the KCP workspace hierarchy
- Kubeconfig download for direct `kubectl` access
- A home dashboard summarising the current workspace context

The Portal composes other microfrontends (Marketplace, IAM, and any custom extensions) into a unified user experience.
