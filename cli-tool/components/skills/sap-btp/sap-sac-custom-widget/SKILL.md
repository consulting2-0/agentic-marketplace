---
name: sac-custom-widget
description: |
  SAP Analytics Cloud Custom Widget development skill. Use when building custom
  widgets for SAC analytic applications using the SAC Widget SDK — creating widget
  descriptors, implementing styling and rendering, handling data binding, script API
  integration, and packaging widgets for SAC import.

  Keywords: sac custom widget, widget sdk, analytic application widget, sac widget,
  custom widget descriptor, widget script api, sac visualization, d3.js sac widget
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://help.sap.com/docs/SAP_ANALYTICS_CLOUD/14cac91febef464dbb1efce20e3f1613
---

# SAC Custom Widget Development

## Widget Package Structure
```
my-sac-widget/
├── widget.json          # Widget descriptor (metadata)
├── Main.js              # Widget rendering logic
├── Styling.js           # CSS-in-JS styles
├── Builder.js           # Design-time (property panel) config
└── icon.png             # 32x32 widget icon
```

## Widget Descriptor (widget.json)
```json
{
  "id": "com.company.widgets.KPIGauge",
  "version": "1.0.0",
  "name": "KPI Gauge",
  "description": "Animated circular KPI gauge with threshold colouring",
  "icon": "icon.png",
  "vendor": "Company Name",
  "eula": "",
  "license": "",
  "main": "Main.js",
  "styling": "Styling.js",
  "builder": "Builder.js",
  "webcomponents": [
    {
      "kind": "main",
      "tag": "com-company-kpi-gauge",
      "url": "Main.js",
      "integrity": "",
      "ignoreIntegrity": true
    }
  ]
}
```

## Main Widget (Web Component)
```javascript
// Main.js — Custom Element based widget
var getDefaultProps = function() {
  return {
    value: 0,
    target: 100,
    label: "KPI",
    unit: "%",
    thresholdLow: 60,
    thresholdHigh: 80
  };
};

var template = document.createElement("template");
template.innerHTML = `
<style>
  :host { display: block; width: 100%; height: 100%; }
  .gauge-container { display: flex; align-items: center; justify-content: center; height: 100%; }
  .gauge-value { font-size: 2rem; font-weight: bold; text-align: center; }
  .gauge-label { font-size: 0.9rem; color: var(--sapTextColor); text-align: center; }
</style>
<div class="gauge-container">
  <div>
    <div class="gauge-value" id="value">0%</div>
    <div class="gauge-label" id="label">KPI</div>
  </div>
</div>
`;

class KPIGauge extends HTMLElement {
  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: "open" });
    this._shadowRoot.appendChild(template.content.cloneNode(true));
    this._props = getDefaultProps();
  }

  connectedCallback() {
    this._render();
  }

  // Called by SAC runtime when properties change
  onCustomWidgetBeforeUpdate(changedProperties) {
    this._props = { ...this._props, ...changedProperties };
  }

  onCustomWidgetAfterUpdate(changedProperties) {
    this._render();
  }

  _render() {
    const { value, target, label, unit, thresholdLow, thresholdHigh } = this._props;
    const pct = target > 0 ? (value / target * 100).toFixed(1) : 0;

    const valueEl = this._shadowRoot.querySelector("#value");
    const labelEl = this._shadowRoot.querySelector("#label");

    valueEl.textContent = `${pct}${unit}`;
    labelEl.textContent = label;

    // Threshold-based colouring
    if (pct < thresholdLow) {
      valueEl.style.color = "#BB0000";  // SAP red
    } else if (pct < thresholdHigh) {
      valueEl.style.color = "#E9730C";  // SAP orange
    } else {
      valueEl.style.color = "#256F3A";  // SAP green
    }
  }
}

customElements.define("com-company-kpi-gauge", KPIGauge);
```

## Builder (Design-Time Properties)
```javascript
// Builder.js — property panel for widget configuration
var getDefaultProps = function() {
  return {
    label: "KPI",
    unit: "%",
    thresholdLow: 60,
    thresholdHigh: 80
  };
};

class KPIGaugeBuilder extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div>
        <label>Label: <input type="text" id="label" value="${this._props?.label || 'KPI'}"/></label>
        <label>Unit: <input type="text" id="unit" value="${this._props?.unit || '%'}"/></label>
        <label>Low Threshold (%): <input type="number" id="thresholdLow" value="${this._props?.thresholdLow || 60}"/></label>
        <label>High Threshold (%): <input type="number" id="thresholdHigh" value="${this._props?.thresholdHigh || 80}"/></label>
      </div>
    `;
    this.querySelectorAll("input").forEach(el => {
      el.addEventListener("change", () => this._onPropertyChange());
    });
  }

  _onPropertyChange() {
    this.dispatchEvent(new CustomEvent("propertiesChanged", {
      detail: {
        properties: {
          label:         this.querySelector("#label").value,
          unit:          this.querySelector("#unit").value,
          thresholdLow:  Number(this.querySelector("#thresholdLow").value),
          thresholdHigh: Number(this.querySelector("#thresholdHigh").value)
        }
      }
    }));
  }
}

customElements.define("com-company-kpi-gauge-builder", KPIGaugeBuilder);
```

## SAC Script API — Use Custom Widget
```javascript
// In SAC analytic application script
// Bind data model value to custom widget property

var revenueValue = Planning_Model.getCellValue({
  "Account": "NET_REVENUE",
  "Version": "Forecast_2025",
  "Time":    "202501"
});

var budgetValue = Planning_Model.getCellValue({
  "Account": "NET_REVENUE",
  "Version": "Budget_2025",
  "Time":    "202501"
});

// Set widget properties via script
KPI_Gauge_Widget.setValue(revenueValue);
KPI_Gauge_Widget.setTarget(budgetValue);
KPI_Gauge_Widget.setLabel("Revenue vs Budget");
```

## Packaging and Import
```bash
# Package widget as ZIP
zip -r my-kpi-gauge-v1.0.0.zip widget.json Main.js Styling.js Builder.js icon.png

# Import in SAC:
# → Analytics Designer → Custom Widgets → Import Widget → Upload ZIP
```

## Documentation Links
- Custom Widget SDK: https://help.sap.com/docs/SAP_ANALYTICS_CLOUD/14cac91febef464dbb1efce20e3f1613/a4a02f6d9ccc4e649e636e5daa3f7f02.html
- Widget Samples: https://github.com/SAP-samples/analytics-cloud-custom-widget
