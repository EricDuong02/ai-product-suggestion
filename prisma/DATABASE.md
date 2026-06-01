# Database Schema Reference

Datasource: **PostgreSQL**, managed by Prisma ORM.
Extension: **pgvector** (`vector`) — enabled and ready for embedding/vector-search columns.

```
# .env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"
```

> To enable pgvector on a fresh database run `CREATE EXTENSION IF NOT EXISTS vector;`  
> or let Prisma handle it via `prisma migrate dev` (the extension is declared in `schema.prisma`).

All tables follow a **multi-tenant pattern** — every row is scoped to a `shop` field (Shopify shop domain).  
All monetary values are stored as **`String`** to preserve exact decimal representation.  
All Shopify payloads are preserved in a `raw Json?` field (`jsonb` in PostgreSQL) so schema changes on Shopify's side do not cause data loss.

---

## Table of Contents

1. [Session](#session)
2. [Product](#product)
3. [ProductVariant](#productvariant)
4. [Order](#order)
5. [OrderLineItem](#orderlineitem)
6. [DiscountRule](#discountrule)
7. [DiscountCode](#discountcode)
8. [DiscountRuleTarget](#discountruletarget)
9. [OrderDiscountApplication](#orderdiscountapplication)
10. [OrderLineItemDiscountAllocation](#orderlineitemdiscountallocation)
11. [MetafieldDefinition](#metafielddefinition)
12. [ProductMetafield](#productmetafield)
13. [VariantMetafield](#variantmetafield)
14. [OrderMetafield](#ordermetafield)
15. [WebhookPendingFetch](#webhookpendingfetch)
16. [ShopifySyncState](#shopifysyncstate)

---

## Session

Managed by `@shopify/shopify-app-remix`. Stores OAuth session tokens for each installed shop.

| Field | Type | Notes |
|---|---|---|
| `id` | String PK | Shopify session ID |
| `shop` | String | Shop domain |
| `accessToken` | String | OAuth access token |
| `refreshToken` | String? | Used for offline token refresh |
| `scope` | String? | Granted permission scopes |
| `expires` | DateTime? | Token expiry |
| `isOnline` | Boolean | Whether this is an online session |

---

## Product

Crawled product records from Shopify Admin API. One record per product per shop.

| Field | Type | Notes |
|---|---|---|
| `shopifyProductId` | String | Shopify GID (e.g. `gid://shopify/Product/123`) |
| `handle` | String? | URL slug |
| `status` | String? | `ACTIVE`, `DRAFT`, `ARCHIVED` |
| `tags` | Json? | Array of tag strings |
| `totalInventory` | Int? | Aggregated across all variants |
| `syncedAt` | DateTime | Last time this record was written from Shopify |

**Relations:** `variants[]`, `metafields[]`, `discountTargets[]`

**Unique:** `(shop, shopifyProductId)`

---

## ProductVariant

One record per variant per shop. Shopify product ID is resolved via the parent `Product` relation — not stored redundantly.

| Field | Type | Notes |
|---|---|---|
| `shopifyVariantId` | String | Shopify GID |
| `price` | String? | Stored as string to preserve exact decimal |
| `compareAtPrice` | String? | Original price before discount |
| `inventoryQuantity` | Int? | Current stock level |
| `inventoryItemId` | String? | Used for inventory adjustments |

**Relations:** `product`, `metafields[]`, `discountTargets[]`

**Unique:** `(shop, shopifyVariantId)`

---

## Order

Crawled order records. Contains denormalized customer info (`customerId`, `customerDisplayName`) — a `Customer` model can be added later if recommendation features require per-customer analysis.

| Field | Type | Notes |
|---|---|---|
| `shopifyOrderId` | String | Shopify GID |
| `name` | String? | Display name, e.g. `#1001` |
| `financialStatus` | String? | `PAID`, `PENDING`, `REFUNDED`, etc. |
| `fulfillmentStatus` | String? | `FULFILLED`, `UNFULFILLED`, etc. |
| `totalPrice` | String? | Grand total including tax |
| `totalDiscounts` | String? | Total discount amount applied |
| `processedAt` | DateTime? | When Shopify processed the order |

**Relations:** `lineItems[]`, `discountApplications[]`, `metafields[]`

**Unique:** `(shop, shopifyOrderId)`

---

## OrderLineItem

Individual product lines within an order.

| Field | Type | Notes |
|---|---|---|
| `shopifyLineItemId` | String? | Nullable — anonymous line items exist in Shopify |
| `variantId` | String? | Shopify variant GID (not a FK; variant may not be in DB) |
| `productId` | String? | Shopify product GID (not a FK) |
| `price` | String? | Unit price at time of order |

**Relations:** `order`, `discountAllocations[]`

> `shopifyLineItemId` is nullable and stored in an index (not a unique constraint) because SQLite allows multiple NULLs in a unique column, which would not protect against duplicates.

---

## DiscountRule

Master discount record — covers both **code-based** (`discountMethod = CODE`) and **automatic** (`discountMethod = AUTOMATIC`) discounts.

| Field | Type | Notes |
|---|---|---|
| `shopifyDiscountId` | String | Shopify GID |
| `discountClass` | String? | `PRODUCT`, `ORDER`, `SHIPPING` |
| `discountMethod` | String? | `CODE`, `AUTOMATIC` |
| `hasCode` | Boolean | `true` for code-based; `false` for automatic |
| `combinesWith` | Json? | `{ orderDiscounts, productDiscounts, shippingDiscounts }` |
| `usageLimit` | Int? | `null` = unlimited |
| `asyncUsageCount` | Int? | Shopify's eventual-consistent usage counter |

**Relations:** `discountCodes[]`, `targets[]`, `appliedInOrders[]`

**Unique:** `(shop, shopifyDiscountId)`

---

## DiscountCode

Individual redemption codes belonging to a `DiscountRule`. A rule can have multiple codes (Shopify allows bulk code generation).

| Field | Type | Notes |
|---|---|---|
| `shopifyDiscountCodeId` | String? | Shopify GID |
| `code` | String | The actual code string |
| `isActive` | Boolean? | Whether the code is currently redeemable |
| `usageCount` | Int? | Times this specific code has been used |
| `deletedAt` | DateTime? | Soft-delete — merchant may re-create a code with the same string |

**Unique:** `(shop, shopifyDiscountCodeId)`
**Index:** `(shop, code)` — for fast lookup by code string

---

## DiscountRuleTarget

Maps a `DiscountRule` to the products, variants, or collections it applies to. Supports **BxGy** discounts via `targetRole`.

| Field | Type | Notes |
|---|---|---|
| `targetLevel` | String? | `LINE_ITEM`, `ORDER`, `SHIPPING_LINE` |
| `targetType` | String | `PRODUCT`, `VARIANT`, `COLLECTION`, `ALL` |
| `targetRole` | String? | `APPLY_TARGET` (standard), `BUY_TARGET`, `GET_TARGET` (BxGy only) |
| `shopifyTargetId` | String? | Shopify GID of the targeted resource |
| `shopifyCollectionId` | String? | Shopify collection GID when `targetType = COLLECTION` |
| `collectionHandle` | String? | Collection URL handle |
| `productId` | String? | FK → `Product` (nullable, SetNull on delete) |
| `productVariantId` | String? | FK → `ProductVariant` (nullable, SetNull on delete) |

---

## OrderDiscountApplication

**Immutable snapshot** of a discount as it was applied to a specific order. Decoupled from `DiscountRule` so that subsequent changes to the rule do not alter order history.

| Field | Type | Notes |
|---|---|---|
| `shopifyDiscountApplicationIndex` | Int? | Position in Shopify's `discountApplications` array |
| `applicationType` | String? | `DISCOUNT_CODE`, `AUTOMATIC`, `MANUAL`, `SCRIPT` |
| `allocationMethod` | String? | `ACROSS`, `EACH`, `ONE` |
| `targetSelection` | String? | `ALL`, `ENTITLED`, `EXPLICIT` |
| `valueType` | String? | `PERCENTAGE`, `FIXED_AMOUNT` |
| `value` | String? | Discount rate or fixed amount — **snapshot at apply time** |
| `appliedAmount` | String? | Actual amount deducted — **snapshot at apply time** |
| `code` | String? | Code used (if applicable) — **snapshot at apply time** |
| `sourceShopifyDiscountId` | String? | Shopify GID of origin rule (string, not FK) |
| `discountRuleId` | String? | Soft FK → `DiscountRule` (SetNull on delete) |

**Unique:** `(orderId, shopifyDiscountApplicationIndex)`

---

## OrderLineItemDiscountAllocation

Records how much of a discount was allocated to a specific line item. Links `OrderLineItem` ↔ `OrderDiscountApplication`.

| Field | Type | Notes |
|---|---|---|
| `amount` | String? | Amount deducted from this line item |
| `orderLineItemId` | String | FK → `OrderLineItem` (Cascade) |
| `orderDiscountApplicationId` | String? | FK → `OrderDiscountApplication` (SetNull) |

---

## MetafieldDefinition

Shop-level registry of all metafield `namespace + key + type` combinations per owner type. Populated during initial crawl and **automatically extended** when a webhook delivers a metafield with an unknown namespace+key.

| Field | Type | Notes |
|---|---|---|
| `ownerType` | String | `PRODUCT`, `VARIANT`, `ORDER`, `CUSTOMER`, `COLLECTION` |
| `namespace` | String | Metafield namespace, e.g. `custom` |
| `key` | String | Metafield key, e.g. `material` |
| `type` | String | Shopify metafield type, e.g. `single_line_text_field` |
| `validations` | Json? | Shopify validation rules for this definition |

**Unique:** `(shop, ownerType, namespace, key)`

---

## ProductMetafield

Metafield values attached to a `Product`. Snapshot of the value at last sync/webhook time.

| Field | Type | Notes |
|---|---|---|
| `shopifyMetafieldId` | String | Shopify GID |
| `namespace` | String | Metafield namespace |
| `key` | String | Metafield key |
| `value` | String? | Serialized value (all types stored as string) |
| `valueType` | String? | Shopify metafield type |
| `definitionId` | String? | FK → `MetafieldDefinition` (SetNull on delete) |

**Unique:** `(shop, shopifyMetafieldId)`, `(shop, productId, namespace, key)`

---

## VariantMetafield

Same structure as `ProductMetafield`, scoped to `ProductVariant`.

**Unique:** `(shop, shopifyMetafieldId)`, `(shop, productVariantId, namespace, key)`

---

## OrderMetafield

Same structure as `ProductMetafield`, scoped to `Order`.

**Unique:** `(shop, shopifyMetafieldId)`, `(shop, orderId, namespace, key)`

---

## WebhookPendingFetch

**Async fetch queue** (Option B consistency pattern). When a webhook delivers data referencing a resource (product, variant, order) that does not yet exist in the DB, a job is enqueued here instead of fetching synchronously. A background worker processes `PENDING` jobs, fetches the full resource from Shopify Admin API, and upserts it with all related data.

This design:
- Keeps webhook handlers fast (<200ms) to avoid Shopify retries
- Guarantees eventual consistency even when webhooks arrive before the initial crawl completes

| Field | Type | Notes |
|---|---|---|
| `resourceType` | String | `PRODUCT`, `VARIANT`, `ORDER` |
| `shopifyResourceId` | String | Shopify GID of the missing resource |
| `reason` | String? | What triggered the fetch, e.g. `metafield_webhook` |
| `status` | String | `PENDING` → `PROCESSING` → `DONE` / `FAILED` |
| `retryCount` | Int | Incremented on each failed attempt |
| `lastError` | String? | Last failure message for debugging |
| `scheduledAt` | DateTime | When the job was first enqueued |
| `processedAt` | DateTime? | When the job completed |

**Unique:** `(shop, resourceType, shopifyResourceId)` — upsert with `status=PENDING` on each new webhook for the same resource; prevents duplicate fetch jobs.

---

## ShopifySyncState

Tracks cursor-based pagination state for full crawl jobs. Allows incremental sync to resume from where it left off without re-fetching all records.

| Field | Type | Notes |
|---|---|---|
| `resourceType` | String | `PRODUCT`, `ORDER`, `DISCOUNT`, etc. |
| `lastCursor` | String? | GraphQL pagination cursor |
| `lastSyncedAt` | DateTime? | Timestamp of last completed sync |
| `isRunning` | Boolean | Guard flag to prevent concurrent runs |
| `lastError` | String? | Last error message if sync failed |

**Unique:** `(shop, resourceType)`

---

## Entity Relationship Overview

```
Shop
 ├── Product
 │    ├── ProductVariant
 │    │    └── VariantMetafield ──→ MetafieldDefinition
 │    ├── ProductMetafield ──→ MetafieldDefinition
 │    └── DiscountRuleTarget ←── DiscountRule
 │                                 ├── DiscountCode
 │                                 └── DiscountRuleTarget
 ├── Order
 │    ├── OrderLineItem
 │    │    └── OrderLineItemDiscountAllocation ──→ OrderDiscountApplication
 │    ├── OrderDiscountApplication ──→ DiscountRule (soft FK, snapshot)
 │    └── OrderMetafield ──→ MetafieldDefinition
 ├── WebhookPendingFetch   (async fetch queue)
 └── ShopifySyncState      (crawl cursor registry)
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| PostgreSQL + pgvector | Native JSONB, proper Decimal, full-text search, and vector similarity search for AI recommendation features |
| `pgvector` extension declared in schema | Prisma will auto-create the extension on `migrate dev`; future `Unsupported("vector")` embedding columns can be added to `Product`, `ProductVariant`, etc. |
| Monetary fields as `String` | Preserves exact merchant-facing values (e.g. `"1999.99"`) without any float rounding; easy to parse with `Decimal.js` at the application layer |
| `raw Json?` on every crawled model | PostgreSQL stores this as `jsonb`; preserves Shopify's full payload and allows GIN-indexed queries on raw fields |
| `OrderDiscountApplication` as snapshot | Discount rules can be edited after orders are placed; the snapshot captures exact values at apply time |
| Separate metafield tables per owner type | Avoids polymorphic FKs and enables clean cascade deletes with proper FK constraints |
| `WebhookPendingFetch` queue | Webhooks may arrive before the initial crawl — deferred fetch keeps handlers fast and DB consistent |
| `MetafieldDefinition` registry | Enables UI filtering and AI feature extraction over dynamic merchant-defined metafield schemas |
| `DiscountCode.deletedAt` (soft delete) | Merchants can delete and re-create a code with the same string; hard delete would cause unique constraint violations on re-insert |
