---
name: sap-btp-developer-guide
description: |
  SAP BTP Developer Guide skill. Use when following SAP BTP development best practices,
  understanding the Golden Path for BTP development, implementing the recommended
  technology stack (CAP + SAP Fiori + HANA Cloud + XSUAA), designing for scalability
  and operability, or applying the BTP solution architecture patterns defined in
  SAP's official developer guidance.

  Keywords: btp developer guide, golden path, btp best practices, cap best practices,
  sap btp architecture, btp development patterns, full-stack cloud-native, btp checklist
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://help.sap.com/docs/btp/best-practices/best-practices-for-sap-btp
---

# SAP BTP Developer Guide Skill

## The BTP Golden Path (Recommended Stack)

```
Frontend:     SAP Fiori Elements / UI5  (HTML5 Repo + Approuter)
Service:      SAP CAP (Node.js or Java) (Cloud Foundry)
Database:     SAP HANA Cloud            (HDI container)
Auth:         XSUAA + SAP IAS           (OAuth2/OIDC)
Integration:  SAP Cloud Integration     (iFlow)
AI:           SAP GenAI Hub + AI Core   (AI Foundation)
Monitoring:   SAP Cloud Logging         (OpenTelemetry)
CI/CD:        SAP CI/CD Service         (Project Piper)
```

## BTP Development Checklist

### Architecture
- [ ] Side-by-side extension (don't modify core SAP systems)
- [ ] Stateless application (12-factor app principles)
- [ ] Use BTP Destination Service for all external connectivity
- [ ] Use XSUAA for authentication — never implement custom auth
- [ ] Multi-tenant ready if building SaaS

### Security
- [ ] All APIs protected with XSUAA JWT validation
- [ ] Principle of least privilege (scope-based access)
- [ ] No credentials in source code or environment variables
  - ✓ Use BTP Credential Store or CF service bindings
- [ ] Enable audit logging for sensitive operations
- [ ] Use SAP IAS for custom identity provider integration
- [ ] TLS 1.2+ for all service communication

### Data Management
- [ ] HANA Cloud as primary persistence (not SQLite in production)
- [ ] CDS-managed schema evolution (no manual DDL)
- [ ] Data backup and recovery plan defined
- [ ] GDPR/data residency requirements addressed

### Operability
- [ ] Structured logging with correlation IDs
- [ ] Health check endpoint (`/health`)
- [ ] Graceful shutdown handling
- [ ] Auto-scaling policy configured
- [ ] Alerting rules defined (SAP Alert Notification Service)

### CI/CD
- [ ] Automated unit and integration tests in pipeline
- [ ] MTA build in CI (not on developer machine)
- [ ] Staged deployments (dev → test → prod)
- [ ] Blue-green deployment for zero-downtime releases
- [ ] Automated rollback on failed smoke tests

## 12-Factor BTP App

| Factor | BTP Implementation |
|---|---|
| Codebase | Git (GitHub/GitLab/Azure DevOps) |
| Dependencies | package.json / pom.xml; npm ci |
| Config | CF environment variables, BTP service bindings |
| Backing services | Treat HANA, XSUAA, Destination as attached resources |
| Build/release/run | MBT build → `cf deploy` |
| Processes | Stateless CF app instances |
| Port binding | CF router + approuter |
| Concurrency | Scale via CF `cf scale -i N` |
| Disposability | Fast startup; graceful SIGTERM handling |
| Dev/prod parity | Same `mta.yaml`, different `mtaext` per environment |
| Logs | Stdout → SAP Cloud Logging (OpenTelemetry) |
| Admin processes | `cf run-task` for one-off migration tasks |

## Structured Logging Pattern (Node.js)
```javascript
const logger = cds.log('my-service');

// Structured log with correlation ID
module.exports = class MyService extends cds.ApplicationService {
  async init() {
    this.before('*', req => {
      // Attach correlation ID from request headers
      const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
      req.context.correlationId = correlationId;
      logger.info('Request received', {
        correlationId,
        method: req.method,
        entity: req.target?.name
      });
    });
    await super.init();
  }
}
```

## Extension vs Modification Decision

```
Does the requirement change core SAP business logic?
  YES → Can it be achieved by configuration?
          YES → Use Customizing (no code)
          NO  → Use SAP BTP side-by-side extension (CAP + OData API)

  NO  → Is it a UI change only?
          YES → Fiori Adaptation Project (key user extensibility)
          NO  → BTP extension with new business logic
```

## Documentation Links
- BTP Best Practices: https://help.sap.com/docs/btp/best-practices/best-practices-for-sap-btp
- BTP Developer Guide: https://help.sap.com/docs/btp/btp-developers-guide/what-is-btp-developers-guide
- Discovery Center: https://discovery-center.cloud.sap
- 12-Factor Apps: https://12factor.net/
