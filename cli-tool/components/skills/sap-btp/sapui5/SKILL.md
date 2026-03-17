---
name: sapui5
description: |
  Comprehensive skill for building enterprise applications with SAPUI5/OpenUI5 framework.
  Use when building Fiori Elements or freestyle UI5 apps, creating custom controls,
  implementing OData V2/V4 model binding, setting up routing and navigation, writing
  XML views, working with sap.ui.mdc (metadata-driven controls), implementing unit
  tests with QUnit and OPA5, or handling i18n and accessibility.

  Keywords: sapui5, openui5, ui5, xml view, controller, odata v2, odata v4, json model,
  routing, navigation, custom control, qunit, opa5, mockserver, fiori elements, mdc, i18n
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  framework_version: "1.120+"
---

# SAPUI5 Development Skill

## Related Skills
- **sap-fiori-tools**: Fiori Tools extension for faster development and deployment
- **sap-cap-capire**: CAP backend providing OData services for UI5 apps
- **sap-abap-cds**: ABAP CDS views as OData V2/V4 backend

## Project Structure
```
webapp/
├── controller/
│   ├── BaseController.js
│   ├── Main.controller.js
│   └── Detail.controller.js
├── view/
│   ├── App.view.xml
│   ├── Main.view.xml
│   └── Detail.view.xml
├── model/
│   └── models.js
├── fragment/
│   └── CreateDialog.fragment.xml
├── i18n/
│   ├── i18n.properties
│   └── i18n_de.properties
├── localService/
│   └── metadata.xml
├── Component.js
├── manifest.json
└── index.html
```

## manifest.json Template
```json
{
  "_version": "1.65.0",
  "sap.app": {
    "id": "com.company.myapp",
    "type": "application",
    "title": "{{appTitle}}",
    "applicationVersion": { "version": "1.0.0" },
    "dataSources": {
      "mainService": {
        "uri": "/odata/v4/catalog/",
        "type": "OData",
        "settings": { "odataVersion": "4.0" }
      }
    }
  },
  "sap.ui5": {
    "rootView": { "viewName": "com.company.myapp.view.App", "type": "XML", "id": "app" },
    "models": {
      "": {
        "dataSource": "mainService",
        "preload": true,
        "settings": { "synchronizationMode": "None", "operationMode": "Server" }
      },
      "i18n": {
        "type": "sap.ui.model.resource.ResourceModel",
        "settings": { "bundleName": "com.company.myapp.i18n.i18n" }
      }
    },
    "routing": {
      "config": {
        "routerClass": "sap.m.routing.Router",
        "viewType": "XML",
        "viewPath": "com.company.myapp.view",
        "controlId": "app",
        "controlAggregation": "pages"
      },
      "routes": [
        { "name": "main",   "pattern": "",                "target": "main" },
        { "name": "detail", "pattern": "item/{itemId}",   "target": "detail" }
      ],
      "targets": {
        "main":   { "viewName": "Main",   "viewLevel": 1 },
        "detail": { "viewName": "Detail", "viewLevel": 2 }
      }
    }
  }
}
```

## XML View Template
```xml
<mvc:View
  controllerName="com.company.myapp.controller.Main"
  xmlns:mvc="sap.ui.core.mvc"
  xmlns="sap.m"
  xmlns:f="sap.f"
  xmlns:core="sap.ui.core"
  displayBlock="true">

  <f:DynamicPage headerExpanded="true">
    <f:title>
      <f:DynamicPageTitle>
        <f:heading><Title text="{i18n>pageTitle}"/></f:heading>
        <f:actions>
          <Button text="{i18n>btnCreate}" type="Emphasized" press=".onCreatePress"/>
        </f:actions>
      </f:DynamicPageTitle>
    </f:title>
    <f:content>
      <List id="itemList" items="{/Books}" growing="true" growingThreshold="20"
            selectionChange=".onItemSelect">
        <items>
          <ObjectListItem title="{title}" number="{price}" numberUnit="{currency}">
            <attributes>
              <ObjectAttribute text="{author/name}" label="Author"/>
            </attributes>
          </ObjectListItem>
        </items>
      </List>
    </f:content>
  </f:DynamicPage>
</mvc:View>
```

## Controller Template
```javascript
sap.ui.define([
  "./BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/ui/core/Fragment"
], function(BaseController, JSONModel, MessageToast, Fragment) {
  "use strict";

  return BaseController.extend("com.company.myapp.controller.Main", {

    onInit() {
      this._oViewModel = new JSONModel({ busy: false });
      this.setModel(this._oViewModel, "view");
    },

    onItemSelect(oEvent) {
      const oCtx = oEvent.getParameter("listItem").getBindingContext();
      const sId = oCtx.getProperty("ID");
      this.getRouter().navTo("detail", { itemId: sId });
    },

    async onCreatePress() {
      if (!this._oDialog) {
        this._oDialog = await Fragment.load({
          id: this.getView().getId(),
          name: "com.company.myapp.fragment.CreateDialog",
          controller: this
        });
        this.getView().addDependent(this._oDialog);
      }
      this._oDialog.open();
    },

    async onConfirmCreate() {
      const oList = this.getView().getModel().bindList("/Books");
      const oCtx = oList.create({
        title: this.byId("inputTitle").getValue(),
        stock: parseInt(this.byId("inputStock").getValue())
      });
      try {
        await oCtx.created();
        MessageToast.show(this.getResourceBundle().getText("msgCreated"));
        this._oDialog.close();
      } catch (err) {
        this._showError(err.message);
      }
    }
  });
});
```

## OData V4 Binding Patterns
```javascript
// List binding with filters
const oBinding = oTable.getBinding("items");
oBinding.filter([
  new Filter("status", FilterOperator.EQ, "Active"),
  new Filter("price", FilterOperator.LT, 100)
]);

// Context binding (object page)
oView.bindElement({ path: `/Books(${sId})`, parameters: { $expand: "author" } });

// Create new entry
const oCtx = oList.create({ title: "New Book", stock: 0 });
await oCtx.created();   // Wait for server response

// Batch request (V4 auto-batches)
await oModel.submitBatch("myBatchGroup");
```

## QUnit Unit Test
```javascript
QUnit.module("MainController", {
  beforeEach() {
    this.oController = new MainController();
    this.oController._oViewModel = new JSONModel({ busy: false });
  }
});

QUnit.test("onInit sets view model", function(assert) {
  this.oController.onInit();
  assert.ok(this.oController._oViewModel, "View model created");
  assert.strictEqual(this.oController._oViewModel.getProperty("/busy"), false);
});
```

## Documentation Links
- UI5 Docs: https://ui5.sap.com/
- UI5 SDK: https://ui5.sap.com/#/api
- Fiori Guidelines: https://experience.sap.com/fiori-design-web/
- UI5 Tooling: https://sap.github.io/ui5-tooling/
