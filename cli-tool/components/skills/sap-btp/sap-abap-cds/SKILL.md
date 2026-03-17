---
name: sap-abap-cds
description: |
  SAP ABAP CDS (Core Data Services) view development skill. Use when developing
  CDS view entities for ABAP-backed Fiori apps, defining data models with annotations,
  building analytical views, implementing access control with DCL, creating value
  help views, working with virtual elements, CDS table functions, path expressions,
  associations, compositions, and ABAP CDS hierarchy views.

  Keywords: abap cds, cds view entity, ddl, annotations, dcl, virtual element,
  cds table function, association, composition, rap cds, fiori annotations, odata
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
---

# SAP ABAP CDS View Development

## Related Skills
- **sap-abap**: ABAP programming, RAP business objects, behavior definitions
- **sap-fiori-tools**: Consuming CDS OData services in Fiori apps
- **sap-btp-integration-suite**: Accessing CDS OData APIs via integration flows

## CDS View Layers

```
Basic Interface View (ZI_*)      ← 1:1 with database tables
    ↓
Composite Interface View (ZI_*)  ← joins, associations, calculations
    ↓
Consumption View (ZC_*)          ← Fiori annotations, value helps
    ↓
Analytical View (ZA_*)           ← measures, dimensions for Analytics
```

## Basic Interface View
```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Flight - Basic'
define view entity ZI_Flight
  as select from sflight
{
  key sflight.carrid  as CarrierId,
  key sflight.connid  as ConnectionId,
  key sflight.fldate  as FlightDate,
      sflight.price   as Price,
      sflight.currency as Currency,
      sflight.planetype as PlaneType,
      sflight.seatsmax  as SeatsMax,
      sflight.seatsocc  as SeatsOccupied
}
```

## Composite View with Association
```abap
@AccessControl.authorizationCheck: #CHECK
define view entity ZI_FlightComposite
  as select from ZI_Flight as Flight
  association [0..1] to ZI_Carrier as _Carrier
    on $projection.CarrierId = _Carrier.CarrierId
{
  key Flight.CarrierId,
  key Flight.ConnectionId,
  key Flight.FlightDate,
      Flight.Price,
      Flight.Currency,
      _Carrier.CarrierName,

      -- Currency conversion
      @Semantics.amount.currencyCode: 'TargetCurrency'
      currency_conversion(
        amount          => Flight.Price,
        source_currency => Flight.Currency,
        target_currency => 'EUR',
        exchange_rate_date => Flight.FlightDate,
        exchange_rate_type => 'M'
      ) as PriceEUR,

      'EUR' as TargetCurrency : abap.cuky,

      -- Calculated field
      Flight.SeatsMax - Flight.SeatsOccupied as SeatsAvailable : abap.int4,

      _Carrier
}
```

## Consumption View with Fiori Annotations
```abap
@EndUserText.label: 'Flight'
@AccessControl.authorizationCheck: #CHECK
@Metadata.allowExtensions: true

@UI.headerInfo: {
  typeName: 'Flight',
  typeNamePlural: 'Flights',
  title: { value: 'ConnectionId' },
  description: { value: 'CarrierName' }
}

define view entity ZC_Flight
  as projection on ZI_FlightComposite
{
  @UI.lineItem: [{ position: 10 }]
  @UI.selectionField: [{ position: 10 }]
  key CarrierId,

  @UI.lineItem: [{ position: 20 }]
  key ConnectionId,

  @UI.lineItem: [{ position: 30 }]
  key FlightDate,

  @UI.lineItem: [{ position: 40 }]
  CarrierName,

  @UI.lineItem: [{ position: 50, label: 'Price (EUR)' }]
  @Semantics.amount.currencyCode: 'TargetCurrency'
  PriceEUR,

  TargetCurrency,

  @UI.lineItem: [{ position: 60, criticality: 'SeatCriticality' }]
  SeatsAvailable,

  -- Criticality for seats (red if < 10, green otherwise)
  case when SeatsAvailable < 10 then 1 else 3 end
    as SeatCriticality : abap.int1,

  _Carrier : redirected to ZC_Carrier
}
```

## Access Control (DCL)
```abap
@EndUserText.label: 'Access Control - Flight'
define role ZC_Flight {
  grant select on ZC_Flight
  where (CarrierId) = aspect pfcg_auth(s_carrid, carrid, actvt = '03');
}
```

## Value Help View
```abap
@EndUserText.label: 'Value Help - Carrier'
@Search.searchable: true
define view entity ZI_CarrierVH
  as select from scarr
{
  @Search.defaultSearchElement: true
  @Search.fuzzinessThreshold: 0.8
  key scarr.carrid   as CarrierId,
      @Search.defaultSearchElement: true
      scarr.carrname as CarrierName,
      scarr.currcode as Currency,
      scarr.url      as WebURL
}
```

## CDS Annotations Reference

| Annotation | Purpose |
|---|---|
| `@UI.lineItem` | Column in list report table |
| `@UI.selectionField` | Filter bar field |
| `@UI.headerInfo` | Object page header |
| `@UI.facets` | Object page sections |
| `@Semantics.amount.currencyCode` | Link amount to currency field |
| `@Semantics.quantity.unitOfMeasure` | Link qty to unit field |
| `@Search.searchable` | Enable full-text search |
| `@AccessControl.authorizationCheck` | DCL enforcement level |
| `@Metadata.allowExtensions` | Allow MDE annotations |

## Documentation Links
- CDS Annotations: https://help.sap.com/docs/abap-cloud/abap-cds-artifacts
- Fiori Annotations: https://ui5.sap.com/#/topic/683f0e9c7a0f4c7fba8e0ac7d43afb9b
