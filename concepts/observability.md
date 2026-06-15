# Observability

Platform Mesh provides telemetry collection infrastructure to help operators monitor the health and performance of their Platform Mesh installation. The observability architecture separates collection from storage, giving operators flexibility to integrate with their existing monitoring systems.

## Collection vs. storage

Platform Mesh takes an opinionated approach to observability: it owns the collection side but leaves storage to operators.

**Platform Mesh provides:**

- ServiceMonitors that define what metrics to scrape from each component
- An OpenTelemetry Collector that aggregates metrics and traces
- A Target Allocator that discovers scrape targets
- Prometheus remote write and OTLP exporters for forwarding telemetry

**Operators provide:**

- A metrics backend (Prometheus, Thanos, Mimir, Cortex, or a cloud provider solution)
- A trace backend (Jaeger, Tempo, or any OTLP-compatible system)
- Long-term storage and retention policies
- Alerting rules and notification channels
- Dashboards and visualization

This separation exists for several reasons:

1. **Enterprise integration** – Most organizations already have monitoring infrastructure. Platform Mesh integrates with what exists rather than requiring a parallel stack.

2. **Flexibility** – Operators choose their storage backend, retention policies, and high-availability setup based on their requirements.

3. **Resource efficiency** – Running a production-grade metrics backend requires significant resources. Operators can share infrastructure across multiple Platform Mesh installations or other workloads.

4. **Operational ownership** – Metrics storage, backup, and scaling are operational concerns that belong with the team running the infrastructure.

For development and testing, Platform Mesh includes a bundled Prometheus instance for metrics. This instance is configured for convenience, not production use – it has no persistent storage by default and is not configured for high availability.

## What Platform Mesh collects

Platform Mesh collects telemetry from its core components:

### Metrics

Platform Mesh scrapes Prometheus-format metrics from four categories of components:

**Control plane metrics** – The kcp control plane exposes metrics about workspace operations, API request handling, and internal state. These help operators understand control plane load and identify performance bottlenecks. Scraping kcp requires client certificate authentication, which the observability stack handles automatically.

**Operator metrics** – The account-operator and security-operator expose standard controller-runtime metrics, including reconciliation counts, queue depths, and error rates.

**Authorization metrics** – OpenFGA exposes metrics about authorization check latency, cache hit rates, and store operations.

### Traces

Platform Mesh components can emit distributed traces via OTLP (OpenTelemetry Protocol). Traces help operators debug request flows across components and identify latency bottlenecks.

Tracing is disabled by default and must be enabled per-component. When enabled, components send spans to the OpenTelemetry Collector, which forwards them to the configured trace backend.

### What is not collected

Platform Mesh does not currently collect:

- Application-level metrics from provider workloads
- Network traffic metrics
- Resource usage metrics (CPU, memory) – these come from standard Kubernetes monitoring

## OpenTelemetry architecture

Platform Mesh uses OpenTelemetry as its telemetry collection framework. OpenTelemetry provides a vendor-neutral way to collect, process, and export metrics and traces.

### OpenTelemetry Operator

The OpenTelemetry Operator manages collector instances declaratively. It handles collector deployment, configuration updates, and scaling. The operator also manages the Target Allocator that distributes scrape targets across collector replicas.

### Target Allocator

The Target Allocator watches ServiceMonitor resources and discovers scrape targets. It distributes targets across collector replicas to balance load and avoid duplicate scraping. This approach scales better than static scrape configurations as the number of targets grows.

### Collector as aggregation point

The OpenTelemetry Collector serves as the central aggregation point for all telemetry:

- **Metrics** – The collector scrapes Prometheus endpoints (via Target Allocator), batches metrics, and forwards them via Prometheus remote write.
- **Traces** – The collector receives spans via OTLP from instrumented components, batches them, and forwards to trace backends.

Batching reduces network overhead when sending telemetry to remote backends. The collector can also perform filtering, relabeling, and other transformations before forwarding.

## Integration patterns

Operators typically integrate Platform Mesh telemetry using these patterns:

### Metrics: Prometheus remote write

The most common pattern – configure the OTel Collector to forward metrics to a Prometheus-compatible backend via the remote write API. This works with:

- Self-hosted Prometheus with remote write receiver enabled
- Thanos Receive
- Grafana Mimir
- Cortex
- Cloud provider managed services (Amazon Managed Prometheus, Google Cloud Managed Prometheus, Azure Monitor)

### Traces: OTLP export

Configure the OTel Collector to forward traces to any OTLP-compatible backend:

- Jaeger
- Grafana Tempo
- Honeycomb
- Lightstep
- Cloud provider tracing services

### Metrics: Federation

If your existing Prometheus cannot receive remote writes, configure it to federate metrics from the bundled development Prometheus. This pattern is less efficient but works with older Prometheus setups.

### Metrics: Direct scraping

For maximum control, configure your existing Prometheus to scrape Platform Mesh component endpoints directly. The ServiceMonitors in the observability namespace document available targets and authentication requirements. This bypasses the OTel Collector entirely.

## Related

- [Observability reference](/reference/components/observability.md)
- [Access the observability stack](/how-to-guides/access-observability.md)
- [Architecture](/concepts/architecture.md)
