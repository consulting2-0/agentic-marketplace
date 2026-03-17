---
name: sap-hana-cloud-data-intelligence
description: |
  SAP HANA Cloud Data Intelligence (formerly SAP Data Intelligence) skill. Use when
  designing data pipelines with the Modeler, writing Python/R operators, configuring
  connections to HANA, S/4HANA, cloud storage, building ML pipelines, scheduling
  graphs, monitoring pipeline runs, and integrating with SAP Datasphere.

  Keywords: sap data intelligence, hana cloud di, data pipeline, graph modeler,
  python operator, ml pipeline, data intelligence cloud, vflow, di pipeline, sap di
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://help.sap.com/docs/SAP_DATA_INTELLIGENCE
---

# SAP HANA Cloud Data Intelligence Skill

## Architecture Overview

```
SAP Data Intelligence Cloud
├── Modeler (Pipeline Designer)
│   ├── Graphs (pipelines)
│   ├── Operators (building blocks)
│   └── Docker files (custom runtime images)
├── Metadata Explorer (data cataloguing)
├── ML Scenario Manager (model lifecycle)
├── System Management (connections, tenants)
└── Connection Management
    ├── SAP HANA Cloud
    ├── SAP S/4HANA (OData)
    ├── AWS S3 / Azure ADLS / GCS
    └── Kafka / REST
```

## Graph (Pipeline) Concepts

```
Graph = directed acyclic graph of operators
Each operator has:
  - Inports  (typed data inputs)
  - Outports (typed data outputs)
  - Config   (parameters)

Port types:
  - message      (generic JSON envelope)
  - table        (structured tabular data)
  - stream       (byte stream for files)
  - scalar       (single value)
```

## Python Operator — Data Transformation

```python
# Python3Operator: transform HANA table rows
import pandas as pd

def on_input(data):
    # data.body is a pandas DataFrame (table port)
    df = data.body

    # Transform
    df['revenue_eur'] = df['revenue'] * df['exchange_rate']
    df['margin_pct']  = (df['gross_profit'] / df['revenue'] * 100).round(2)
    df = df[df['revenue_eur'] > 0]  # filter nulls

    # Output to next operator
    api.send("output", api.Message(df))

api.set_port_callback("input", on_input)
```

## Read from SAP HANA Cloud

```python
# Python3Operator: read from HANA via hdbcli
import hdbcli.dbapi as hdbcli
import pandas as pd

def run():
    # Connection via DI Connection Management
    conn = hdbcli.connect(
        address  = api.config.hana_host,
        port     = 443,
        user     = api.config.hana_user,
        password = api.config.hana_password,
        encrypt  = True
    )

    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            SALESORDERID,
            CUSTOMER_ID,
            NETAMOUNT,
            CURRENCY,
            CREATEDAT
        FROM SALESORDERS
        WHERE CREATEDAT >= ADD_MONTHS(NOW(), -3)
    """)

    df = pd.DataFrame(cursor.fetchall(),
                      columns=[d[0] for d in cursor.description])
    cursor.close()
    conn.close()

    api.send("output", api.Message(df))

api.add_generator(run)
```

## Write to SAP HANA Cloud

```python
# Python3Operator: write DataFrame to HANA
from hana_ml import dataframe as hana_df
import pandas as pd

def on_input(data):
    df = data.body  # pandas DataFrame

    conn = hana_df.ConnectionContext(
        address  = api.config.hana_host,
        port     = 443,
        user     = api.config.hana_user,
        password = api.config.hana_password,
        encrypt  = True
    )

    hdf = hana_df.create_dataframe_from_pandas(
        conn,
        df,
        table_name  = "SALES_TRANSFORMED",
        schema      = "DI_OUTPUT",
        force       = True,          # replace if exists
        drop_exist_tab = False
    )

    api.send("output", api.Message(f"Wrote {len(df)} rows to HANA"))

api.set_port_callback("input", on_input)
```

## Read from S3 / Cloud Storage

```python
# Python3Operator: read CSV from S3 via DI connection
import pandas as pd
import io

def on_input(data):
    # data.body is bytes when coming from ReadFile operator
    content = data.body
    df = pd.read_csv(io.BytesIO(content))

    api.logger.info(f"Read {len(df)} rows from S3")
    api.send("output", api.Message(df))

api.set_port_callback("input", on_input)
```

## Typical Graph Patterns

### ETL: S3 → Transform → HANA
```
ReadFile (S3)
    ↓ [stream]
CSVToTable
    ↓ [table]
Python Operator (transform)
    ↓ [table]
WriteHANA
```

### OData Extraction: S/4HANA → HANA
```
ODataProducer (S/4 source)
    ↓ [message]
JSonToTable
    ↓ [table]
Python Operator (enrich/filter)
    ↓ [table]
HANATableProducer (target)
```

### ML Scoring Pipeline
```
ReadHANA (features)
    ↓ [table]
Python Operator (preprocess)
    ↓ [message]
MLServingInference (SAP AI Core endpoint)
    ↓ [message]
Python Operator (postprocess + write scores)
    ↓ [table]
WriteHANA (scores table)
```

## Scheduling Graphs

```python
# Use DI Pipeline API to trigger runs programmatically
import requests

def trigger_pipeline(di_url, token, graph_name, config_substitutions=None):
    url = f"{di_url}/app/pipeline-modeler/service/v1/graphs/{graph_name}/executions"
    payload = {
        "name": f"{graph_name}-run",
        "configSubstitutions": config_substitutions or {}
    }
    resp = requests.post(url, json=payload,
                         headers={"Authorization": f"Bearer {token}"})
    resp.raise_for_status()
    return resp.json()["executionId"]

def get_execution_status(di_url, token, execution_id):
    url = f"{di_url}/app/pipeline-modeler/service/v1/executions/{execution_id}"
    resp = requests.get(url, headers={"Authorization": f"Bearer {token}"})
    return resp.json()["status"]   # running | completed | dead
```

## Custom Docker Operator

```dockerfile
# Dockerfile for custom Python environment
FROM python:3.11-slim

RUN pip install --no-cache-dir \
    pandas==2.1.4 \
    hdbcli==2.19.21 \
    hana-ml==2.19.24010301 \
    scikit-learn==1.4.0 \
    requests==2.31.0

# DI requires this entry point
CMD ["/bin/sh"]
```

```json
// dockerfiles/<name>/tags.json
{
  "dockerFile": "Dockerfile",
  "buildContext": ".",
  "additionalTags": ["latest"]
}
```

## ML Scenario Manager Integration

```python
# Register training run as ML scenario
from ai_api_client_sdk.ai_api_v2_client import AIAPIV2Client

# Track model metrics from DI graph
def log_metrics(run_id, metrics):
    # POST to ML Scenario Manager via REST
    url = f"{api.config.scenario_url}/runs/{run_id}/metrics"
    requests.post(url,
                  json={"metrics": metrics},
                  headers={"Authorization": f"Bearer {api.config.token}"})
```

## Documentation Links
- SAP Data Intelligence: https://help.sap.com/docs/SAP_DATA_INTELLIGENCE
- Python SDK: https://pypi.org/project/hana-ml/
- Graph Operators Reference: https://help.sap.com/docs/SAP_DATA_INTELLIGENCE/1c1341f6911f4da5a35b191b40b426c8
