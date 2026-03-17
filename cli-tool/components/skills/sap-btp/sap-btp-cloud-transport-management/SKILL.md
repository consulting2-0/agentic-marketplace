---
name: sap-btp-cloud-transport-management
description: |
  SAP BTP Cloud Transport Management (TMS) skill. Use when setting up transport routes
  for deploying MTA applications across BTP landscapes (dev → test → prod), managing
  transport requests, integrating TMS with CI/CD pipelines, and automating MTA transport
  via the TMS REST API or SAP CI/CD service.

  Keywords: cloud transport management, tms, btp transport, mta transport, transport route,
  transport node, mtar upload, landscape management, ci/cd btp, change management btp
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://help.sap.com/docs/cloud-transport-management
---

# SAP BTP Cloud Transport Management Skill

## Transport Landscape Concept
```
DEV CF Space ──(import)──▶ Transport Node DEV
                                   │ (forward)
                                   ▼
                          Transport Node TEST ──▶ TEST CF Space
                                   │ (forward, manual approval)
                                   ▼
                          Transport Node PROD ──▶ PROD CF Space
```

## TMS Setup Steps

### 1. Create TMS Service Instance
```bash
cf create-service transport lite my-tms
cf create-service-key my-tms tms-key
cf service-key my-tms tms-key   # Get credentials
```

### 2. Configure Transport Nodes (BTP Cockpit → TMS)
```
Node: DEV
  Type: Cloud Foundry
  CF API Endpoint: https://api.cf.eu20.hana.ondemand.com
  Organization: my-org
  Space: dev

Node: TEST
  Type: Cloud Foundry
  Space: test
  Require Approval: No

Node: PROD
  Type: Cloud Foundry
  Space: prod
  Require Approval: Yes (manual gate)
```

### 3. Create Transport Route
```
DEV → TEST → PROD
(with approval on TEST→PROD)
```

## Upload MTAR to TMS (API)
```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function uploadMtarToTMS(mtarPath, tmsCredentials, description) {
  // Get OAuth token
  const tokenRes = await axios.post(`${tmsCredentials.uri}/oauth/token`, null, {
    params: {
      grant_type: 'client_credentials',
      client_id: tmsCredentials.clientid,
      client_secret: tmsCredentials.clientsecret
    }
  });
  const token = tokenRes.data.access_token;

  // Upload MTAR file
  const form = new FormData();
  form.append('file', fs.createReadStream(mtarPath));
  form.append('namedUser', 'ci-pipeline');
  form.append('description', description);

  const uploadRes = await axios.post(
    `${tmsCredentials.uri}/v2/files/upload`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    }
  );

  const fileId = uploadRes.data.fileId;
  console.log(`Uploaded MTAR with fileId: ${fileId}`);

  // Create transport request targeting DEV node
  const tpRes = await axios.post(
    `${tmsCredentials.uri}/v2/nodes/upload`,
    {
      nodeName: 'DEV',
      contentType: 'MTA',
      storageType: 'FILE',
      entries: [{ uri: fileId }],
      description: description
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  console.log(`Transport request created: ${tpRes.data.transportRequestId}`);
  return tpRes.data;
}
```

## GitHub Actions Integration
```yaml
# .github/workflows/deploy.yml (TMS step)
- name: Upload to TMS
  run: |
    # Get TMS token
    TOKEN=$(curl -s -X POST "$TMS_URI/oauth/token" \
      -d "grant_type=client_credentials" \
      -d "client_id=$TMS_CLIENT_ID" \
      -d "client_secret=$TMS_CLIENT_SECRET" | jq -r '.access_token')

    # Upload MTAR
    FILE_ID=$(curl -s -X POST "$TMS_URI/v2/files/upload" \
      -H "Authorization: Bearer $TOKEN" \
      -F "file=@dist/myapp_1.0.0.mtar" \
      -F "namedUser=github-actions" | jq -r '.fileId')

    # Trigger transport to DEV
    curl -s -X POST "$TMS_URI/v2/nodes/upload" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"nodeName\":\"DEV\",\"contentType\":\"MTA\",\"storageType\":\"FILE\",
           \"entries\":[{\"uri\":\"$FILE_ID\"}],\"description\":\"$GITHUB_SHA\"}"
  env:
    TMS_URI: ${{ secrets.TMS_URI }}
    TMS_CLIENT_ID: ${{ secrets.TMS_CLIENT_ID }}
    TMS_CLIENT_SECRET: ${{ secrets.TMS_CLIENT_SECRET }}
```

## Transport Request Lifecycle
```
INITIAL → RUNNING → SUCCESS
                  ↘ FAILED (retry or reset)

Manual approval gate (PROD):
  WAITING_FOR_APPROVAL → APPROVED → RUNNING → SUCCESS
                       → REJECTED
```

## Documentation Links
- TMS Docs: https://help.sap.com/docs/cloud-transport-management
- TMS REST API: https://help.sap.com/docs/cloud-transport-management/sap-cloud-transport-management/transport-management-service-rest-api
- Project Piper TMS Step: https://www.project-piper.io/steps/tmsUpload/
