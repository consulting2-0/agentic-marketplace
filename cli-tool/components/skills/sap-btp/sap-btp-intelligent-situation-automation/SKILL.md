---
name: sap-btp-intelligent-situation-automation
description: |
  SAP Intelligent Situation Automation (ISA) skill. Use when automating business
  exceptions and situations from SAP S/4HANA, configuring resolution rules, setting
  up situation handlers, creating automation workflows for overdue deliveries/blocked
  invoices/production alerts, integrating with SAP Build Process Automation, and
  monitoring situation resolution KPIs.

  Keywords: intelligent situation automation, isa btp, sap situations, exception automation,
  situation handling, overdue delivery, blocked invoice, s4hana situations, alert automation,
  situation types, resolution rules, build process automation integration
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://help.sap.com/docs/intelligent-situation-automation
---

# SAP Intelligent Situation Automation Skill

## Concept Overview

```
SAP Intelligent Situation Automation (ISA)
  = Automated resolution of business exceptions ("situations")
    detected in SAP S/4HANA

Flow:
  S/4HANA detects situation (e.g. overdue delivery)
       ↓
  ISA evaluates resolution rules
       ↓
  ISA triggers automation (SAP Build PA workflow / API call / notification)
       ↓
  Situation resolved automatically (or routed to human with context)
```

## Supported Situation Types (S/4HANA)

| Category | Situation Types |
|---|---|
| Sales | Overdue Delivery, Blocked Sales Order, Customer Payment Overdue |
| Procurement | Overdue Purchase Order, Blocked Vendor Invoice, Goods Receipt Missing |
| Finance | Budget Overrun, Failed Payment Run, Blocked AR Item |
| Manufacturing | Production Order Delay, Capacity Shortage |
| Quality | Quality Notification Created, Inspection Lot Blocked |

---

## Step 1 — Subscribe and Configure

```
BTP Cockpit → Subaccount → Subscriptions
  → Subscribe: SAP Intelligent Situation Automation

Required services:
  - SAP Event Mesh (receive S/4 situation events)
  - SAP Build Process Automation (for workflow automation)
  - SAP Business Application Studio (optional, for custom rules)

Role collections:
  - ISA_Admin          → configure situations and rules
  - ISA_BusinessUser   → view and manage situations
```

---

## Step 2 — Connect S/4HANA

```
ISA Admin UI → Systems → Add S/4HANA System

Connection settings:
  System Name:    S4H_PROD
  System URL:     https://my-s4.company.com
  Auth Type:      OAuth2 (client credentials)
  Client ID:      <S4 OAuth client>
  Client Secret:  <secret>

Event Mesh Configuration:
  Namespace:      /company/s4h/prod
  Topic Pattern:  sap/s4/beh/situation/v1/*

→ Test Connection → Save
```

---

## Step 3 — Enable Situation Types

```
ISA Admin UI → Situation Types → Browse Catalog

Enable situation types (examples):

1. Overdue Delivery
   S/4 App: Manage Deliveries
   Trigger: Delivery past confirmed date by N days
   Configure: threshold days = 2

2. Blocked Customer Invoice
   S/4 App: Manage Customer Invoices
   Trigger: Invoice blocked for more than 24 hours
   Configure: block reasons = [Z1, Z2, ZX]

3. Overdue Purchase Order
   S/4 App: Manage Purchase Orders
   Trigger: PO delivery date exceeded
   Configure: threshold days = 1
```

---

## Step 4 — Define Resolution Rules

```javascript
// Resolution Rule (pseudo-code DSL)
// Rule: Auto-confirm delivery if quantity deviation < 2%
SITUATION: "Overdue Delivery"
CONDITION:
  DeviationPct = ABS(ActualQty - ConfirmedQty) / ConfirmedQty * 100
  DeviationPct < 2 AND
  CustomerRiskCategory != "HIGH"

ACTIONS:
  1. Update delivery confirmed date: TODAY + 2
  2. Send notification to customer via email template "DELIVERY_DELAY_AUTO"
  3. Log resolution: "Auto-confirmed — minor quantity deviation"

ELSE:
  Route to: Responsible_Planner
  With context: { delivery, deviation, customerRisk }
```

---

## Resolution Actions Configuration

### Send Email Notification
```json
{
  "actionType": "EMAIL_NOTIFICATION",
  "config": {
    "to":          "{situation.ResponsiblePerson.Email}",
    "template":    "OVERDUE_DELIVERY_ALERT",
    "parameters": {
      "deliveryId":    "{situation.ObjectId}",
      "daysOverdue":   "{situation.ThresholdBreached}",
      "customerName":  "{situation.Customer.Name}"
    }
  }
}
```

### Trigger SAP Build Process Automation Workflow
```json
{
  "actionType": "BUILD_PROCESS_AUTOMATION",
  "config": {
    "projectId":  "blocked-invoice-approval",
    "triggerId":  "start-approval",
    "inputMapping": {
      "invoiceId":     "{situation.ObjectId}",
      "amount":        "{situation.Amount}",
      "currency":      "{situation.Currency}",
      "blockReason":   "{situation.BlockReason}",
      "approverEmail": "{situation.Processor.Email}"
    }
  }
}
```

### Call External API / Webhook
```json
{
  "actionType": "WEBHOOK",
  "config": {
    "url":    "https://my-backend.company.com/api/situations/handle",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer {credentials.API_TOKEN}",
      "Content-Type":  "application/json"
    },
    "body": {
      "situationType":  "{situation.TypeCode}",
      "objectId":       "{situation.ObjectId}",
      "priority":       "{situation.Priority}",
      "timestamp":      "{situation.DetectedAt}"
    }
  }
}
```

---

## Monitor Situations via ISA API

```javascript
const axios = require('axios');

async function getSituations(isaUrl, token, filters = {}) {
  const params = new URLSearchParams({
    status:        filters.status   || 'OPEN',
    situationType: filters.type     || '',
    $top:          filters.top      || 50,
    $orderby:      'DetectedAt desc'
  });

  const response = await axios.get(
    `${isaUrl}/api/v1/situations?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.value;
}

async function resolveManually(isaUrl, token, situationId, resolution) {
  return axios.patch(
    `${isaUrl}/api/v1/situations/${situationId}`,
    {
      Status:           'RESOLVED',
      ResolutionNote:   resolution.note,
      ResolutionAction: resolution.action
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

// Usage
const openSituations = await getSituations(isaUrl, token, {
  type: 'OverdueDelivery',
  status: 'OPEN'
});

console.log(`${openSituations.length} open overdue delivery situations`);
```

---

## KPI Dashboard Integration

```javascript
// Fetch situation KPIs for operations dashboard
async function getSituationKPIs(isaUrl, token, dateFrom) {
  const response = await axios.get(
    `${isaUrl}/api/v1/kpis?dateFrom=${dateFrom}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const kpis = response.data;
  return {
    totalDetected:     kpis.TotalDetected,
    autoResolved:      kpis.AutoResolved,
    manuallyResolved:  kpis.ManuallyResolved,
    avgResolutionTime: kpis.AvgResolutionTimeMinutes,
    automationRate:    (kpis.AutoResolved / kpis.TotalDetected * 100).toFixed(1) + '%'
  };
}
```

---

## Integration with SAP Build Work Zone

```
Work Zone → UI Integration Card: "My Situations"
  → Shows open situations assigned to current user
  → One-click resolution actions
  → Deep-link into S/4HANA object

Card manifest:
  Data source: ISA API (/api/v1/situations?assignedTo=currentUser)
  Actions:     RESOLVE, DELEGATE, ESCALATE
```

---

## Best Practices

1. **Start with high-volume, low-risk situations** — e.g. minor delivery date adjustments
2. **Set conservative thresholds** — tune automation conditions before broadening scope
3. **Always include a human fallback** — route exceptions beyond rule conditions to responsible person
4. **Monitor automation rate** — target 60–80% auto-resolution; investigate outliers
5. **Use structured resolution notes** — enables ML-based rule improvement over time
6. **Integrate with Task Center** — situations that need human action appear in unified inbox

## Documentation Links
- ISA Overview: https://help.sap.com/docs/intelligent-situation-automation
- Situation Types Catalog: https://help.sap.com/docs/intelligent-situation-automation/intelligent-situation-automation/situation-types
- SAP Build Process Automation: https://help.sap.com/docs/build-process-automation
