---
name: sap-sac-planning
description: |
  SAP Analytics Cloud (SAC) Planning skill. Use when building planning applications,
  creating data actions, defining planning models, working with allocation functions,
  writing planning scripts, configuring value driver trees, setting up multi-currency
  planning, and integrating SAC plans with SAP BTP and S/4HANA.

  Keywords: sap analytics cloud, sac planning, data action, planning model,
  analytic model, allocation, multi-action, version management, sac script,
  value driver tree, connected planning, sac api
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://help.sap.com/docs/SAP_ANALYTICS_CLOUD
---

# SAP Analytics Cloud (SAC) Planning Skill

## Planning Model Architecture

```
Planning Model
├── Dimensions
│   ├── Time (built-in)
│   ├── Account (P&L structure)
│   ├── Entity (Company, Cost Center)
│   ├── Custom (Product, Region, Channel)
│   └── Version (Actual, Budget, Forecast)
├── Measures
│   ├── Financial (Revenue, Cost)
│   └── Non-financial (Headcount, Units)
└── Data Actions
    ├── Copy actual to budget
    ├── Allocations
    └── Derivations
```

## Data Action Script — Copy Actuals to Budget

```javascript
// SAC Data Action Script
// Copies actual data from Q4 to next year budget

// Define source and target version
var sourceVersion = "Actual";
var targetVersion = "Budget_2025";
var sourceYear = "2024";
var targetYear = "2025";

// RESULTLOOKUP to copy data
RESULTLOOKUP([d/Version] = sourceVersion, [d/Time] = sourceYear);

// Write to target
[d/Version] = targetVersion;
[d/Time] = targetYear;

// Apply growth factor (e.g., 5%)
FOREACH [d/Account]:
  IF ([d/Account.Type] = "INC") THEN
    RES = RES * 1.05;
  ELSE
    RES = RES * 1.03;
  ENDIF
ENDFOREACH;
```

## Data Action Script — Cost Allocation

```javascript
// Allocate IT costs to cost centers by headcount driver
var allocationBase = "Headcount";
var costAccount = "IT_COSTS";
var targetDimension = "CostCenter";

// Get total headcount for normalization
RESULTLOOKUP([d/Account] = allocationBase);
var totalHeadcount = RES;

// Allocate proportionally
IF (totalHeadcount > 0) THEN
  FOREACH [d/CostCenter]:
    var ccHeadcount = RESULTLOOKUP([d/Account] = allocationBase, [d/CostCenter] = CURRENTMEMBER);
    RESULTLOOKUP([d/Account] = costAccount, [d/CostCenter] = "CENTRAL");
    RES = RES * (ccHeadcount / totalHeadcount);
    [d/CostCenter] = CURRENTMEMBER;
  ENDFOREACH;
ENDIF;
```

## Multi-Action Configuration

```
Multi-Action: Annual Planning Process
├── Step 1: Copy Actuals (Data Action: copy_actuals)
├── Step 2: Apply Statistical Forecast (Predictive Planning)
├── Step 3: Distribute Top-Down Budget (Data Action: top_down_distribution)
├── Step 4: Calculate Allocations (Data Action: cost_allocation)
└── Step 5: Currency Translation (Data Action: fx_translation)
```

## SAC API — Export Planning Data

```javascript
// Export SAC planning model data via OData API
const axios = require('axios');

async function exportSACData(sacConfig, modelId) {
  const token = await getSACToken(sacConfig);

  const response = await axios.get(
    `${sacConfig.baseUrl}/api/v1/dataimport/models/${modelId}/data`,
    {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        $filter: "Version eq 'Budget_2025' and Time eq '202501'",
        $select: 'Account,Entity,Version,Time,Amount,Currency'
      }
    }
  );

  return response.data.value;
}

// Import plan data from external system
async function importPlanData(sacConfig, modelId, planData) {
  const token = await getSACToken(sacConfig);

  // Map data to SAC format
  const mappedData = planData.map(row => ({
    Account:  row.glAccount,
    Entity:   row.companyCode,
    Version:  'Budget_2025',
    Time:     `2025${row.period.toString().padStart(2, '0')}`,
    Amount:   row.plannedAmount,
    Currency: row.currency
  }));

  return axios.post(
    `${sacConfig.baseUrl}/api/v1/dataimport/models/${modelId}/data`,
    { data: mappedData },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );
}
```

## Version Management

| Version Type | Purpose | Editability |
|---|---|---|
| Actual | Historical data from source systems | Read-only |
| Budget | Annual plan approved by management | Locked after approval |
| Forecast | Rolling forecast updated monthly | Editable |
| Working Draft | In-progress planning | Fully editable |

## Planning Best Practices

1. **Lock actuals** — prevent accidental modification of historical data
2. **Use versions** — never overwrite base data; create forecast versions
3. **Audit trail** — enable change history on sensitive accounts
4. **Performance** — limit data actions to relevant members; use filters
5. **Validation rules** — implement data quality checks in data actions
6. **Workflow** — use Planning Process for review/approval cycles

## Documentation Links
- SAC Planning: https://help.sap.com/docs/SAP_ANALYTICS_CLOUD/00f68c2e08b941f081002fd3691d86a7
- SAC Data Actions: https://help.sap.com/docs/SAP_ANALYTICS_CLOUD/00f68c2e08b941f081002fd3691d86a7/f5082e5dbc884a6e948dbdbd3b15e7c6.html
- SAC API: https://help.sap.com/docs/SAP_ANALYTICS_CLOUD/14cac91febef464dbb1efce20e3f1613
