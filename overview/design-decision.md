

## The Managed Service Provider Pattern

In on-premises environments, dedicated services are typically installed within a defined technical environment and orchestrated either through manual configuration or local automation.
However, this approach is inadequate for a cloud-based environment due to the need to manage the dynamic requirements of a new type of service.  
In on-premises scenarios, services are explicitly installed on dedicated runtimes, such as VMs or physical hosts, and configured accordingly.
In contrast, in a cloud environment, customers need to create bundles of service <Term>capabilities</Term>  on demand.

This necessitates a completely new kind of service: a service capable of managing the lifecycles of capabilities of dedicated service types intended to be interconnected within service orchestrations.
These services are referred to as **<Term>Managed Service Providers</Term> (MSPs)** or simply service providers.
Such a service is responsible for managing and orchestrating its capabilities on demand, and it offers a standardized declarative management API.

This pattern distinctly separates, yet bundles, two kinds of services:

- Service management, which provides a lifecycle management API interface.  
  According to our [guiding principles](principles), this must be a declarative API.
- The <Term>managed capabilities</Term>, which are requested by the users of the service management and are intended to be orchestrated in the final desired orchestration contexts.

Both types of services may share the same runtime environment (e.g., VMs, Hosts, or Kubernetes clusters), but it is considered a best practice to separate the runtime environments to allow for the independent scaling of capabilities.

The runtime environment can be any platform capable of hosting the service management or the managed capabilities.
This could be a Kubernetes cluster, a VM running processes, or even a web service on a Java runtime that can handle multiple tenants.
Due to this flexibility, a service runtime might be cascaded: for instance, a web service running as a pod within a Kubernetes cluster, which is scheduled to a dedicated VM, acting as a node of the Kubernetes cluster, which in turn runs on a hypervisor of a virtualization infrastructure.


## A uniform API layer for Service Ordering and Service Management

There must be a uniform API available to consumers for ordering, managing, and orchestrating <Term>capabilities</Term>.  
This uniform API technology will be used as part of the reference architecture, specifically following the <Term>Kubernetes Resource Model</Term> (KRM) API.
This approach allows for semantically rich, typed, and extensible expression of order and management interfaces.

The Platform Mesh leverages [kcp capabilities](control-planes) to implement this uniform API layer efficiently, providing logical isolation and scalability while maintaining Kubernetes API compatibility.

Every participant in the reference architecture *should* provide such an API layer, which can be mapped to any kind of backend implementation.
This is particularly relevant for the management APIs provided by <Term>Managed Service Providers</Term> and the consumer-facing APIs of the service orchestration environment that provide access to various service providers.

At a minimum, the final consumer-facing API layers of the involved entities MUST provide such an interface.
This interface serves as the central point of contact for creating, managing, and orchestrating capabilities provided by various service providers.
Any kind of implementation can be chosen behind this API layer.
