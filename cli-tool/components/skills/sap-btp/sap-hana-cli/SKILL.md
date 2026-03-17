---
name: sap-hana-cli
description: |
  SAP HANA Cloud CLI development skill. Use when connecting to HANA Cloud instances,
  running SQL queries, inspecting schemas, managing HDI containers, using the hana-cli
  tool for database operations, exporting/importing data, checking performance,
  and automating HANA Cloud tasks from the command line.

  Keywords: hana cli, hana cloud, hdi, sql console, schema inspection, hana connect,
  hana-cli, database export, catalog browser, hana performance, explain plan
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
---

# SAP HANA Cloud CLI Skill

## Related Skills
- **sap-sqlscript**: Writing SQLScript procedures and functions
- **sap-cap-capire**: CAP with HANA Cloud deployment (`cds deploy --to hana`)

## Installation & Setup
```bash
npm install -g hana-cli    # Install globally

# Or use from HANA Dev Container
docker pull saplabs/hanaexpress:latest

# Configure connection (from service key)
hana-cli connect \
  --host your-instance.hanacloud.ondemand.com \
  --port 443 \
  --user DBADMIN \
  --password *** \
  --useTLS true \
  --encrypt true
```

## Connection Profiles
```json
// ~/.config/hana-cli/default.json
{
  "host":     "abc123.hanacloud.ondemand.com",
  "port":     443,
  "user":     "DBADMIN",
  "password": "***",
  "encrypt":  true,
  "useTLS":   true,
  "sslValidateCertificate": true
}
```

## Essential Commands
```bash
# Connection
hana-cli status                       # Show connection status
hana-cli version                      # HANA version info

# Schema inspection
hana-cli tables --schema MY_SCHEMA    # List tables
hana-cli columns --table SALES_FACT   # Show columns
hana-cli views --schema MY_SCHEMA     # List views
hana-cli procedures                   # List procedures

# SQL execution
hana-cli query "SELECT * FROM sales_fact LIMIT 10"
hana-cli querySimple "SELECT count(*) FROM sales_fact"

# HDI container management
hana-cli containers                   # List HDI containers
hana-cli containerGroups              # List container groups

# Performance
hana-cli activeProcedures             # Active procedures
hana-cli blockedTransactions          # Blocked transactions

# Export / Import
hana-cli inspectTable --table PRODUCTS --output csv
hana-cli massConvert --input ./csv-dir --output ./sql-dir

# HANA Service Key (read from BTP environment)
hana-cli serviceKey --cf-space dev --cf-service my-hana-instance
```

## Schema Browsing
```bash
# Full schema dump
hana-cli tables --schema MY_SCHEMA --output json > tables.json

# Describe a table
hana-cli inspectTable --schema MY_SCHEMA --table ORDERS

# Sample data
hana-cli query "SELECT TOP 5 * FROM MY_SCHEMA.ORDERS ORDER BY CREATED_AT DESC"

# Row counts
hana-cli query "SELECT COUNT(*) FROM MY_SCHEMA.ORDERS"
```

## HDI Container Debug
```bash
# List containers in space
hana-cli containers

# Show container details
hana-cli containerGroup --group default

# Check HDI deployment status
hana-cli query "SELECT * FROM _SYS_DI.T_DEFAULT_CONTAINER_GROUP_PARAMETERS"

# Check deployed objects in HDI container
hana-cli query "SELECT OBJECT_NAME, OBJECT_TYPE, STATUS
                FROM _SYS_DI.M_OBJECTS
                WHERE CONTAINER_NAME = 'MY_APP_HDI'"
```

## Performance Investigation
```bash
# Active statements
hana-cli query "SELECT * FROM SYS.M_ACTIVE_STATEMENTS LIMIT 20"

# Long running statements
hana-cli query "SELECT STATEMENT_ID, DURATION_MICROSEC/1000 AS MS, STATEMENT_STRING
                FROM SYS.M_ACTIVE_STATEMENTS
                WHERE DURATION_MICROSEC > 5000000
                ORDER BY DURATION_MICROSEC DESC"

# Table sizes
hana-cli query "SELECT SCHEMA_NAME, TABLE_NAME,
                TABLE_SIZE / 1024 / 1024 AS SIZE_MB
                FROM SYS.M_TABLE_PERSISTENCE_STATISTICS
                ORDER BY TABLE_SIZE DESC LIMIT 20"
```

## Documentation Links
- HANA CLI GitHub: https://github.com/SAP-samples/hana-developer-cli-tool-example
- HANA Cloud Docs: https://help.sap.com/docs/hana-cloud
- HANA Cloud Trial: https://www.sap.com/products/technology-platform/hana/trial.html
