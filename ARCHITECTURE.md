# Bhoomi Setu architecture contract

## Service-internal layers

Every service follows `Types → Config → Repo → Service → Runtime → API`. The arrow means “may be depended on by layers to its right,” not mandatory coupling.

- **Types:** pure models and protocols; no I/O.
- **Config:** validated configuration; no business operations.
- **Repo:** persistence/external-data implementations behind protocols.
- **Service:** use cases and domain orchestration; no transport framework.
- **Runtime:** dependency assembly, lifecycle, workers, and process concerns.
- **API:** transport adapters that validate, call Service, and map output.

API MUST NOT call Repo directly. Service MUST NOT import API or Runtime. Types MUST import no other service layer.

## Cross-cutting providers

Auth, telemetry, consent, and audit enter only through an explicit `Providers` interface supplied at the Runtime composition boundary. Services MUST NOT discover globals, SDK singletons, environment variables, request context, or framework state.

## Permitted dependency edges

The Session 0.4 structural test reads this YAML data block. Identifiers are stable; omitted edges are forbidden.

```yaml architecture-edges
version: 1
layers: [types, config, repo, service, runtime, api]
permitted_edges:
  config: [types]
  repo: [types, config]
  service: [types, config, repo, providers]
  runtime: [types, config, repo, service, providers]
  api: [types, config, service, providers]
  providers: [types]
forbidden_cross_service_edges: true
shared_import_roots:
  - packages/domain-types
  - packages/rules
```

Services communicate through versioned API/event contracts, never by importing another service implementation.
