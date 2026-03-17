---
name: sap-btp-master-data-integration
description: |
  SAP BTP Master Data Integration (MDI) skill. Use when synchronising master data
  (Business Partners, Products, Cost Centers, etc.) across SAP and non-SAP systems
  using SAP MDI service, ONE Domain Model (ODM) subscriptions, Master Data Governance
  (MDG) integration, and designing master data orchestration patterns on BTP.

  Keywords: master data integration, mdi, one domain model, odm, business partner,
  master data governance, mdg, master data sync, btp master data, data replication
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://help.sap.com/docs/master-data-integration
---

# SAP BTP Master Data Integration (MDI) Skill

## MDI Architecture
```
Master Data Source (S/4HANA / MDG)
    │ publish changes via ODM events
    ▼
SAP Master Data Integration Service (BTP)
    │ distribute via subscription
    ▼
Target Systems (SuccessFactors, Fieldglass, BTP Apps)
```

## ONE Domain Model (ODM) — Key Business Objects

| ODM Object | Description | Key Fields |
|---|---|---|
| `sap.odm.businesspartner.BusinessPartner` | Customer, Supplier, Person | ID, roles, addresses |
| `sap.odm.product.Product` | Material master | ID, categories, UoM |
| `sap.odm.finance.costobject.CostCenter` | CO cost centers | ID, company code, validity |
| `sap.odm.finance.costobject.ProfitCenter` | CO profit centers | ID, company code |
| `sap.odm.workforce.WorkAssignment` | Employee assignments | person, org unit |

## MDI API — Create Subscription
```javascript
const axios = require('axios');

async function createMDISubscription(mdiCredentials, targetSystem) {
  const token = await getToken(mdiCredentials);

  const subscription = await axios.post(
    `${mdiCredentials.endpoints.mdi}/sap/odm/v1/odm/businesspartner/BusinessPartner/subscriptions`,
    {
      ownerId: `my-btp-app-${targetSystem}`,
      // ODM fields to receive
      initialLoadEnabled: true,
      // Webhook endpoint in your BTP app
      webhookEndpoint: `https://my-app.cfapps.eu20.hana.ondemand.com/api/mdi/businesspartner`,
      webhookAuth: {
        type: 'oauth2',
        clientId: process.env.WEBHOOK_CLIENT_ID,
        clientSecret: process.env.WEBHOOK_CLIENT_SECRET,
        tokenUrl: process.env.WEBHOOK_TOKEN_URL
      }
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return subscription.data;
}
```

## MDI Webhook Handler (Receive Changes)
```javascript
// POST /api/mdi/businesspartner
app.post('/api/mdi/businesspartner', async (req, res) => {
  // Validate MDI token
  if (!validateMDIToken(req.headers.authorization)) {
    return res.status(401).send();
  }

  const changes = req.body;

  for (const change of changes.events || []) {
    const { entityKey, operation, entity } = change;

    switch (operation) {
      case 'CREATE':
        await createBusinessPartner(entity);
        break;
      case 'UPDATE':
        await updateBusinessPartner(entityKey, entity);
        break;
      case 'DELETE':
        await deactivateBusinessPartner(entityKey);
        break;
    }
  }

  // Acknowledge receipt
  res.status(200).json({ processed: changes.events?.length || 0 });
});

async function updateBusinessPartner(key, odm) {
  // Map ODM fields to your local data model
  await db.run(UPDATE('BusinessPartners', key.id).with({
    displayName:  odm.displayName,
    email:        odm.person?.emailAddresses?.[0]?.address,
    street:       odm.addresses?.[0]?.streetAddress?.streetName,
    city:         odm.addresses?.[0]?.cityName,
    countryCode:  odm.addresses?.[0]?.country,
    modifiedAt:   new Date().toISOString()
  }));
}
```

## Initial Load Pattern
```javascript
// Trigger initial data load for new subscription
async function triggerInitialLoad(mdiCredentials, subscriptionId) {
  const token = await getToken(mdiCredentials);

  await axios.post(
    `${mdiCredentials.endpoints.mdi}/sap/odm/v1/odm/businesspartner/BusinessPartner/subscriptions/${subscriptionId}/requestInitialLoad`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

  console.log(`Initial load triggered for subscription: ${subscriptionId}`);
}
```

## MDI Integration with SAP Integration Suite
```
S/4HANA MDG (source)
    → MDI Service (distribution hub)
        → Cloud Integration iFlow (enrichment/routing)
            → Target System (ECC, Ariba, external)
```

```groovy
// iFlow Groovy: Parse MDI ODM Business Partner payload
def body = message.getBody(String.class)
def odm = new groovy.json.JsonSlurper().parseText(body)

def bpId = odm.id
def bpName = odm.displayName
def bpRole = odm.businessPartnerRoles?.find { it.businessPartnerRoleCode == 'FLCU00' }

message.setHeader('BPId', bpId)
message.setHeader('BPName', bpName)
message.setHeader('IsCustomer', bpRole != null ? 'Y' : 'N')
```

## Documentation Links
- MDI Docs: https://help.sap.com/docs/master-data-integration
- ONE Domain Model: https://github.com/SAP/odm-specification
- MDI API Reference: https://help.sap.com/docs/master-data-integration/sap-master-data-integration/api-reference
