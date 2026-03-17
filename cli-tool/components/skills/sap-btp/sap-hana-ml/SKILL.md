---
name: sap-hana-ml
description: |
  SAP HANA Machine Learning (hana-ml) Python library skill. Use when building ML
  pipelines on HANA Cloud data, using Predictive Analysis Library (PAL), Automated
  Predictive Library (APL), HANA Vector Engine for embeddings and RAG, or performing
  in-database ML without data movement.

  Keywords: hana-ml, hana machine learning, pal, apl, predictive analysis library,
  hana vector engine, embeddings, in-database ml, classification, regression, clustering,
  time series, hana ml python
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
---

# SAP HANA Machine Learning (hana-ml)

## Installation
```bash
pip install hana-ml          # Core library
pip install 'hana-ml[full]'  # All optional dependencies
```

## Connection
```python
import hana_ml.dataframe as dataframe

conn = dataframe.ConnectionContext(
    address  = 'your-instance.hanacloud.ondemand.com',
    port     = 443,
    user     = 'ML_USER',
    password = '***',
    encrypt  = True
)
print(conn.hana_version())
```

## HANA DataFrame (in-database operations)
```python
# Load data as HANA DataFrame (no data movement)
df = conn.table('SALES_FACT', schema='ANALYTICS')

# Filtering and selection
df_2024 = df.filter("FISCAL_YEAR = 2024").select('REGION', 'PRODUCT', 'NET_AMOUNT')

# Aggregation
df_summary = df_2024.agg([('sum', 'NET_AMOUNT', 'TOTAL'), ('count', 'ORDER_ID', 'CNT')],
                          group_by=['REGION'])
df_summary.head(10).collect()   # .collect() pulls to pandas
```

## Classification with PAL
```python
from hana_ml.algorithms.pal.unified_classification import UnifiedClassification

# Prepare features
df_train = conn.table('CHURN_TRAINING', schema='ML_DATA')

# Train model
model = UnifiedClassification(func='RandomForest', n_estimators=100, max_depth=10)
model.fit(data=df_train, key='CUSTOMER_ID', label='CHURNED',
          features=['TENURE', 'MONTHLY_CHARGES', 'USAGE_SCORE', 'SUPPORT_CALLS'])

# Predict on new data
df_predict = conn.table('CHURN_PREDICTION_INPUT', schema='ML_DATA')
result = model.predict(data=df_predict, key='CUSTOMER_ID')
result.collect().head()
```

## Time Series Forecasting
```python
from hana_ml.algorithms.pal.tsa.auto_arima import AutoARIMA

df_ts = conn.table('DAILY_SALES', schema='ML_DATA').sort('SALES_DATE')

arima = AutoARIMA(output_fitted=True, forecast_length=30)
arima.fit(data=df_ts, endog='REVENUE')

forecast = arima.predict(forecast_length=30)
forecast.collect()  # 30-day revenue forecast
```

## HANA Vector Engine (Embeddings + RAG)
```python
from hana_ml import dataframe
import json

# Create vector table
conn.connection.cursor().execute("""
    CREATE COLUMN TABLE PRODUCT_EMBEDDINGS (
        PRODUCT_ID    NVARCHAR(20) PRIMARY KEY,
        PRODUCT_NAME  NVARCHAR(200),
        DESCRIPTION   NVARCHAR(2000),
        EMBEDDING     REAL_VECTOR(1536)  -- text-embedding-3-small dimensions
    )
""")

# Insert embeddings (after generating with OpenAI/AI Core)
def upsert_embedding(product_id, name, description, embedding_vector):
    conn.connection.cursor().execute(
        "UPSERT PRODUCT_EMBEDDINGS VALUES (?, ?, ?, TO_REAL_VECTOR(?))",
        [product_id, name, description, str(embedding_vector)]
    )

# Similarity search (RAG retrieval)
def find_similar_products(query_embedding, top_k=5):
    cursor = conn.connection.cursor()
    cursor.execute("""
        SELECT PRODUCT_ID, PRODUCT_NAME, DESCRIPTION,
               COSINE_SIMILARITY(EMBEDDING, TO_REAL_VECTOR(?)) AS SCORE
        FROM PRODUCT_EMBEDDINGS
        ORDER BY SCORE DESC
        LIMIT ?
    """, [str(query_embedding), top_k])
    return cursor.fetchall()
```

## Model Storage and Export
```python
# Save model to HANA (persists between sessions)
model.save('my_churn_model', if_exists='replace', schema='ML_MODELS')

# Load saved model
from hana_ml.algorithms.pal.unified_classification import UnifiedClassification
loaded_model = UnifiedClassification.load(conn, 'my_churn_model', schema='ML_MODELS')
```

## Documentation Links
- hana-ml Docs: https://help.sap.com/doc/cd94b08fe2e041c2ba778374572ddba9/latest/en-US/index.html
- PAL Guide: https://help.sap.com/docs/hana-cloud-database/sap-hana-cloud-predictive-analysis-library
- Vector Engine: https://help.sap.com/docs/hana-cloud-database/sap-hana-cloud-sap-hana-database-vector-engine-guide
- GitHub Samples: https://github.com/SAP-samples/hana-ml-samples
