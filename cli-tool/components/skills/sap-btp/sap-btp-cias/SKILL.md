---
name: sap-btp-cias
description: |
  SAP BTP Continuous Integration and Delivery (CI/CD) service skill. Use when
  configuring SAP CI/CD service pipelines for CAP, Fiori, MTA, and ABAP projects,
  setting up GitHub/GitLab/Bitbucket repository connections, configuring pipeline
  stages (build, test, compliance, deploy), managing credentials, triggering
  pipeline runs via API, and monitoring pipeline status in the CI/CD service UI.

  Keywords: sap cicd, sap ci cd service, btp cicd, sap continuous integration,
  sap pipeline, cicd service btp, cap cicd, fiori cicd, mta build deploy, abap cicd
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://help.sap.com/docs/continuous-integration-and-delivery
---

# SAP BTP CI/CD Service Skill

## Pipeline Types Supported

| Pipeline Template | For | Deploy Target |
|---|---|---|
| **SAP Cloud Application Programming Model** | CAP (Node.js / Java) | Cloud Foundry |
| **SAP Fiori in the Cloud** | Fiori/UI5 apps | CF HTML5 Repo / ABAP |
| **SAP Fiori using the ABAP Environment** | ABAP-managed Fiori | BTP ABAP Environment |
| **Container-Based Applications** | Docker/Kyma workloads | Kyma |
| **SAP Integration Suite Artifacts** | iFlows, APIs | Integration Suite |
| **Cloud Foundry Environment** | Any CF app/MTA | Cloud Foundry |
| **SAP BTP ABAP Environment** | ABAP packages | BTP ABAP Environment |

---

## Step 1 — Connect Repository

```
SAP CI/CD Service UI:
  → Repositories → Add Repository
  → Name: my-cap-app
  → Clone URL: https://github.com/company/my-cap-app.git
  → Type: GitHub / GitLab / Bitbucket / Azure Repos

  Credentials:
  → Add Credential → Basic Auth (PAT recommended)
  → Name: github-pat
  → Username: <github-user>
  → Password: <PAT with repo scope>
```

---

## Step 2 — Create Credentials

```
CI/CD Service → Credentials → Add Credential

Types:
  Basic Authentication     → Git PAT, CF user, ABAP user
  OAuth2 Client Credentials → CF API token, AI Core
  Secret Text              → API keys, tokens
```

---

## Step 3 — Configure Job (Pipeline)

### CAP Node.js Pipeline (`.pipeline/config.yml`)

```yaml
# .pipeline/config.yml — committed in repo root
general:
  buildTool: "mta"

service:
  output:
    commonPipelineEnvironment:
      artifactVersion: "${env.VERSION}"

stages:
  Build:
    mavenExecuteStaticCodeChecks: false   # Java only
    npmExecuteLint: true
    mtaBuild: true

  Additional Unit Tests:
    npmExecuteScripts: true

  Malware Scan:
    malwareExecuteScan: true              # if scanner configured

  Acceptance:
    # Deploy to DEV space for integration tests
    cloudFoundryDeploy: true

  Release:
    cloudFoundryDeploy: true             # deploy to PROD
```

### CAP Java Pipeline

```yaml
general:
  buildTool: "mta"

stages:
  Build:
    mavenExecuteStaticCodeChecks: true
    mavenExecuteTests: true
    mtaBuild: true

  Additional Unit Tests:
    mavenExecuteTests: true

  Release:
    cloudFoundryDeploy: true
```

### Fiori App Pipeline

```yaml
general:
  buildTool: "mta"

stages:
  Build:
    npmExecuteLint: true
    mtaBuild: true

  Acceptance:
    uiVeri5ExecuteTests: false

  Release:
    cloudFoundryDeploy: true
```

---

## Step 4 — CI/CD Job Definition in UI

```
CI/CD Service → Jobs → Add Job

Job Name:    my-cap-app-pipeline
Repository:  my-cap-app  (linked above)
Branch:      main
Pipeline:    SAP Cloud Application Programming Model

Stages:
  ✓ Build
  ✓ Additional Unit Tests
  ✗ Malware Scan  (optional)
  ✓ Acceptance
  ✓ Release

Deploy to CF:
  API Endpoint: https://api.cf.eu20.hana.ondemand.com
  Org:          my-org
  Space DEV:    dev
  Space PROD:   prod
  Credential:   cf-deploy-user
```

---

## Trigger Pipeline via API

```bash
# Get OAuth token for CI/CD service
TOKEN=$(curl -s -X POST \
  "https://<subaccount>.authentication.eu20.hana.ondemand.com/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=$CICD_CLIENT_ID&client_secret=$CICD_CLIENT_SECRET" \
  | jq -r '.access_token')

CICD_URL="https://cicd.cfapps.eu20.hana.ondemand.com"

# Trigger a job run
curl -X POST \
  "$CICD_URL/api/v1/jobs/<jobId>/runs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Get run status
curl -X GET \
  "$CICD_URL/api/v1/jobs/<jobId>/runs" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.runs[-1] | {status, startTime, endTime}'
```

---

## GitHub Actions → Trigger SAP CI/CD

```yaml
# .github/workflows/trigger-btp-cicd.yml
name: Trigger SAP CI/CD

on:
  push:
    branches: [main]

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Get XSUAA Token
        id: token
        run: |
          TOKEN=$(curl -s -X POST \
            "${{ secrets.XSUAA_URL }}/oauth/token" \
            -d "grant_type=client_credentials" \
            -d "client_id=${{ secrets.CICD_CLIENT_ID }}" \
            -d "client_secret=${{ secrets.CICD_CLIENT_SECRET }}" \
            | jq -r '.access_token')
          echo "token=$TOKEN" >> $GITHUB_OUTPUT

      - name: Trigger Pipeline
        run: |
          curl -X POST \
            "${{ vars.CICD_URL }}/api/v1/jobs/${{ vars.JOB_ID }}/runs" \
            -H "Authorization: Bearer ${{ steps.token.outputs.token }}" \
            -H "Content-Type: application/json" \
            -d '{}'
```

---

## ABAP Pipeline Configuration

```yaml
# .pipeline/config.yml for BTP ABAP Environment
general:
  buildTool: "abap"

stages:
  Build:
    abapEnvironmentPullGitRepo: true

  ATC:
    abapEnvironmentRunATCCheck: true
    atcConfig: atcConfig.yml

  Release:
    abapEnvironmentCreateTagBackedObject: true
```

```yaml
# atcConfig.yml — ATC check scope
atcConfig:
  objectSet:
    softwareComponents:
      - name: /DMO/FLIGHT
    packages:
      - name: ZMYPACKAGE
```

---

## Environment Variables in Pipelines

```yaml
# .pipeline/config.yml — inject secrets from CI/CD credentials
general:
  buildTool: "mta"

steps:
  cloudFoundryDeploy:
    cfApiEndpoint: "https://api.cf.eu20.hana.ondemand.com"
    cfOrg:         "my-org"
    cfSpace:       "dev"
    deployTool:    "mtaDeployPlugin"
    mtaDeployParameters: "--version-rule ALL"
    cloudFoundryCredentialsId: "cf-deploy-user"  # credential name in CI/CD
```

---

## Webhook Setup (Auto-trigger on Push)

```
GitHub Repository Settings:
  → Webhooks → Add webhook
  → Payload URL: https://cicd.cfapps.eu20.hana.ondemand.com/api/v1/webhook/github
  → Content type: application/json
  → Secret: <webhook-secret>
  → Events: Just the push event

SAP CI/CD → Job:
  → Enable "Webhook" trigger
  → Copy webhook URL and secret
```

## Documentation Links
- SAP CI/CD Service: https://help.sap.com/docs/continuous-integration-and-delivery
- Pipeline Configuration: https://help.sap.com/docs/continuous-integration-and-delivery/sap-continuous-integration-and-delivery/configure-sap-cloud-application-programming-model-job-in-your-repository
- CI/CD API: https://help.sap.com/docs/continuous-integration-and-delivery/sap-continuous-integration-and-delivery/api-documentation
