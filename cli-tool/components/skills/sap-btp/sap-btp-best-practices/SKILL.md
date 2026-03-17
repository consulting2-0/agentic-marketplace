---
name: sap-btp-best-practices
description: |
  SAP BTP architecture and development best practices skill. Use when reviewing
  BTP application designs, conducting architecture assessments, ensuring compliance
  with SAP's recommended practices for security, scalability, cost optimization,
  multi-tenancy, and SAP Clean Core principles.

  Keywords: btp best practices, clean core, side-by-side extension, btp security,
  btp architecture review, scalability, cost optimization, multi-tenancy saas,
  btp governance, sap recommended practices
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://help.sap.com/docs/btp/best-practices
---

# SAP BTP Best Practices Skill

## Clean Core Principles

```
Keep SAP Core CLEAN:
  ✓ No modifications to SAP standard code
  ✓ Extensions via released APIs only
  ✓ Side-by-side on BTP, not in the core
  ✓ Upgrade compatibility guaranteed
  ✓ Use SAP Extensibility Explorer to find right extension option
```

## Extension Decision Matrix

| Requirement | Extension Type | Technology |
|---|---|---|
| UI personalisation (user) | Key User Extensibility | SAP Fiori Adaptation |
| New fields on existing screen | Key User Extensibility | Custom Fields & Logic |
| New standalone app | Side-by-side | CAP + UI5 on BTP |
| Process automation | Side-by-side | SAP Build Process Automation |
| Complex integration | Side-by-side | Cloud Integration |
| ABAP logic (cloud) | Developer Extensibility | BTP ABAP Environment |
| Analytics | Side-by-side | SAP Datasphere + SAC |

## Security Best Practices

### Authentication
```
✓ Always use XSUAA (OAuth2 + OIDC) — never roll your own
✓ Use SAP IAS for corporate identity federation
✓ Short-lived tokens (XSUAA default: 12h; recommend < 1h for sensitive)
✓ mTLS for service-to-service communication where possible
✓ Credential rotation strategy defined and tested
```

### Authorisation
```
✓ Scopes map to atomic capabilities (not broad "admin" scope)
✓ Use attribute-based access control (XSUAA attributes) for data filtering
✓ Never trust client-side authorisation — always validate on server
✓ Audit log all privileged operations
✓ Regular role collection review (quarterly minimum)
```

### Data Security
```
✓ Encrypt data at rest (HANA Cloud default)
✓ TLS 1.2+ for all connections
✓ No PII in log output
✓ GDPR: right-to-erasure design documented
✓ Data residency: deploy to correct BTP region
✓ No credentials in Git, environment variables, or logs
  → Use BTP Credential Store or CF user-provided services
```

## Cost Optimization

### Service Plan Selection
```
Development/Demo:  Free / Trial plans where available
Test:              Standard plans (shared infrastructure)
Production:        Premium only if SLA requires it

HANA Cloud:        Right-size instance (start small, scale up)
AI Core:           Standard plan unless production inference needed
CI/CD Service:     Lite plan is free — use first
HTML5 Repo:        App-host plan (pay per GB stored)
```

### Architecture Patterns for Cost
```
1. Serverless-first: Kyma Functions for infrequent workloads
2. JMS queues: batch processing reduces instance count
3. Caching: Response Cache in API Management saves backend calls
4. Auto-scaling: Scale down after hours for non-prod spaces
5. Shared HANA: hdi-shared plan (vs dedicated) unless isolation needed
```

## Scalability Patterns

### Stateless Services
```javascript
// ✓ Good: Store state in HANA Cloud, not in memory
const sessionData = await SELECT.one.from(Sessions).where({ userId: req.user.id });

// ✗ Bad: In-memory state (lost on restart/scale)
global.userSessions[req.user.id] = { cart: [...] };
```

### Async Processing
```
Sync request → JMS Queue → Consumer iFlow/Worker
                               ↓
                          Process & store result
                               ↓
                          Notify via callback URL or polling endpoint
```

### CF Auto-scaling Policy (JSON)
```json
{
  "instance_min_count": 1,
  "instance_max_count": 10,
  "scaling_rules": [
    { "metric_type": "cpu",       "threshold": 70, "operator": ">", "adjustment": "+1", "cool_down_secs": 120 },
    { "metric_type": "cpu",       "threshold": 30, "operator": "<", "adjustment": "-1", "cool_down_secs": 300 },
    { "metric_type": "memoryused","threshold": 400, "operator": ">", "adjustment": "+1", "cool_down_secs": 120 }
  ]
}
```

## Multi-Tenancy SaaS Pattern

```
Tenant A ──────────────────────────────┐
Tenant B ────────────────────────────┐ │
Tenant C ──────────────────────────┐ │ │
                                   ↓ ↓ ↓
                    CAP MTX Sidecar (tenant mgmt)
                             ↓
                    CAP Service (stateless)
                             ↓
                  Per-tenant HANA HDI container
                  (data isolation guaranteed)
```

## Documentation Links
- BTP Best Practices: https://help.sap.com/docs/btp/best-practices
- Clean Core Methodology: https://www.sap.com/documents/2023/06/clean-core.html
- BTP Security Guide: https://help.sap.com/docs/btp/sap-btp-security-recommendation-c8a9bb59fe624a2593c0e4f4e4f75c7b
- BTP Discovery Center: https://discovery-center.cloud.sap
