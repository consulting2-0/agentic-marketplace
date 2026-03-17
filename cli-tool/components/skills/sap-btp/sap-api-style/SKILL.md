---
name: sap-api-style
description: |
  SAP API documentation and style guidelines skill. Use when documenting SAP APIs,
  writing OpenAPI/Swagger specifications following SAP API guidelines, naming REST
  resources following SAP conventions, designing API versioning strategies, writing
  API documentation for SAP Business Accelerator Hub (api.sap.com), or reviewing
  API designs for SAP consistency.

  Keywords: sap api guidelines, openapi, swagger, api documentation, rest api design,
  api naming, api versioning, sap api hub, api business hub, api style guide, odata
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://api.sap.com/
---

# SAP API Style Guide Skill

## SAP API Design Principles

1. **Resource-oriented** — model resources, not operations
2. **Consistent naming** — follow SAP naming conventions
3. **Versioned** — `/v1/`, `/v2/` in URL path
4. **Discoverable** — full OpenAPI spec on api.sap.com
5. **Secure** — OAuth2 with XSUAA / API Management

## REST Resource Naming (SAP Conventions)

```
✓ Plural nouns for collections:  /purchase-orders
✓ Kebab-case for resources:      /sales-orders/{id}/line-items
✓ CamelCase for OData:           /SalesOrderSet('123')/to_Items
✓ Version in path:               /v1/business-partners
✓ Sub-resources via hierarchy:   /orders/{orderId}/items/{itemId}

✗ Verbs in URLs:                 /getOrder, /createInvoice
✗ Abbreviations:                 /po, /bp (use full words)
✗ Uppercase in paths:            /PurchaseOrders (except OData)
```

## HTTP Methods

| Method | Usage | Idempotent | Safe |
|---|---|---|---|
| `GET` | Read resource(s) | ✓ | ✓ |
| `POST` | Create new resource or action | ✗ | ✗ |
| `PUT` | Replace entire resource | ✓ | ✗ |
| `PATCH` | Partial update | ✗ | ✗ |
| `DELETE` | Remove resource | ✓ | ✗ |

## OpenAPI 3.0 Template (SAP Style)

```yaml
openapi: 3.0.3
info:
  title: Purchase Order API
  description: |
    Manage purchase orders in SAP S/4HANA.

    ## Overview
    Use this API to create, read, update, and delete purchase orders
    programmatically. Requires `PurchaseOrder.Read` or `PurchaseOrder.Write` scope.

  version: 1.0.0
  contact:
    name: BTP Integration Team
    email: integration@company.com
  x-sap-api-type: REST
  x-sap-shortText: Create and manage purchase orders
  x-sap-software-min-version: "2308"

servers:
  - url: https://api.company.com/v1
    description: Production
  - url: https://api-dev.company.com/v1
    description: Development

security:
  - OAuth2: [PurchaseOrder.Read]

paths:
  /purchase-orders:
    get:
      operationId: listPurchaseOrders
      summary: List Purchase Orders
      description: Returns a paginated list of purchase orders.
      tags: [Purchase Orders]
      parameters:
        - name: $top
          in: query
          description: Maximum number of items to return (max 100)
          schema: { type: integer, maximum: 100, default: 20 }
        - name: $skip
          in: query
          schema: { type: integer, default: 0 }
        - name: status
          in: query
          description: Filter by order status
          schema: { type: string, enum: [OPEN, IN_PROCESS, CLOSED] }
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  value:
                    type: array
                    items: { $ref: '#/components/schemas/PurchaseOrder' }
                  '@odata.count': { type: integer }
                  '@odata.nextLink': { type: string }
        '401': { $ref: '#/components/responses/Unauthorized' }
        '403': { $ref: '#/components/responses/Forbidden' }

    post:
      operationId: createPurchaseOrder
      summary: Create Purchase Order
      security:
        - OAuth2: [PurchaseOrder.Write]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/PurchaseOrderCreate' }
      responses:
        '201':
          description: Created
          headers:
            Location: { schema: { type: string }, description: URL of created resource }
          content:
            application/json:
              schema: { $ref: '#/components/schemas/PurchaseOrder' }
        '400': { $ref: '#/components/responses/BadRequest' }

components:
  schemas:
    PurchaseOrder:
      type: object
      properties:
        id:           { type: string, format: uuid, readOnly: true }
        orderNumber:  { type: string, example: "PO-2024-001234" }
        vendor:
          type: object
          properties:
            id:   { type: string }
            name: { type: string }
        status:       { type: string, enum: [OPEN, IN_PROCESS, CLOSED] }
        totalAmount:  { type: number, format: double }
        currency:     { type: string, minLength: 3, maxLength: 3, example: "USD" }
        createdAt:    { type: string, format: date-time, readOnly: true }
        createdBy:    { type: string, readOnly: true }

  responses:
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema: { $ref: '#/components/schemas/Error' }
    BadRequest:
      description: Invalid request
      content:
        application/json:
          schema: { $ref: '#/components/schemas/Error' }
    Error:
      description: Error
      content:
        application/json:
          schema:
            type: object
            required: [error]
            properties:
              error:
                type: object
                properties:
                  code:    { type: string }
                  message: { type: string }

  securitySchemes:
    OAuth2:
      type: oauth2
      flows:
        clientCredentials:
          tokenUrl: https://your-xsuaa.authentication.eu20.hana.ondemand.com/oauth/token
          scopes:
            PurchaseOrder.Read:  Read purchase orders
            PurchaseOrder.Write: Create and modify purchase orders
```

## SAP Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The purchase order could not be created.",
    "target": "vendor.id",
    "details": [
      {
        "code": "VENDOR_NOT_FOUND",
        "message": "Vendor 'V-999' does not exist in the system.",
        "target": "vendor.id"
      }
    ]
  }
}
```

## API Versioning Strategy
```
URL versioning (recommended for major breaking changes):
  /v1/purchase-orders   ← current
  /v2/purchase-orders   ← new major version

Header versioning (non-breaking evolution):
  Accept: application/json; version=2024-11-01

Deprecation:
  Deprecation: Sat, 01 Jun 2025 00:00:00 GMT
  Sunset: Sat, 01 Dec 2025 00:00:00 GMT
  Link: <https://api.company.com/v2/purchase-orders>; rel="successor-version"
```

## Documentation Links
- SAP API Guidelines: https://api.sap.com/
- SAP REST API Guidelines: https://github.com/SAP/styleguides
- OpenAPI 3.0: https://swagger.io/specification/
