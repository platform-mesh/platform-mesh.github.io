---
title: Access the observability stack
personas: [platform-owner]
---

# Access the observability stack

The observability stack includes a bundled Prometheus instance for metrics during local development and testing. This guide shows how to access it.

::: warning Local setup only
The bundled Prometheus is intended for development and testing. For production deployments, configure the OpenTelemetry Collector to forward metrics and traces to your existing infrastructure.
:::

## Forward the Prometheus service

```bash
kubectl port-forward -n observability svc/observability-prometheus-server 9090:80
```

## Open the Prometheus UI

Open:

```text
http://localhost:9090
```

The Prometheus UI lets you explore metrics, run queries, and verify that Platform Mesh components are being scraped correctly.

## Explore Platform Mesh metrics

Use the Prometheus expression browser to query metrics. Platform Mesh components expose controller-runtime metrics (for operators) and component-specific metrics.

To verify metrics are being collected, try querying for metrics from Platform Mesh components. For example, search for metrics with prefixes like `controller_runtime_` or `openfga_`.

## Related

- [Observability reference](/reference/components/observability.md)
- [Observability concepts](/concepts/observability.md)
- [Access OpenFGA](/how-to-guides/access-openfga.md)
