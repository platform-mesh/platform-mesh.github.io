# Access OpenFGA

OpenFGA is the relationship-based authorization system used by Platform Mesh.

## Forward the OpenFGA service

```bash
kubectl port-forward -n platform-mesh-system svc/openfga 3000 8080 8081
```

## Open the playground

Open:

```text
http://localhost:3000/playground
```

After completing [Explore the example MSP](/tutorials/explore-example-msp.md), the organization you created appears in OpenFGA with its authorization data.

![OpenFGA Admin](/img/openfga-admin.png)

## Related

- [OpenFGA component reference](/reference/components/openfga.md)
- [Identity and authorization](/concepts/identity-and-authorization.md)
