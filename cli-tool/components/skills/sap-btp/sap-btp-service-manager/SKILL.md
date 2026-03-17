---
name: sap-btp-service-manager
description: |
  SAP BTP Service Manager skill. Use when programmatically managing BTP service
  instances and bindings across subaccounts and environments, using the Service Manager
  API, SMCTL CLI tool, or configuring Service Manager for multi-tenancy (instance sharing),
  platform credentials, and automated service provisioning.

  Keywords: service manager, smctl, btp services, service instance, service binding,
  subaccount services, service broker, multi-tenant services, service operator, kyma services
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://help.sap.com/docs/service-manager
---

# SAP BTP Service Manager Skill

## SMCTL CLI
```bash
# Install
npm install -g smctl

# Login (use Service Manager service key)
smctl login \
  --url https://service-manager.cfapps.eu20.hana.ondemand.com \
  --client-id <clientid> \
  --client-secret <secret> \
  --auth-flow client-credentials

# List service offerings
smctl list-offerings

# List service plans for hana
smctl list-plans --offering hana

# Create service instance
smctl provision my-hana-instance hana hdi-shared \
  --subaccount <SUBACCOUNT_ID> \
  --mode sync

# Create service binding
smctl bind my-hana-instance my-hana-binding \
  --mode sync

# Get binding credentials
smctl get-binding my-hana-binding -o json

# Delete instance
smctl deprovision my-hana-instance --mode sync --force
```

## Service Manager API
```javascript
const axios = require('axios');

class ServiceManagerClient {
  constructor(credentials) {
    this.baseUrl = credentials.sm_url;
    this.token = null;
    this.credentials = credentials;
  }

  async getToken() {
    const res = await axios.post(`${this.credentials.url}/oauth/token`, null, {
      params: {
        grant_type: 'client_credentials',
        client_id: this.credentials.clientid,
        client_secret: this.credentials.clientsecret
      }
    });
    return res.data.access_token;
  }

  async createServiceInstance(name, offeringName, planName, params = {}) {
    const token = await this.getToken();
    // First get plan ID
    const plans = await axios.get(`${this.baseUrl}/v1/service_plans`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { fieldQuery: `name eq '${planName}'` }
    });
    const planId = plans.data.items[0]?.id;

    return axios.post(`${this.baseUrl}/v1/service_instances`, {
      name,
      service_plan_id: planId,
      parameters: params
    }, { headers: { Authorization: `Bearer ${token}` } });
  }

  async createBinding(instanceName, bindingName) {
    const token = await this.getToken();
    const instances = await axios.get(`${this.baseUrl}/v1/service_instances`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { fieldQuery: `name eq '${instanceName}'` }
    });
    const instanceId = instances.data.items[0]?.id;

    return axios.post(`${this.baseUrl}/v1/service_bindings`, {
      name: bindingName,
      service_instance_id: instanceId
    }, { headers: { Authorization: `Bearer ${token}` } });
  }
}
```

## Kyma — Service Operator (SAP BTP Operator)
```yaml
# Create service instance in Kyma namespace
apiVersion: services.cloud.sap.com/v1
kind: ServiceInstance
metadata:
  name: my-hana-hdi
  namespace: my-app
spec:
  serviceOfferingName: hana
  servicePlanName: hdi-shared
  parameters:
    database_id: "your-hana-cloud-instance-id"

---
# Bind and create Kubernetes secret
apiVersion: services.cloud.sap.com/v1
kind: ServiceBinding
metadata:
  name: my-hana-hdi-binding
  namespace: my-app
spec:
  serviceInstanceName: my-hana-hdi
  secretName: my-hana-credentials
  credentialsRotationPolicy:
    enabled: true
    rotatedBindingTTL: "1h"
    rotationFrequency: "24h"
```

## Multi-Tenant Service Sharing
```bash
# Share service instance across subaccounts
smctl share-instance my-shared-hana \
  --subaccount TARGET_SUBACCOUNT_ID \
  --mode sync

# Consume shared instance in target subaccount
cf create-service hana hdi-shared my-local-hdi \
  -c '{ "existing_service_instance_id": "SHARED_INSTANCE_ID" }'
```

## Documentation Links
- Service Manager: https://help.sap.com/docs/service-manager
- SMCTL CLI: https://github.com/Peripli/service-manager-cli
- BTP Operator (Kyma): https://github.com/SAP/sap-btp-service-operator
