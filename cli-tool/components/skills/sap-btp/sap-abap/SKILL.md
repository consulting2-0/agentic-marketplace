---
name: sap-abap
description: |
  Comprehensive ABAP development skill for SAP systems. Use when writing ABAP code,
  working with internal tables, structures, ABAP SQL, object-oriented programming,
  RAP (RESTful Application Programming Model), CDS views, EML statements, ABAP Cloud
  development, string processing, dynamic programming, RTTI/RTTC, field symbols,
  data references, exception handling, or ABAP unit testing. Covers both classic
  ABAP and modern ABAP for Cloud Development patterns.

  Keywords: abap, abap sql, internal tables, field symbols, oop abap, rap, eml,
  abap unit, abap cloud, btp abap environment, steampunk, abap objects, cds, amdp
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
---

# SAP ABAP Development Skill

## Related Skills
- **sap-abap-cds**: CDS views, annotations, virtual elements, access control
- **sap-cap-capire**: Connecting ABAP systems with CAP applications via OData
- **sap-fiori-tools**: Building Fiori applications backed by ABAP OData services
- **sap-btp-cloud-platform**: ABAP Environment (Steampunk) on BTP

## Quick Reference

### Data Types and Declarations
```abap
" Elementary types
DATA num  TYPE i VALUE 42.
DATA txt  TYPE string VALUE `Hello BTP`.
DATA flag TYPE abap_bool VALUE abap_true.

" Inline declarations
DATA(result) = some_method( ).
FINAL(constant) = `immutable value`.

" Structures
DATA: BEGIN OF struc,
        id   TYPE i,
        name TYPE string,
      END OF struc.

" Internal tables
DATA itab       TYPE TABLE OF string WITH EMPTY KEY.
DATA sorted_tab TYPE SORTED TABLE OF struc WITH UNIQUE KEY id.
DATA hashed_tab TYPE HASHED TABLE OF struc WITH UNIQUE KEY id.
```

### Internal Tables — Essential Operations
```abap
" Create with VALUE
itab = VALUE #( ( col1 = 1 col2 = `alpha` )
                ( col1 = 2 col2 = `beta`  ) ).

" Safe read (no exception)
DATA(line) = VALUE #( itab[ col1 = 1 ] OPTIONAL ).

" Loop with field symbol (modify in place)
LOOP AT itab ASSIGNING FIELD-SYMBOL(<line>).
  <line>-col2 = to_upper( <line>-col2 ).
ENDLOOP.

" Functional table operations
DATA(filtered)   = FILTER #( itab WHERE status = 'A' ).
DATA(total)      = REDUCE i( INIT s = 0 FOR wa IN itab NEXT s = s + wa-amount ).
DATA(transformed) = VALUE itab_type( FOR wa IN itab ( id = wa-id name = to_upper( wa-name ) ) ).

" Delete rows
DELETE itab WHERE col1 > 10.
```

### ABAP SQL
```abap
" SELECT into table
SELECT carrid, connid, fldate
  FROM zdemo_abap_fli
  WHERE carrid = @iv_carrier
  INTO TABLE @DATA(flights).

" Aggregate
SELECT carrid, COUNT(*) AS cnt, AVG( price ) AS avg_price
  FROM zdemo_abap_fli
  GROUP BY carrid
  INTO TABLE @DATA(stats).

" JOIN
SELECT a~carrid, a~connid, b~carrname
  FROM zdemo_abap_fli AS a
  INNER JOIN zdemo_abap_carr AS b ON a~carrid = b~carrid
  INTO TABLE @DATA(joined).

" DML
INSERT dbtab FROM @struc.
UPDATE dbtab FROM TABLE @itab.
DELETE FROM dbtab WHERE id = @lv_id.
```

### Constructor Expressions
```abap
DATA(struc) = VALUE struct_type( comp1 = 1 comp2 = `text` ).
DATA(oref)  = NEW zcl_my_class( param = value ).
target      = CORRESPONDING #( source MAPPING tgt_field = src_field ).
DATA(text)  = COND string( WHEN flag = abap_true THEN `Yes` ELSE `No` ).
DATA(dec)   = CONV decfloat34( 1 / 3 ).
```

### Exception Handling
```abap
TRY.
    DATA(result) = risky_operation( ).
  CATCH cx_sy_zerodivide INTO DATA(exc).
    DATA(msg) = exc->get_text( ).
  CATCH cx_root INTO DATA(any_exc).
    log_error( any_exc ).
ENDTRY.

RAISE EXCEPTION TYPE zcx_my_exception
  EXPORTING textid = zcx_my_exception=>error_occurred.
```

### ABAP Cloud Rules
```abap
" Use released APIs — no direct table access without CDS
SELECT * FROM zi_my_cds_view INTO TABLE @DATA(result).

" Use XCO framework for platform operations
DATA(date) = xco_cp=>sy->date( )->as( xco_cp_time=>format->iso_8601_extended )->value.
DATA(uuid) = cl_system_uuid=>create_uuid_x16_static( ).

" ABAP Unit test with mock injection
CLASS zcl_service_test DEFINITION FOR TESTING RISK LEVEL HARMLESS DURATION SHORT.
  PRIVATE SECTION.
    DATA cut TYPE REF TO zcl_service.  " class under test
    METHODS setup.
    METHODS test_happy_path FOR TESTING.
ENDCLASS.
```

## Performance Tips

1. Use **SORTED/HASHED tables** for frequent key access
2. Prefer **field symbols** over work areas in loops for modification
3. Use **FOR ALL ENTRIES** or JOINs — avoid SELECT in loops
4. Use **PACKAGE SIZE** for large result sets
5. Minimize **CORRESPONDING** — explicit assignments are faster
6. Prefer **declarative ABAP SQL** over AMDP for portability

## Error Catalog

| Exception | Cause | Fix |
|---|---|---|
| `CX_SY_ITAB_LINE_NOT_FOUND` | Table expression on missing line | Use `OPTIONAL` or `line_exists( )` |
| `CX_SY_ZERODIVIDE` | Division by zero | Check divisor before operation |
| `CX_SY_REF_IS_INITIAL` | Dereference unbound reference | Check `IS BOUND` first |
| `CX_SY_CONVERSION_NO_NUMBER` | String→number conversion failure | Validate input format |

## Documentation Links
- ABAP Cheat Sheets: https://github.com/SAP-samples/abap-cheat-sheets
- ABAP Keyword Docs: https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm
- ABAP Cloud Guide: https://help.sap.com/docs/abap-cloud
