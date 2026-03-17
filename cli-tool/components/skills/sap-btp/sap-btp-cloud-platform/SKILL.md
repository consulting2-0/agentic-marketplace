---
name: sap-btp-cloud-platform
description: |
  SAP Business Technology Platform (BTP) core skill. Use when working with BTP
  subaccounts, directories, Cloud Foundry spaces, BTP CLI (btp CLI), entitlements,
  service instances, service bindings, destinations, identity providers, Trust
  configuration, and overall BTP landscape management.

  Keywords: sap btp, business technology platform, subaccount, cloud foundry, btp cli,
  entitlements, service instance, service binding, destination, trust configuration,
  identity provider, ias, btp global account, cf space, btp cockpit
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://help.sap.com/docs/btp
---

# SAP Business Technology Platform (BTP) Core Skill

## BTP Account Hierarchy
```
Global Account
├── Directories (optional grouping)
│   └── Subaccount
│       ├── Cloud Foundry Environment
│       │   ├── Org
│       │   └── Spaces (dev, test, prod)
│       ├── Kyma Environment
│       ├── ABAP Environment
│       └── Services (entitlements + instances)
```

## BTP CLI (btp CLI)
```bash
# Install
npm install -g @sap/btp-cli
# or download from: https://tools.hana.ondemand.com/#cloud-btpcli

# Login
btp login --url https://accounts.sap.com --idp sap.ids

# Account navigation
btp list accounts/subaccount
btp get accounts/subaccount <SUBACCOUNT_ID>
btp list accounts/directory --global-account <GLOBAL_ACCOUNT_ID>

# Entitlements
btp list accounts/entitlement --subaccount <SUBACCOUNT_ID>
btp assign accounts/entitlement --to-subaccount <ID> \
  --for-service xsuaa --plan application --amount 1

# Services
btp list services/offering
btp list services/plan --offering hana

# Create service instance (via CF cli or btp cli)
btp create services/instance \
  --subaccount <ID> \
  --environment cloudfoundry \
  --service hana \
  --plan hdi-shared \
  --name my-hana-instance

# Destinations
btp list connectivity/destination --subaccount <ID>
btp create connectivity/destination \
  --subaccount <ID> \
  --name S4H_DEV \
  --type HTTP \
  --url https://s4h-dev.company.com:443
```

## CF CLI Commands (Space Level)
```bash
cf login -a https://api.cf.eu20.hana.ondemand.com --sso
cf target -o my-org -s dev

# Apps
cf apps
cf push my-app -f manifest.yml
cf logs my-app --recent
cf scale my-app -i 2 -m 512M

# Services
cf services
cf create-service hana hdi-shared my-hana-hdi
cf bind-service my-app my-hana-hdi
cf service-key my-hana-hdi dev-key
cf create-service-key my-hana-hdi prod-key

# Environment
cf env my-app
cf set-env my-app NODE_ENV production
```

## Service Instance — Key Services

| Service | Plan | Purpose |
|---|---|---|
| `xsuaa` | `application` | OAuth2 / JWT auth |
| `hana` | `hdi-shared` | HANA Cloud HDI container |
| `destination` | `lite` | External connectivity config |
| `connectivity` | `lite` | Cloud Connector access |
| `html5-apps-repo` | `app-host`, `app-runtime` | Static UI5/Fiori hosting |
| `application-logs` | `lite` | Cloud Logging (Kibana) |
| `auditlog` | `oauth2` | Audit log service |
| `cicd-service` | `default` | SAP CI/CD service |
| `event-mesh` | `default` | SAP Event Mesh |
| `aicore` | `extended` | SAP AI Core |

## Trust & Identity Configuration
```bash
# Configure custom IDP (SAP IAS)
btp create security/trust \
  --subaccount <ID> \
  --idp <TENANT>.accounts.ondemand.com \
  --name "Company IAS"

# Add role collection to user
btp assign security/role-collection \
  --to-user user@company.com \
  --subaccount <ID> \
  --role-collection "MyApp - Admin"
```

## Destination Configuration
```json
{
  "Name": "S4H_ODATA",
  "Type": "HTTP",
  "URL": "https://s4hana.company.com:443",
  "Authentication": "OAuth2SAMLBearerAssertion",
  "ProxyType": "OnPremise",
  "CloudConnectorLocationId": "PRIMARY",
  "tokenServiceURL": "https://s4hana.company.com/sap/bc/sec/oauth2/token",
  "audience": "https://s4hana.company.com",
  "clientKey": "s4h-cert-alias",
  "HTML5.DynamicDestination": "true",
  "WebIDEEnabled": "true",
  "WebIDESystem": "S4H_100",
  "WebIDEUsage": "odata_gen,dev_abap"
}
```

## Documentation Links
- BTP Docs: https://help.sap.com/docs/btp
- BTP CLI: https://help.sap.com/docs/btp/sap-btp-neo-environment/account-administration-using-sap-btp-command-line-interface-btp-cli
- CF CLI: https://docs.cloudfoundry.org/cf-cli/
- BTP Discovery Center: https://discovery-center.cloud.sap
