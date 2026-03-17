---
name: sap-datasphere
description: |
  SAP Datasphere development skill for cloud data warehousing on SAP BTP. Use when
  building data warehouses, creating analytic models, configuring data flows and
  replication flows, setting up connections to SAP and third-party systems, managing
  spaces and users, implementing data access controls, using the Datasphere CLI,
  creating data products, or monitoring data integration tasks.

  Keywords: sap datasphere, data warehouse cloud, dwc, data builder, business builder,
  analytic model, graphical view, sql view, transformation flow, replication flow,
  data flow, task chain, remote table, local table, datasphere connection,
  datasphere space, data marketplace, catalog, governance, datasphere cli
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://help.sap.com/docs/SAP_DATASPHERE
---

# SAP Datasphere Skill

## Core Components

| Component | Purpose |
|---|---|
| **Data Builder** | Create views, tables, flows, task chains |
| **Business Builder** | Semantic layer — business entities, fact models |
| **Analytic Model** | OLAP cube for SAP Analytics Cloud |
| **Connections** | 40+ connectors (S/4HANA, BW, HANA, AWS, Azure) |
| **Spaces** | Tenant isolation units with quota management |
| **Data Marketplace** | Discover and consume external data products |
| **Catalog** | Governance, lineage, glossary, quality rules |

## Data Builder — Object Types

| Object | Purpose |
|---|---|
| Local Table | Physical storage in Datasphere |
| Remote Table | Virtual access to source system data |
| Graphical View | No-code data transformation |
| SQL View | SQL-based transformation |
| Data Flow | ETL pipeline (source → transform → target) |
| Replication Flow | Real-time/batch replication to local tables |
| Transformation Flow | Merge/update local tables from views |
| Task Chain | Orchestrate multiple flows with dependencies |
| Analytic Model | Dimensional model for SAC consumption |

## SQL View Example
```sql
-- Datasphere SQL view with measures and attributes
SELECT
    so.SalesOrder,
    so.SoldToParty,
    c.CustomerName,
    so.CreationDate,
    so.SalesOrganization,
    so.TotalNetAmount,
    so.TransactionCurrency,
    -- Calculated field
    DAYS_BETWEEN(so.CreationDate, so.BillingDate) AS DaysToInvoice
FROM SalesOrders AS so
LEFT JOIN Customers AS c ON so.SoldToParty = c.CustomerId
WHERE so.CreationDate >= ADD_MONTHS(NOW(), -12)
```

## Analytic Model Structure
```
Analytic Model: Sales Performance
├── Fact: Sales Orders View
│   ├── Measures
│   │   ├── TotalNetAmount (SUM)
│   │   ├── OrderCount (COUNT DISTINCT SalesOrder)
│   │   └── AvgOrderValue (TotalNetAmount / OrderCount)
│   └── Dimensions (associations to)
│       ├── Customer Dimension
│       ├── Product Dimension
│       ├── Date Dimension (time hierarchy)
│       └── Sales Org Dimension (hierarchy)
└── Variables
    └── FiscalYear (mandatory input filter)
```

## Data Access Controls (Row-Level Security)
```sql
-- DAC: restrict by CompanyCode
-- Type: Data Access Control - SQL
SELECT UserName, CompanyCode
FROM DAC_CompanyCodeAssignment
WHERE UserName = SESSION_USER

-- Apply DAC to a view
-- In the view properties → Data Access Control → add DAC
-- Field mapping: CompanyCode → CompanyCode
```

## Datasphere CLI
```bash
# Install
npm install -g @sap/datasphere-cli

# Login
datasphere config set --url https://your-tenant.us10.hcs.cloud.sap
datasphere login --passcode <your-passcode>

# List spaces
datasphere spaces list

# Export space content
datasphere spaces export --space MY_SPACE --output ./export

# Import content
datasphere spaces import --space TARGET_SPACE --input ./export

# Deploy a CSN model
datasphere objects deploy --space MY_SPACE --input model.csn

# Monitor tasks
datasphere monitor task-chains --space MY_SPACE
```

## Connection Types (Sample)

| Category | Examples |
|---|---|
| SAP Systems | S/4HANA Cloud, BW/4HANA, HANA Cloud, Analytics Cloud |
| Cloud Platforms | AWS S3, Azure ADLS, Google BigQuery |
| Databases | Snowflake, Databricks, PostgreSQL, Redshift |
| Files | OData, Generic HTTP (REST APIs) |
| Streaming | Kafka, SAP Event Mesh |

## Task Chain Pattern
```
Task Chain: Daily Sales ETL
├── Step 1: Replicate raw sales data (Replication Flow)
├── Step 2: Transform to analytic model (Transformation Flow)
├── Step 3: Update Date Dimension (Data Flow)
└── Step 4: Persist Analytic Model (Transformation Flow)

Schedule: Daily at 02:00 UTC
Error handling: Stop on first error, send alert
```

## Data Marketplace — Publishing a Data Product
```
1. Create Local Table with curated data
2. Assign Semantic Type: "Data Product"
3. Add description, tags, terms of use
4. Publish to Marketplace
5. Set access: Private / Specific Tenants / Public
```

## Documentation Links
- SAP Datasphere Help: https://help.sap.com/docs/SAP_DATASPHERE
- GitHub Docs: https://github.com/SAP-docs/sap-datasphere
- Community: https://community.sap.com/topics/datasphere
- Datasphere CLI: https://www.npmjs.com/package/@sap/datasphere-cli
