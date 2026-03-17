---
name: sap-sqlscript
description: |
  SAP HANA SQLScript development skill. Use when writing stored procedures, user-defined
  functions (scalar and table), anonymous blocks, table variables, cursor processing,
  AMDP (ABAP Managed Database Procedures), exception handling, window functions,
  and performance optimization in HANA SQLScript.

  Keywords: sqlscript, hana procedure, udf, scalar function, table function,
  amdp, cursor, table variable, exception handling, declarative sql, imperative sql,
  hana performance, sqlscript optimization
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
---

# SAP HANA SQLScript Development Skill

## Related Skills
- **sap-hana-cli**: HANA CLI for connecting and running SQLScript
- **sap-abap**: AMDP integration from ABAP
- **sap-cap-capire**: Exposing HANA procedures via CAP

## Core Architecture

SQLScript implements a **code-to-data** paradigm. Key distinctions:
- **Declarative logic** → parallel data flow graph (prefer this)
- **Imperative logic** (IF, WHILE, FOR) → sequential execution
- Variables use `:variableName` when referenced, not on assignment

## Anonymous Block (Testing)
```sql
DO BEGIN
  DECLARE lv_total DECIMAL(15,2);
  DECLARE lt_result TABLE (region NVARCHAR(10), total DECIMAL(15,2));

  lt_result = SELECT region, SUM(net_amount) AS total
              FROM sales_fact
              WHERE fiscal_year = 2024
              GROUP BY region;

  SELECT SUM(total) INTO lv_total FROM :lt_result;

  SELECT * FROM :lt_result ORDER BY total DESC;
  SELECT :lv_total AS grand_total FROM dummy;
END;
```

## Stored Procedure Template
```sql
CREATE OR REPLACE PROCEDURE calculate_order_totals (
    IN  iv_order_id   NVARCHAR(36),
    OUT ov_net_total  DECIMAL(15,2),
    OUT ov_tax_amount DECIMAL(15,2),
    OUT ov_item_count INTEGER
)
LANGUAGE SQLSCRIPT
SQL SECURITY INVOKER
AS
BEGIN
    DECLARE lv_tax_rate DECIMAL(5,4);

    -- Use table variable for intermediate results
    DECLARE lt_items TABLE (
        item_id     NVARCHAR(36),
        quantity    DECIMAL(10,3),
        unit_price  DECIMAL(12,2),
        tax_rate    DECIMAL(5,4)
    );

    lt_items = SELECT item_id, quantity, unit_price, tax_rate
               FROM order_items
               WHERE order_id = :iv_order_id;

    SELECT COUNT(*), SUM(quantity * unit_price),
           SUM(quantity * unit_price * tax_rate)
    INTO ov_item_count, ov_net_total, ov_tax_amount
    FROM :lt_items;
END;

-- Call
CALL calculate_order_totals(
    iv_order_id   => 'ORD-001',
    ov_net_total  => ?,
    ov_tax_amount => ?,
    ov_item_count => ?
);
```

## Table Function (Reusable Result Set)
```sql
CREATE OR REPLACE FUNCTION get_top_customers (
    iv_year    INTEGER,
    iv_top_n   INTEGER DEFAULT 10
)
RETURNS TABLE (
    customer_id   NVARCHAR(20),
    customer_name NVARCHAR(100),
    total_revenue DECIMAL(15,2),
    order_count   INTEGER,
    rank          INTEGER
)
LANGUAGE SQLSCRIPT
SQL SECURITY DEFINER
AS
BEGIN
    RETURN SELECT
        c.customer_id,
        c.customer_name,
        SUM(o.net_amount) AS total_revenue,
        COUNT(o.order_id) AS order_count,
        RANK() OVER (ORDER BY SUM(o.net_amount) DESC) AS rank
    FROM orders o
    JOIN customers c ON o.customer_id = c.customer_id
    WHERE YEAR(o.order_date) = :iv_year
    GROUP BY c.customer_id, c.customer_name
    ORDER BY total_revenue DESC
    LIMIT :iv_top_n;
END;

-- Usage
SELECT * FROM get_top_customers(iv_year => 2024, iv_top_n => 5);
```

## Exception Handling
```sql
CREATE OR REPLACE PROCEDURE safe_inventory_update (
    IN iv_material_id NVARCHAR(20),
    IN iv_quantity    DECIMAL(10,3)
)
LANGUAGE SQLSCRIPT AS
BEGIN
    DECLARE EXIT HANDLER FOR SQL_ERROR_CODE 10001
    BEGIN
        -- User-defined exception (codes 10000-19999)
        RESIGNAL;
    END;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        DECLARE lv_msg NVARCHAR(500);
        lv_msg = ::SQL_ERROR_MESSAGE;
        -- Log and re-raise
        INSERT INTO error_log VALUES (NOW(), :iv_material_id, :lv_msg);
        RESIGNAL;
    END;

    -- Business rule check
    DECLARE lv_current DECIMAL(10,3);
    SELECT stock_qty INTO lv_current FROM inventory WHERE material_id = :iv_material_id;

    IF :lv_current + :iv_quantity < 0 THEN
        SIGNAL SQL_ERROR_CODE 10001
            SET MESSAGE_TEXT = 'Insufficient stock for material ' || :iv_material_id;
    END IF;

    UPDATE inventory
    SET stock_qty = stock_qty + :iv_quantity,
        last_updated = NOW()
    WHERE material_id = :iv_material_id;
END;
```

## AMDP (ABAP Managed Database Procedure)
```abap
CLASS zcl_inventory_amdp DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_amdp_marker_hdb.

    CLASS-METHODS get_low_stock
      IMPORTING VALUE(iv_threshold) TYPE i
      EXPORTING VALUE(et_materials) TYPE ztt_material_stock
      RAISING   cx_amdp_error.
ENDCLASS.

CLASS zcl_inventory_amdp IMPLEMENTATION.
  METHOD get_low_stock BY DATABASE PROCEDURE
    FOR HDB LANGUAGE SQLSCRIPT
    USING zinventory_view.

    et_materials = SELECT material_id, material_name, stock_qty, plant
                   FROM zinventory_view
                   WHERE stock_qty < :iv_threshold
                   ORDER BY stock_qty ASC;
  ENDMETHOD.
ENDCLASS.
```

## Performance Best Practices

| Practice | Rule |
|---|---|
| Prefer declarative over imperative | Convert iterating logic to set-based SQL |
| Filter early | Apply WHERE clauses before JOINs |
| Avoid engine mixing | Don't mix Row Store and Column Store in one query |
| Use table variables | Intermediate results in `TABLE (...)` not cursors |
| Avoid dynamic SQL | `EXECUTE IMMEDIATE` prevents plan caching |
| Limit cursor use | Prefer set-based; use cursors only for row-by-row logic |

## Documentation Links
- SQLScript Reference: https://help.sap.com/docs/hana-cloud-database/sap-hana-cloud-sap-hana-database-sqlscript-reference
- AMDP Guide: https://help.sap.com/docs/abap-cloud/abap-rap/amdp
