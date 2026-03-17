---
name: sapui5-linter
description: |
  SAPUI5 Linter skill. Use when configuring ESLint or the official ui5lint tool for
  SAPUI5/OpenUI5 projects, enforcing UI5 coding guidelines, catching deprecated API
  usage, validating XML views and manifests, setting up linting in CI pipelines, and
  writing auto-fixable ESLint rules for UI5 JavaScript and TypeScript code.

  Keywords: sapui5 linter, ui5lint, eslint ui5, ui5 coding guidelines, deprecated ui5 api,
  xml view validation, sap ui5 code quality, eslint sap, ui5 typescript lint
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://sap.github.io/ui5-linter/
---

# SAPUI5 Linter Skill

## ui5lint — Official SAP UI5 Linter

```bash
# Install
npm install --save-dev @ui5/linter

# Run (scans webapp/ automatically)
npx ui5lint

# Run on specific path
npx ui5lint --details

# Output as JSON (for CI)
npx ui5lint --format json > ui5lint-results.json
```

### What ui5lint checks
- Deprecated UI5 API usage (sap.ui.require vs. deprecated globals)
- Missing `sap.ui.define` wrapping
- Invalid manifest.json properties
- XML view/fragment issues (unknown controls, wrong namespaces)
- `async: true` in Component.js
- Usage of global `jQuery` (should use sap.ui.require)

### ui5lint Configuration (`.ui5lintrc.json`)
```json
{
  "ignorePatterns": [
    "webapp/test/**",
    "webapp/localService/**",
    "webapp/mock/**"
  ]
}
```

---

## ESLint for UI5 JavaScript

### Installation
```bash
npm install --save-dev eslint eslint-plugin-ui5
```

### `.eslintrc.json`
```json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "plugins": ["ui5"],
  "extends": [
    "eslint:recommended",
    "plugin:ui5/recommended"
  ],
  "globals": {
    "sap": "readonly"
  },
  "rules": {
    "ui5/no-deprecated-api": "error",
    "ui5/no-global-api": "warn",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "eqeqeq": "error",
    "no-console": "warn"
  },
  "ignorePatterns": [
    "dist/",
    "node_modules/",
    "webapp/test/",
    "webapp/localService/"
  ]
}
```

---

## ESLint for UI5 TypeScript

```bash
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-ui5
```

```json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint", "ui5"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:ui5/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "ui5/no-deprecated-api": "error"
  }
}
```

---

## Common UI5 Lint Errors and Fixes

### Deprecated Global API
```javascript
// ✗ Deprecated — avoid globals
jQuery.sap.log.error("message");
sap.ui.getCore().byId("myButton");

// ✓ Modern API
var Log = sap.ui.require("sap/base/Log");
Log.error("message");

// ✓ In controller context
this.byId("myButton");
```

### Missing async Component
```javascript
// ✗ Synchronous (flagged by ui5lint)
return UIComponent.extend("com.company.Component", {
  init: function() { UIComponent.prototype.init.apply(this, arguments); }
});

// ✓ Async (required for UI5 2.x)
return UIComponent.extend("com.company.Component", {
  metadata: { manifest: "json" },
  init: async function() {
    UIComponent.prototype.init.apply(this, arguments);
    await this.getRouter().initialize();
  }
});
```

### Deprecated `sap.ui.require` Placement
```javascript
// ✗ Wrong: loading in global scope
sap.ui.require(["sap/m/Button"], function(Button) { });

// ✓ Correct: use sap.ui.define for modules
sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast"
], function(Controller, MessageToast) {
  "use strict";
  return Controller.extend("com.company.controller.Main", {
    onPress: function() { MessageToast.show("Hello"); }
  });
});
```

---

## CI Pipeline Integration

```yaml
# .github/workflows/lint.yml
name: UI5 Lint & Test

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Run ESLint
        run: npx eslint webapp --ext .js,.ts --format @microsoft/eslint-formatter-sarif \
             --output-file eslint-results.sarif || true

      - name: Run ui5lint
        run: npx ui5lint

      - name: Upload ESLint SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: eslint-results.sarif
        if: always()
```

---

## XML View Validation

```bash
# ui5lint validates XML views automatically
# For manual XML validation install:
npm install --save-dev @xml-tools/parser

# BAS / VSCode: install "XML" extension (Red Hat)
# Provides real-time XML schema validation for UI5 views
```

```xml
<!-- Correct namespace declarations (validated by ui5lint) -->
<mvc:View
  xmlns:mvc="sap.ui.core.mvc"
  xmlns="sap.m"
  xmlns:l="sap.ui.layout"
  xmlns:f="sap.f"
  controllerName="com.company.controller.Main">
  <Page title="My Page">
    <content>
      <List id="myList" items="{/Items}">
        <StandardListItem title="{Name}" description="{Description}"/>
      </List>
    </content>
  </Page>
</mvc:View>
```

---

## package.json Integration

```json
{
  "scripts": {
    "lint":      "eslint webapp --ext .js,.ts && npx ui5lint",
    "lint:fix":  "eslint webapp --ext .js,.ts --fix",
    "lint:ci":   "eslint webapp --ext .js,.ts --format json -o eslint.json; npx ui5lint"
  }
}
```

## Documentation Links
- ui5lint: https://sap.github.io/ui5-linter/
- ESLint Plugin UI5: https://github.com/SAP/eslint-plugin-ui5
- UI5 Coding Guidelines: https://github.com/SAP/openui5/blob/master/docs/guidelines.md
