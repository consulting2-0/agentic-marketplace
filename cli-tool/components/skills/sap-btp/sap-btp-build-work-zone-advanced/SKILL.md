---
name: sap-btp-build-work-zone-advanced
description: |
  SAP Build Work Zone Advanced Edition skill. Use when configuring the SAP Build Work
  Zone site, managing content providers, setting up SAP Task Center integration, adding
  UI integration cards, configuring SAP Mobile Start, managing roles and workspaces,
  integrating Joule AI assistant, enabling federated content from S/4HANA and BTP,
  and personalizing the digital workplace experience.

  Keywords: sap build work zone, workzone advanced, launchpad advanced, task center,
  ui integration cards, sap mobile start, joule workzone, content provider, sap sites,
  digital workplace, sap work zone, my home, btp launchpad
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://help.sap.com/docs/build-work-zone-advanced-edition
---

# SAP Build Work Zone — Advanced Edition Skill

## Architecture Overview

```
SAP Build Work Zone (Advanced Edition)
├── Site Manager (admin portal)
│   ├── Content Providers (S/4HANA, BTP apps, 3rd party)
│   ├── Workspaces (pages, groups, tiles)
│   └── Role Management
├── SAP Task Center (unified to-do inbox)
│   ├── S/4HANA Workflows
│   ├── SAP Concur, Ariba, SuccessFactors
│   └── BTP Process Automation
├── SAP Mobile Start (mobile companion app)
├── UI Integration Cards (micro-frontends)
└── Joule AI Assistant (embedded)
```

---

## Step 1 — Subscription and Setup

```
BTP Cockpit → Subaccount → Subscriptions:
  Subscribe to: SAP Build Work Zone, Advanced Edition

Assign roles:
  - Launchpad_Admin     → Site Manager access
  - WorkZone_User       → End-user access
  - WorkZone_Manager    → Workspace management

Trust configuration:
  → Use custom IdP (if SSO required)
  → Map IdP groups to Work Zone roles
```

---

## Step 2 — Content Provider Configuration

### S/4HANA Cloud Content Provider

```
Site Manager → Channel Manager → New HTML5 Apps Provider

Provider Type: SAP S/4HANA Cloud
Name:          S4H_PROD
Description:   S/4HANA Production System

BTP Destination: S4H_PROD_ODATA
  (must have WebIDEEnabled=true, sap-client header set)

Update Fetch Mode: Automatic
```

### BTP HTML5 Apps Provider

```
Site Manager → Channel Manager → New HTML5 Apps Provider

Provider Type: SAP BTP HTML5 Apps
Name:          BTP_HTML5_APPS
Description:   Custom BTP applications

→ All apps deployed to HTML5 Repository appear automatically
→ Enable "Display in Site" per app
```

---

## Step 3 — Site Configuration

```javascript
// Site settings via Work Zone Admin API
// GET site configuration
const response = await fetch(
  `${workzoneUrl}/api/v2/sites`,
  { headers: { Authorization: `Bearer ${token}` } }
);

// Create a new site
const newSite = await fetch(
  `${workzoneUrl}/api/v2/sites`,
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Employee Portal',
      config: {
        themeId: 'sap_horizon',
        locale: 'en',
        enableMobileStart: true,
        enableJoule: true
      }
    })
  }
);
```

---

## SAP Task Center Integration

### Required BTP Services
```
1. SAP Task Center service instance
   Plan: standard

2. Task Center destination setup:
   Name:         S4H_TASK_PROVIDER
   Type:         HTTP
   URL:          https://my-s4.company.com
   Auth:         OAuth2SAMLBearerAssertion
   Properties:
     tc.enabled: true
     tc.provider_type: S/4HANA Cloud
     tc.notifications.enabled: true
```

### Task Center API Usage
```javascript
// Fetch tasks for current user
async function getTasks(taskCenterUrl, token) {
  const response = await fetch(
    `${taskCenterUrl}/v1/tasks?status=READY&$top=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await response.json();
  return data.value.map(task => ({
    id:          task.ID,
    title:       task.Subject,
    system:      task.TaskDefinitionID,
    createdAt:   task.CreatedAt,
    priority:    task.Priority,
    actionUrl:   task.TaskDecisionOptions?.[0]?.DecisionURL
  }));
}

// Complete a task
async function completeTask(taskCenterUrl, token, taskId, decision) {
  return fetch(
    `${taskCenterUrl}/v1/tasks/${taskId}/decisions`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, comment: '' })
    }
  );
}
```

---

## UI Integration Cards

### Card Manifest (`manifest.json`)
```json
{
  "sap.app": {
    "id": "com.company.cards.SalesKPI",
    "type": "card",
    "title": "Sales KPI"
  },
  "sap.card": {
    "type": "Analytical",
    "header": {
      "title": "Monthly Revenue",
      "subTitle": "vs. Budget",
      "status": { "text": "{/totalCount} orders" }
    },
    "content": {
      "chartType": "donut",
      "data": {
        "request": {
          "url": "/sap/opu/odata4/sap/zsales_api/srvd/sap/zsales/0001/SalesOrders",
          "parameters": { "$top": "10", "$select": "Amount,Category" }
        }
      },
      "dimensions": [{ "label": "Category", "value": "{Category}" }],
      "measures": [{ "label": "Revenue", "value": "{Amount}" }]
    }
  }
}
```

### Deploy Card to Work Zone
```bash
# Build and deploy card as HTML5 app
mbt build
cf deploy mta_archives/sales-kpi-card_1.0.0.mtar

# Or use Fiori Tools for card development:
# yo @sap/fiori:card
```

---

## SAP Mobile Start Configuration

```
Work Zone Admin → Mobile → SAP Mobile Start

Enable: ✓ SAP Mobile Start
Configure:
  - Home screen layout (tiles, insights)
  - Push notifications (via SAP Mobile Services)
  - Deep links (custom URL scheme)

QR Code:
  → Displayed in Work Zone profile page
  → Employees scan to onboard device
```

```javascript
// Mobile Start Push Notification via Mobile Services API
async function sendPushNotification(mobileServicesUrl, token, userId, message) {
  return fetch(
    `${mobileServicesUrl}/mobileservices/v2/notifications`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceType: 'mobile_start',
        userID: userId,
        alert: message.title,
        body: message.body,
        appID: 'com.sap.mobilestart'
      })
    }
  );
}
```

---

## Role and Workspace Management

```
Site Manager → Workspaces → Create Workspace

Workspace Types:
  Public    → visible to all users
  Private   → by invitation
  Managed   → admin-controlled membership

Assign content to workspace:
  → Tiles from content providers
  → Workpages (custom page builder)
  → Cards (UI Integration Cards)
  → Forums, Blogs (optional collaboration features)
```

---

## Joule AI Integration

```
Work Zone Admin → Joule → Enable Joule

Joule capabilities in Work Zone:
  - Answer HR/finance questions via knowledge base
  - Surface Task Center items via natural language
  - Generate content drafts for pages/blogs
  - Trigger BTP Process Automation workflows
  - Summarize documents from SharePoint connector

Joule configuration:
  - Connect SAP AI Core (for custom knowledge base)
  - Set knowledge base sources (SharePoint, Confluence)
  - Define Joule permissions per role
```

---

## Automation: Sync Content via API

```bash
#!/bin/bash
# Trigger content provider refresh via Work Zone API

TOKEN=$(curl -s -X POST "${XSUAA_URL}/oauth/token" \
  -d "grant_type=client_credentials" \
  -d "client_id=${WZ_CLIENT_ID}" \
  -d "client_secret=${WZ_CLIENT_SECRET}" \
  | jq -r '.access_token')

# Refresh content provider
curl -X POST "${WZ_URL}/api/v2/contentProviders/${PROVIDER_ID}/sync" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
```

## Documentation Links
- Build Work Zone Advanced: https://help.sap.com/docs/build-work-zone-advanced-edition
- Task Center: https://help.sap.com/docs/task-center
- UI Integration Cards: https://ui5.sap.com/test-resources/sap/ui/integration/demokit/cardExplorer/
- SAP Mobile Start: https://help.sap.com/docs/SAP_MOBILE_START
