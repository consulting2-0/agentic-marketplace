---
name: sap-btp-integration-suite
description: |
  SAP Integration Suite development and operations skill. Use when building integration
  flows (iFlows) to connect applications, creating/managing/debugging API proxies and
  policies, implementing event-driven architectures with Event Mesh, setting up B2B/EDI
  integrations with Trading Partner Management, deploying hybrid integrations with Edge
  Integration Cell, migrating from SAP Process Orchestration (PO/PI), configuring
  adapters (SFTP, HTTP, OData, RFC, AMQP, Kafka), writing Groovy/JavaScript scripts,
  or troubleshooting integration errors and monitoring message flows.

  Keywords: sap integration suite, cloud integration, cpi, iflow, api management,
  apim, api proxy, event mesh, edge integration cell, b2b, edi, trading partner,
  groovy script, message mapping, sftp adapter, odata adapter, idoc, exactly once
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://help.sap.com/docs/integration-suite
---

# SAP BTP Integration Suite

## Capability Overview

| Capability | Purpose | Key Artefact |
|---|---|---|
| Cloud Integration | A2A/B2B message processing | Integration Flow (iFlow) |
| API Management | API lifecycle & governance | API Proxy |
| Event Mesh | Event-driven architecture | Topics & Queues |
| Edge Integration Cell | Hybrid Kubernetes deployment | Edge runtime |
| Integration Advisor | AI-powered B2B mapping | MIG / MAG |
| Trading Partner Management | Partner onboarding | Agreements |
| Integration Assessment | Technology selection | ISA-M map |
| Migration Assessment | PO/PI migration planning | Extraction |

## iFlow Structure
```
Sender → [Adapter] → Integration Process → [Adapter] → Receiver
                           ↓
              ┌────────────┴────────────┐
              │  - Content Modifier     │
              │  - Router / Filter      │
              │  - Message Mapping      │
              │  - Splitter/Aggregator  │
              │  - Groovy Script        │
              │  - Request Reply        │
              └─────────────────────────┘
```

## Common iFlow Steps

| Category | Steps |
|---|---|
| Routing | Router, Filter, Multicast, Recipient List |
| Transformation | Content Modifier, Mapping, Converter, Script |
| Splitting | General Splitter, Iterating Splitter, EDI Splitter |
| Persistence | Data Store, Write Variable, JMS Send |
| External | Request Reply, Send, Poll Enrich |
| Security | Encryptor, Decryptor, Signer, Verifier |
| Error Handling | Exception Subprocess, Escalation Event |

## Groovy Script Patterns
```groovy
import com.sap.gateway.ip.core.customdev.util.Message
import org.slf4j.LoggerFactory

def log = LoggerFactory.getLogger('myScript')

def Message processData(Message message) {
    // Read body
    def body = message.getBody(String.class)

    // Headers and properties
    def correlationId = message.getHeader('correlationId', String.class)
    def docType = message.getProperty('documentType')

    // Modify
    message.setHeader('X-Processed-By', 'SAP-CPI')
    message.setHeader('X-Correlation-ID', UUID.randomUUID().toString())

    // Parse JSON
    def json = new groovy.json.JsonSlurper().parseText(body)
    json.processedAt = new Date().format("yyyy-MM-dd'T'HH:mm:ss'Z'")
    message.setBody(groovy.json.JsonOutput.toJson(json))

    log.info("Processed document: ${correlationId}")
    return message
}
```

## API Management — Policy Snippets
```xml
<!-- Rate limiting -->
<SpikeArrest name="SA-100rpm">
  <Rate>100pm</Rate>
  <UseEffectiveCount>true</UseEffectiveCount>
</SpikeArrest>

<!-- API Key verification -->
<VerifyAPIKey name="VAK-Check">
  <APIKey ref="request.header.x-api-key"/>
</VerifyAPIKey>

<!-- JWT validation -->
<VerifyJWT name="VJ-Token">
  <Algorithm>RS256</Algorithm>
  <PublicKey><JWKS uri="https://idp/.well-known/jwks.json"/></PublicKey>
  <Issuer>https://idp/</Issuer>
</VerifyJWT>

<!-- Response cache (5 min) -->
<ResponseCache name="RC-5min">
  <CacheKey>
    <Prefix>api-cache</Prefix>
    <KeyFragment ref="request.uri" type="string"/>
  </CacheKey>
  <ExpirySettings><TimeoutInSeconds>300</TimeoutInSeconds></ExpirySettings>
</ResponseCache>
```

## Event Mesh — Queue Configuration
```json
{
  "name": "procurement.po.inbound",
  "accessType": "EXCLUSIVE",
  "maxMsgSpoolUsage": 5000,
  "respectsTTL": true,
  "deadMsgQueue": "procurement.po.inbound.dead",
  "subscriptions": [
    "sap/s4/beh/purchaseorder/v1/PurchaseOrder/Created/v1",
    "sap/s4/beh/purchaseorder/v1/PurchaseOrder/Changed/v1"
  ]
}
```

## Message Quality of Service

### Exactly-Once Pattern
```
Sender → [Idempotent Process Call] → Check ID Store → Process → [Mark Complete]
                                          ↓ (duplicate)
                                     Return cached response
```

Use: JMS Queues + Idempotent Process Call + Data Store for guaranteed delivery.

## Monitoring

```
Integration Suite → Monitor → Integrations and APIs
  ├── Message Processing → All Integration Flows
  ├── Manage Integration Content → Deployed Artefacts
  ├── Manage Security → Keystores, Credentials
  └── Manage Stores → Data Stores, Variables, Queues
```

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| Adapter connection failed | Wrong credentials / firewall | Check Cloud Connector, rotate credentials |
| Message mapping error | Invalid XPath / schema mismatch | Validate source/target structure |
| Timeout | Slow backend | Increase adapter timeout; optimise mapping |
| Duplicate messages | No idempotency | Add Idempotent Process Call |
| Memory issue | Large payload | Enable streaming; reduce log verbosity |

## Adapter Reference

| Adapter | Protocol | Use Case |
|---|---|---|
| HTTP/HTTPS | REST | Generic REST APIs |
| SFTP | SSH | File-based exchange |
| AS2 | AS2/EDI | B2B EDI exchange |
| JMS | AMQP | Async decoupling |
| IDoc | SAP IDoc | S/4HANA ALE integration |
| OData V2/V4 | OData | SAP cloud services |
| JDBC | SQL | Database integration |
| Kafka | Kafka | Event streaming |

## Documentation Links
- Help Portal: https://help.sap.com/docs/integration-suite
- GitHub Docs: https://github.com/SAP-docs/sap-btp-integration-suite
- Community: https://community.sap.com/topics/cloud-platform-integration-suite
- API Hub: https://api.sap.com/
