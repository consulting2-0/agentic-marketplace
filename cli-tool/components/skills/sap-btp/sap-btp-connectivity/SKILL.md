---
name: sap-btp-connectivity
description: |
  SAP BTP Connectivity skill covering Cloud Connector setup and management, Destination
  Service configuration, on-premise system connectivity, principal propagation, SSL/TLS
  certificate management, and Cloud Connector high availability setup.

  Keywords: cloud connector, scc, connectivity service, destination service, on-premise,
  principal propagation, virtual host, ssl, sap btp connectivity, cloud to on-premise,
  rfc adapter, cloud connector ha
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://help.sap.com/docs/connectivity
---

# SAP BTP Connectivity Skill

## Related Skills
- **sap-btp-cloud-platform**: BTP subaccount and destination setup
- **sap-btp-integration-suite**: iFlow adapters using Cloud Connector destinations

## Cloud Connector Architecture
```
SAP BTP (Cloud)
    │ HTTPS tunnel (outbound only)
    ▼
Cloud Connector (on-premise DMZ)
    │ Internal network
    ▼
On-Premise Systems (SAP, DB, APIs)
```

## Cloud Connector Setup
```bash
# Download from SAP Tools: https://tools.hana.ondemand.com/#cloud
# Install on Linux
rpm -i com.sap.scc-ui-*.rpm
# Start SCC
/opt/sap/scc/start.sh

# Admin UI: https://localhost:8443
# Default user: Administrator / manage
```

## Cloud Connector — BTP Subaccount Connection
```
Admin UI → Cloud To On-Premise → Add Subaccount
  Region Host: cf.eu20.hana.ondemand.com
  Subaccount: <your-subaccount-ID>
  Login Email: user@company.com
  Password: ***
  Display Name: EU20 Production
  Description: Production subaccount tunnel
```

## Virtual Host Mapping
```
Cloud Connector Admin → Cloud To On-Premise → Access Control → Add

Protocol: HTTPS
Virtual Host: virtual-s4h-prod      ← use this in BTP destinations
Virtual Port: 443
Internal Host: s4hana-prod.corp.internal
Internal Port: 443
Back-end Type: SAP ABAP System
Check Internal Host: Enabled
```

## Destination Configuration (On-Premise with CC)
```json
{
  "Name": "S4H_ON_PREM",
  "Type": "HTTP",
  "URL": "https://virtual-s4h-prod:443",
  "Authentication": "PrincipalPropagation",
  "ProxyType": "OnPremise",
  "CloudConnectorLocationId": "EU_PRIMARY"
}
```

## Principal Propagation Setup
```
1. BTP → Cloud Connector → Configuration → ON Premise → System Certificates
   → Create and import system certificate (used to sign SAML assertions)

2. Cloud Connector → Cloud To On-Premise → Access Control → Select Mapping
   → Enable: Principal Propagation

3. S/4HANA (ABAP):
   → Transaction TRUST: Import BTP Cloud Connector system certificate
   → Assign to SSL Client PSE
   → Activate: Accept SAML bearer assertions

4. Destination: Authentication = PrincipalPropagation
   → Token forwarded from BTP user context
```

## High Availability (HA) Setup
```
Master SCC ─────── Mirror SCC
     │                   │
     └──────────────────┘
     Both connected to same BTP subaccount
     Master: Active  |  Mirror: Standby
     Auto-failover on master failure
```

## Cloud Connector Troubleshooting

| Issue | Check |
|---|---|
| Subaccount not connected | Verify email/password; check network proxy settings |
| Internal host unreachable | Ping from SCC host; check firewall rules |
| SSL handshake failed | Import CA cert of backend into SCC trust store |
| Principal propagation fails | Re-import system certificate into ABAP TRUST |
| High latency | Check CC resources (CPU/RAM); consider HA mirror |

## Connectivity Service — Programmatic Access
```javascript
// Node.js — fetch proxy for on-premise call
const { ConnectivityProxyAuthorization } = require('@sap/connectivity-proxy-authorization-client');

const auth = new ConnectivityProxyAuthorization({
  serviceBinding: process.env.VCAP_SERVICES  // auto from CF env
});

const proxyConfig = await auth.getProxyConfiguration({
  destinationName: 'S4H_ON_PREM',
  subscriberTenant: req.user.tenant
});

const response = await fetch('https://virtual-s4h-prod:443/sap/opu/odata/...', {
  headers: proxyConfig.headers,
  agent: proxyConfig.httpsAgent
});
```

## Documentation Links
- Cloud Connector: https://help.sap.com/docs/connectivity/sap-btp-connectivity/cloud-connector
- Destination Service: https://help.sap.com/docs/connectivity/sap-btp-connectivity/destination-service
- Principal Propagation: https://help.sap.com/docs/connectivity/sap-btp-connectivity/principal-propagation
