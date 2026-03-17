---
name: sap-btp-cloud-logging
description: |
  SAP BTP Cloud Logging Service skill. Use when configuring application logging with
  OpenTelemetry, setting up log forwarding from Cloud Foundry apps, creating Kibana
  dashboards for BTP application monitoring, configuring alerts, and implementing
  distributed tracing across microservices on SAP BTP.

  Keywords: sap cloud logging, kibana, opensearch, opentelemetry, distributed tracing,
  log forwarding, cf logs, btp monitoring, application logging, otel, log alerts
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://help.sap.com/docs/cloud-logging
---

# SAP BTP Cloud Logging Skill

## Cloud Logging Architecture
```
CF App (stdout/stderr)
    ↓ log drain
SAP Cloud Logging Service
    ↓
OpenSearch / Kibana (SAP-managed)
    ├── Discover (raw logs)
    ├── Dashboards (custom visualisations)
    └── Alerting (threshold-based alerts)
```

## Service Instance Setup
```bash
# Create Cloud Logging instance
cf create-service cloud-logging standard my-app-logging

# Bind to app
cf bind-service my-cap-srv my-app-logging
cf restage my-cap-srv

# Or in mta.yaml
resources:
  - name: my-app-logging
    type: org.cloudfoundry.managed-service
    parameters:
      service: cloud-logging
      service-plan: standard
```

## OpenTelemetry Setup (Node.js)
```javascript
// otel.js — load before app code
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes: SRA } = require('@opentelemetry/semantic-conventions');

// Get Cloud Logging OTLP endpoint from binding
const loggingBinding = JSON.parse(process.env.VCAP_SERVICES)['cloud-logging']?.[0]?.credentials;

const sdk = new NodeSDK({
  resource: new Resource({
    [SRA.SERVICE_NAME]: 'my-cap-service',
    [SRA.SERVICE_VERSION]: '1.0.0',
    'sap.app.id': 'com.company.myapp'
  }),
  traceExporter: new OTLPTraceExporter({
    url: `${loggingBinding?.ingest_otlp?.url}/v1/traces`,
    headers: { Authorization: `Bearer ${loggingBinding?.ingest_otlp?.token}` }
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: `${loggingBinding?.ingest_otlp?.url}/v1/metrics`,
      headers: { Authorization: `Bearer ${loggingBinding?.ingest_otlp?.token}` }
    }),
    exportIntervalMillis: 60000
  })
});

sdk.start();
process.on('SIGTERM', () => sdk.shutdown());
```

## Structured Logging (JSON)
```javascript
// Always log as JSON to enable Kibana field parsing
const cds = require('@sap/cds');
const logger = cds.log('my-service');

// Structured log entry
logger.info({
  message: 'Order submitted',
  correlationId: req.headers['x-correlation-id'],
  orderId: order.ID,
  customerId: order.customer_ID,
  totalAmount: order.totalAmount,
  component: 'OrderService',
  level: 'INFO'
});

// Error with stack trace
logger.error({
  message: 'Order submission failed',
  error: err.message,
  stack: err.stack,
  orderId: order.ID,
  component: 'OrderService',
  level: 'ERROR'
});
```

## Kibana — Useful Queries (KQL)
```
# Filter by app name
cf_app_name: "my-cap-srv"

# Error logs only
level: ERROR

# Specific correlation ID
correlationId: "abc-123-def"

# Slow requests (> 2 seconds)
response_time_ms > 2000

# CAP OData errors
message: "OData" AND level: ERROR

# Last hour errors
@timestamp >= now-1h AND level: (ERROR OR WARN)
```

## Alert Configuration
```json
{
  "trigger": {
    "schedule": { "interval": "5m" }
  },
  "condition": {
    "script": {
      "source": "ctx.results[0].hits.total.value > 10",
      "lang": "painless"
    }
  },
  "actions": {
    "email_alert": {
      "email": {
        "to": ["ops@company.com"],
        "subject": "BTP App Errors Spike Detected",
        "body": "More than 10 errors in 5 minutes in {{ctx.monitor.name}}"
      }
    }
  }
}
```

## Documentation Links
- Cloud Logging: https://help.sap.com/docs/cloud-logging
- OpenTelemetry: https://opentelemetry.io/docs/
- Kibana KQL: https://www.elastic.co/guide/en/kibana/current/kuery-query.html
