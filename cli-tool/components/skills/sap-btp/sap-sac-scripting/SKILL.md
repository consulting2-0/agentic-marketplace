---
name: sap-sac-scripting
description: |
  SAP Analytics Cloud (SAC) application scripting skill. Use when writing SAC analytic
  application scripts to create interactive dashboards, implementing event handlers,
  dynamic filtering, navigation, data binding via scripting API, custom calculations,
  and building advanced analytic application UX with the SAC scripting API.

  Keywords: sac scripting, analytic application, sac script, sac api, scripting api,
  event handler, dynamic filter, navigation, data binding, sac custom widget scripting
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://help.sap.com/docs/SAP_ANALYTICS_CLOUD/14cac91febef464dbb1efce20e3f1613
---

# SAP Analytics Cloud — Analytic Application Scripting

## Script Event Types

| Event | Trigger |
|---|---|
| `onInitialization` | App loaded (once) |
| `onCustomWidgetInitialized` | Custom widget ready |
| `onChange` | Data model value changed |
| `onSelect` | User selects chart/table element |
| `onClick` | Button or widget clicked |
| `onCalculate` | Before calculations run |

## Initialization Script
```javascript
// Script: onInitialization
// Runs once when the application loads

// Set default filters
var filterDimension = "Version";
var defaultVersion = "Budget_2025";

// Apply filter on load
Planning_Model.setDimensionFilter(filterDimension, [defaultVersion]);

// Set current period based on today
var today = new Date();
var currentPeriod = today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0');
Time_Filter.setSelectedKeys([currentPeriod]);

// Show loading indicator
Application.showBusyIndicator("Initializing dashboard...");

// Hide restricted widgets for viewer role
if (Application.getUserInfo().userType === "Viewer") {
  Edit_Toolbar.setVisible(false);
  Publish_Button.setVisible(false);
}

Application.hideBusyIndicator();
```

## Dynamic Filter on Select
```javascript
// Script: Chart_Revenue.onSelect
// When user clicks a bar in the revenue chart, filter other charts

var selectedMembers = Chart_Revenue.getSelectedMembers("Region");

if (selectedMembers.length > 0) {
  // Apply cross-filter to other widgets
  Chart_Products.setDimensionFilter("Region", selectedMembers);
  Table_Details.setDimensionFilter("Region", selectedMembers);
  KPI_Total.setDimensionFilter("Region", selectedMembers);

  // Update title to show selection
  Text_Title.setText("Revenue Analysis — " + selectedMembers.join(", "));
} else {
  // Clear filters when deselected
  Chart_Products.clearDimensionFilter("Region");
  Table_Details.clearDimensionFilter("Region");
  KPI_Total.clearDimensionFilter("Region");
  Text_Title.setText("Revenue Analysis — All Regions");
}
```

## Navigation Between Pages
```javascript
// Script: Button_DrillDown.onClick
// Navigate to detail page with context

var selectedRegion = Dropdown_Region.getSelectedKey();
var selectedPeriod = Time_Filter.getSelectedKeys()[0];

// Pass parameters to target page
Navigation.setVariable("selectedRegion", selectedRegion);
Navigation.setVariable("selectedPeriod", selectedPeriod);

// Navigate to detail page
Navigation.navigateTo("Detail_Page");
```

## Read Data from Model
```javascript
// Script: Button_Calculate.onClick
// Read aggregated values and use in calculations

var currentRevenue = Planning_Model.getCellValue({
  "Account":  "NET_REVENUE",
  "Version":  "Forecast_2025",
  "Time":     "202501",
  "Region":   Dropdown_Region.getSelectedKey()
});

var budgetRevenue = Planning_Model.getCellValue({
  "Account":  "NET_REVENUE",
  "Version":  "Budget_2025",
  "Time":     "202501",
  "Region":   Dropdown_Region.getSelectedKey()
});

var variance = currentRevenue - budgetRevenue;
var variancePct = budgetRevenue !== 0 ? (variance / budgetRevenue) * 100 : 0;

// Display in KPI tiles
KPI_Variance.setValue(variance);
KPI_VariancePct.setValue(variancePct.toFixed(1) + "%");

// Colour-code based on threshold
if (variancePct < -5) {
  KPI_VariancePct.setStyle("alert");
} else if (variancePct > 5) {
  KPI_VariancePct.setStyle("positive");
} else {
  KPI_VariancePct.setStyle("neutral");
}
```

## Write Plan Data
```javascript
// Script: Button_SavePlan.onClick
// Write user-entered plan values back to the model

Application.showBusyIndicator("Saving plan...");

try {
  var entryTable = Input_Table.getDataSource();

  // Commit all pending changes in input table
  entryTable.commitData();

  Application.showMessage(
    Application.MessageType.SUCCESS,
    "Plan saved successfully"
  );
} catch (err) {
  Application.showMessage(
    Application.MessageType.ERROR,
    "Failed to save plan: " + err.message
  );
} finally {
  Application.hideBusyIndicator();
}
```

## Trigger Data Action from Script
```javascript
// Script: Button_RunAllocation.onClick
// Run a planning data action programmatically

var params = {
  "targetVersion": "Budget_2025",
  "allocationKey": Dropdown_AllocationKey.getSelectedKey()
};

Application.showBusyIndicator("Running allocation...");

Planning_Model.triggerDataAction("cost_allocation_action", params)
  .then(function() {
    Application.hideBusyIndicator();
    Application.showMessage(Application.MessageType.SUCCESS, "Allocation completed");
    // Refresh all widgets
    Application.refreshWidgets();
  })
  .catch(function(err) {
    Application.hideBusyIndicator();
    Application.showMessage(Application.MessageType.ERROR, err.message);
  });
```

## Documentation Links
- SAC Scripting API: https://help.sap.com/docs/SAP_ANALYTICS_CLOUD/14cac91febef464dbb1efce20e3f1613/a4a02f6d9ccc4e649e636e5daa3f7f02.html
- Analytic Applications: https://help.sap.com/docs/SAP_ANALYTICS_CLOUD/14cac91febef464dbb1efce20e3f1613
