---
name: sap-cap-capire
description: |
  SAP Cloud Application Programming Model (CAP) development skill using Capire documentation.
  Use when building CAP services with Node.js or Java, defining CDS data models, writing
  event handlers, exposing OData V4 services, integrating with S/4HANA remote services,
  configuring HANA Cloud or SQLite persistence, adding XSUAA authentication, deploying
  with MTA, or using CAP plugins (audit-logging, attachments, change-tracking).

  Keywords: cap, cds, capire, odata v4, node.js handlers, cap java, hdi deploy,
  mta deploy, cap authentication, xsuaa, multitenancy, cap extensibility, cdl, cql
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  cap_version: "@sap/cds 8.x+"
---

# SAP CAP (Cloud Application Programming Model)

## Related Skills
- **sap-fiori-tools**: Building Fiori Elements UIs on top of CAP OData services
- **sap-abap-cds**: Importing ABAP CDS as remote service in CAP
- **sap-btp-cloud-platform**: CF deployment of CAP apps
- **sap-hana-cli**: HANA Cloud schema inspection and debugging

## Quick Start
```bash
npm install -g @sap/cds-dk        # Install CAP CLI
cds init my-app                    # New project
cds watch                          # Dev server (hot reload, SQLite)
cds add hana                       # Add HANA Cloud persistence
cds add xsuaa                      # Add authentication
cds add approuter                  # Add app router
cds deploy --to hana               # Deploy schema to HANA
cds build --production             # Production build for MTA
```

## Project Structure
```
my-app/
├── db/
│   ├── schema.cds        # Data model
│   └── data/             # CSV seed data (local dev)
├── srv/
│   ├── service.cds       # Service definition
│   └── service.js        # Custom handlers
├── app/
│   └── fiori-app/        # UI5/Fiori frontend
├── .cdsrc.json           # CDS configuration
└── package.json
```

## CDS Data Model
```cds
namespace com.company.bookshop;
using { managed, cuid, Currency } from '@sap/cds/common';

entity Books : cuid, managed {
  title     : String(200) @mandatory;
  author    : Association to Authors;
  genre     : String(100);
  stock     : Integer default 0;
  price     : Decimal(10,2);
  currency  : Currency;
  descr     : String(1000);
  image     : LargeBinary @Core.MediaType: 'image/png';
  orders    : Association to many OrderItems on orders.book = $self;
}

entity Authors : cuid, managed {
  name      : String(100) @mandatory;
  dateOfBirth : Date;
  books     : Association to many Books on books.author = $self;
}

entity Orders : cuid, managed {
  orderNo   : String(20) @readonly;
  customer  : String(100);
  status    : String(20) default 'New'
              @assert.range enum { New; Processing; Shipped; Cancelled; };
  items     : Composition of many OrderItems on items.order = $self;
}

entity OrderItems : cuid {
  order     : Association to Orders;
  book      : Association to Books @mandatory;
  quantity  : Integer @mandatory @assert.range: [1, 1000];
  netAmount : Decimal(10,2) @Core.Computed;
}
```

## Service Definition
```cds
using com.company.bookshop as db from '../db/schema';

service CatalogService @(requires: 'authenticated-user') {

  @readonly entity Books    as projection on db.Books;
  @readonly entity Authors  as projection on db.Authors;

  entity Orders as projection on db.Orders
    actions {
      action submitOrder() returns Orders;
      action cancelOrder(reason: String) returns Orders;
    };

  entity OrderItems as projection on db.OrderItems;

  // Analytical projection
  @readonly entity TopBooks as select from db.Books {
    genre, count(*) as count : Integer, avg(price) as avgPrice : Decimal
  } group by genre;
}
```

## Custom Event Handlers (Node.js)
```javascript
// srv/catalog-service.js
const cds = require('@sap/cds');

module.exports = class CatalogService extends cds.ApplicationService {

  async init() {
    const { Books, Orders, OrderItems } = this.entities;

    // Before hook — validate stock
    this.before('submitOrder', async req => {
      const order = await SELECT.one.from(Orders, req.params[0].ID)
        .columns('ID', 'status', { ref: ['items'], expand: ['*'] });
      if (!order) return req.error(404, 'Order not found');
      if (order.status !== 'New') return req.error(400, `Cannot submit order in status ${order.status}`);
    });

    // On hook — business logic
    this.on('submitOrder', async req => {
      const { ID } = req.params[0];
      // Check and reduce stock
      const items = await SELECT.from(OrderItems).where({ order_ID: ID });
      for (const item of items) {
        const book = await SELECT.one.from(Books, item.book_ID).columns('stock');
        if (book.stock < item.quantity)
          return req.error(409, `Insufficient stock for book ${item.book_ID}`);
        await UPDATE(Books, item.book_ID).with({ stock: book.stock - item.quantity });
      }
      await UPDATE(Orders, ID).with({ status: 'Processing' });
      return SELECT.one.from(Orders, ID);
    });

    // After hook — computed fields
    this.after('READ', OrderItems, items => {
      items.forEach(item => {
        if (item.quantity && item.book_price)
          item.netAmount = item.quantity * item.book_price;
      });
    });

    await super.init();
  }
}
```

## Consuming Remote S/4HANA Service
```javascript
// package.json — define remote service
{
  "cds": {
    "requires": {
      "API_BUSINESS_PARTNER": {
        "kind": "odata-v2",
        "model": "srv/external/API_BUSINESS_PARTNER",
        "[production]": {
          "credentials": {
            "destination": "S4H_BUPA",
            "path": "/sap/opu/odata/sap/API_BUSINESS_PARTNER"
          }
        }
      }
    }
  }
}

// Handler — consume
const S4 = await cds.connect.to('API_BUSINESS_PARTNER');
const { A_BusinessPartner } = S4.entities;
const partners = await S4.run(
  SELECT.from(A_BusinessPartner)
    .where({ BusinessPartnerCategory: '2' })
    .columns('BusinessPartner', 'BusinessPartnerFullName')
    .limit(50)
);
```

## Key CDS Features

| Feature | Syntax |
|---|---|
| Managed aspects | `entity Foo : cuid, managed { }` |
| Localized fields | `name : localized String(100)` |
| Enum validation | `@assert.range enum { A; B; C; }` |
| Computed field | `@Core.Computed` |
| Media type | `@Core.MediaType: 'image/png'` |
| Required | `@mandatory` |

## Documentation Links
- CAP Docs (Capire): https://cap.cloud.sap/docs/
- CAP Samples: https://github.com/SAP-samples/cloud-cap-samples
- CAP Plugins: https://cap.cloud.sap/docs/plugins/
