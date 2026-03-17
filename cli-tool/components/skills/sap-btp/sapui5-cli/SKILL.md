---
name: sapui5-cli
description: |
  SAPUI5 CLI (UI5 Tooling) skill. Use when scaffolding UI5 projects, configuring
  ui5.yaml, running local development server, building for production, running unit
  and integration tests via ui5 CLI, adding custom middleware/tasks, and deploying
  UI5 apps to ABAP or BTP HTML5 Repository using UI5 Tooling.

  Keywords: ui5 cli, ui5 tooling, ui5.yaml, ui5 serve, ui5 build, ui5 deploy,
  custom middleware, custom task, abap deployment, html5 repository, ui5 test
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://sap.github.io/ui5-tooling/
---

# SAPUI5 CLI (UI5 Tooling)

## Installation

```bash
# Install UI5 CLI globally
npm install --global @ui5/cli

# Verify
ui5 --version

# Per-project (recommended)
npm install --save-dev @ui5/cli
npx ui5 --version
```

## Project Initialization

```bash
# Scaffold new UI5 app (uses Yeoman under the hood)
npm install -g yo generator-easy-ui5
yo easy-ui5 project

# OR use Fiori Tools generator in VSCode/BAS:
# Command Palette → Fiori: Open Application Generator
```

## ui5.yaml Structure

```yaml
specVersion: "3.0"
metadata:
  name: com.company.myapp
type: application

framework:
  name: SAPUI5        # or OpenUI5
  version: "1.120.0"
  libraries:
    - name: sap.m
    - name: sap.ui.core
    - name: sap.f
    - name: sap.ui.layout
    - name: sap.uxap
    - name: themelib_sap_horizon

builder:
  resources:
    excludes:
      - "/test/**"
      - "/localService/**"
  bundles:
    - bundleDefinition:
        name: "com/company/myapp/Component-preload.js"
        defaultFileTypes:
          - ".js"
          - ".fragment.xml"
          - ".view.xml"
          - ".properties"
          - ".json"

server:
  customMiddleware:
    - name: fiori-tools-proxy
      afterMiddleware: compression
      configuration:
        ignoreCertError: false
        backend:
          - path: /sap/opu/odata
            url: https://my-s4-system.company.com
            destination: S4H_DEV
            scp: true
```

## CLI Commands

```bash
# Start local dev server (default port 8080)
ui5 serve

# Serve on specific port
ui5 serve --port 4004

# Build for production (output → ./dist/)
ui5 build

# Build with dependency preloads
ui5 build --all

# Build self-contained (includes framework libs)
ui5 build self-contained

# Run QUnit tests in browser
ui5 test

# List all UI5 framework versions available
ui5 use --list-versions

# Switch SAPUI5 version in current project
ui5 use SAPUI5@1.120.0

# Add library dependency
ui5 add sap.ui.table

# Show project dependency tree
ui5 tree
```

## Custom Middleware (Proxy for Backend Calls)

```javascript
// ui5-middleware-proxy.js — custom middleware example
module.exports = {
  middleware: function({ resources, options, middlewareUtil }) {
    return function(req, res, next) {
      if (req.path.startsWith('/api/')) {
        // Custom proxy logic
        const targetUrl = options.configuration.backendUrl + req.path;
        // forward request...
      }
      next();
    };
  }
};
```

```yaml
# Register in ui5.yaml
server:
  customMiddleware:
    - name: ui5-middleware-proxy
      afterMiddleware: compression
      configuration:
        backendUrl: https://my-backend.company.com
```

## Custom Task (Build-Time Processing)

```javascript
// ui5-task-transform.js — custom build task
module.exports = {
  task: async function({ workspace, dependencies, taskUtil, options }) {
    const allResources = await workspace.byGlob("/**/*.json");

    await Promise.all(allResources.map(async (resource) => {
      const content = await resource.getString();
      const transformed = JSON.stringify(JSON.parse(content)); // minify
      resource.setString(transformed);
      await workspace.write(resource);
    }));
  }
};
```

## Deploy to ABAP (SAPUI5 ABAP Repository)

```bash
# Install deploy tooling
npm install --save-dev @sap/ux-ui5-tooling

# Add deploy config to ui5.yaml
```

```yaml
# ui5-deploy.yaml
specVersion: "3.0"
metadata:
  name: com.company.myapp
type: application
builder:
  customTasks:
    - name: deploy-to-abap
      afterTask: generateVersionInfo
      configuration:
        target:
          url: https://my-abap.company.com
          client: "100"
          language: EN
        app:
          name: ZMYAPP
          package: ZMYPACKAGE
          transport: DEVK900123
        credentials:
          username: env:ABAP_USERNAME
          password: env:ABAP_PASSWORD
```

```bash
# Deploy
ui5 build --config ui5-deploy.yaml --include-task=deploy-to-abap
```

## Deploy to BTP HTML5 Repository

```bash
# Install MTA build tool
npm install --global mbt

# Build MTA
mbt build

# Deploy to CF
cf deploy mta_archives/myapp_1.0.0.mtar
```

```yaml
# mta.yaml (HTML5 module)
modules:
  - name: myapp-html5
    type: html5
    path: .
    build-parameters:
      build-result: dist
      builder: custom
      commands:
        - npm install
        - npm run build:cf
      supported-platforms: []
```

## package.json Scripts

```json
{
  "scripts": {
    "start":     "ui5 serve",
    "build":     "ui5 build --clean-dest",
    "build:cf":  "ui5 build --clean-dest --config ui5-cf.yaml",
    "test":      "ui5 test",
    "lint":      "eslint webapp --ext .js",
    "deploy":    "ui5 build --config ui5-deploy.yaml --include-task=deploy-to-abap"
  }
}
```

## Documentation Links
- UI5 Tooling: https://sap.github.io/ui5-tooling/
- Custom Middleware: https://sap.github.io/ui5-tooling/pages/extensibility/CustomServerMiddleware/
- Deploy to ABAP: https://github.com/SAP/ui5-task-zipper
