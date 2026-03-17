---
name: sap-fiori-tools
description: |
  SAP Fiori Tools development skill for VS Code and SAP Business Application Studio.
  Use when generating Fiori Elements or Freestyle SAPUI5 applications, configuring
  Page Editor for List Report or Object Page, working with annotations and Service
  Modeler, setting up deployment to ABAP or Cloud Foundry, creating adaptation
  projects, using Guided Development, previewing with mock/live data, configuring
  SAP Fiori launchpad, or using AI-powered generation with Project Accelerator.

  Keywords: fiori tools, fiori elements, list report, object page, annotation,
  page map, page editor, guided development, service modeler, fiori deployment,
  fiori preview, odata v2, odata v4, fiori adaptation, fiori launchpad
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
---

# SAP Fiori Tools Development Skill

## Related Skills
- **sapui5**: Underlying UI5 framework, custom controls, advanced patterns
- **sap-cap-capire**: CAP service integration and OData consumption
- **sap-abap-cds**: ABAP CDS views as OData services
- **sap-btp-cloud-platform**: Deployment targets and CF configuration

## Fiori Tools Components

| Component | Purpose |
|---|---|
| **Application Wizard** | Generate Fiori Elements / Freestyle SAPUI5 templates |
| **Application Modeler** | Visual Page Map and Page Editor |
| **Guided Development** | Step-by-step feature implementation guides |
| **Service Modeler** | Visualize OData metadata and annotations |
| **Annotations Language Server** | Code completion, diagnostics, i18n |
| **Environment Check** | Validate setup and destination config |

## Quick Start
```bash
# Install Fiori Tools extension in VS Code
# Or use SAP Business Application Studio (built-in)

# Generate new Fiori Elements app (CLI)
npx @sap/create-fiori                    # Interactive wizard
yo @sap/fiori:app                        # Yeoman generator

# Project structure
my-fiori-app/
├── webapp/
│   ├── manifest.json                    # App descriptor
│   ├── Component.js
│   ├── i18n/i18n.properties
│   └── localService/metadata.xml        # Mock OData metadata
├── ui5.yaml                             # UI5 Tooling config
└── package.json
```

## Application Floorplans

| Floorplan | Key Annotations |
|---|---|
| **List Report** | `UI.LineItem`, `UI.SelectionFields`, `UI.PresentationVariant` |
| **Object Page** | `UI.HeaderInfo`, `UI.Facets`, `UI.FieldGroup` |
| **Analytical List Page** | `UI.Chart`, `UI.KPI`, `UI.DataPoint` |
| **Worklist** | `UI.LineItem` (no filter bar) |
| **Overview Page** | `UI.Card`, multiple entity sets |

## ui5.yaml — Deployment Configuration
```yaml
specVersion: "3.0"
metadata:
  name: com.company.myapp
type: application
server:
  customMiddleware:
    - name: fiori-tools-proxy
      afterMiddleware: compression
      configuration:
        backend:
          - path: /sap/opu/odata
            url: https://your-s4h-system.com
            destination: S4H_DEV
            authType: destination

    - name: fiori-tools-appreload
      afterMiddleware: fiori-tools-proxy

    - name: backend-proxy
      afterMiddleware: compression
      configuration:
        backend:
          - path: /odata/v4
            url: http://localhost:4004
            authType: none

builder:
  resources:
    excludes:
      - /test/**
      - /localService/**
  customTasks:
    - name: deploy-to-abap
      afterTask: generateBundle
      configuration:
        target:
          url: https://your-abap-system.com
          client: "100"
          auth: basic
        app:
          name: ZMYAPP
          package: ZMYPACKAGE
          transport: TR12345
```

## Annotations — Page Editor Quick Reference
```cds
// List Report table columns
@UI.lineItem: [
  { position: 10, value: 'SalesOrder',     label: 'Order' },
  { position: 20, value: 'SoldToParty',    label: 'Customer' },
  { position: 30, value: 'NetAmountInDoc', label: 'Net Amount' },
  { position: 40, value: 'OverallStatus',  label: 'Status',
    criticality: 'StatusCriticality' }
]

// Selection fields (filter bar)
@UI.selectionField: [
  { position: 10, value: 'SalesOrganization' },
  { position: 20, value: 'CreationDate' },
  { position: 30, value: 'OverallStatus' }
]

// Object Page header
@UI.headerInfo: {
  typeName: 'Sales Order',
  typeNamePlural: 'Sales Orders',
  title: { value: 'SalesOrder' },
  description: { value: 'SoldToPartyName' }
}

// Object Page sections
@UI.facets: [
  { $Type: 'UI.CollectionFacet', ID: 'GeneralInfo', label: 'General',
    facets: [
      { $Type: 'UI.ReferenceFacet', target: '@UI.FieldGroup#Header' },
      { $Type: 'UI.ReferenceFacet', target: '@UI.FieldGroup#Dates' }
    ]
  },
  { $Type: 'UI.ReferenceFacet', target: 'to_Item/@UI.LineItem', label: 'Items' }
]
```

## Fiori Preview
```bash
# Preview with mock data (no backend needed)
npm start
# → http://localhost:8080/?sap-ui-xx-viewCache=false

# Preview with live backend
fiori run --open "test/flpSandbox.html?sap-ui-xx-viewCache=false#MyApp-Display"

# Preview specific Fiori Element floorplan
fiori run --config ./ui5-local.yaml
```

## Deployment to Cloud Foundry
```bash
# Build deployable artifact
npm run build

# Deploy via MTA
mbt build -t ./
cf deploy dist/*.mtar

# Or via SAP Fiori Tools VS Code extension:
# Right-click on project → Deploy → Deploy to Cloud Foundry
```

## Documentation Links
- Fiori Tools Docs: https://help.sap.com/docs/SAP_FIORI_tools
- Fiori Design Guidelines: https://experience.sap.com/fiori-design-web/
- Fiori Tools Samples: https://github.com/SAP-samples/fiori-tools-samples
- UI5 Tooling: https://sap.github.io/ui5-tooling/
