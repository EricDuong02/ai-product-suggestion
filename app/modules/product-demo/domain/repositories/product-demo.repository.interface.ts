import type { DemoProductResult } from "../product-demo.types";

/**
 * Port (interface) for product demo data access.
 * Breaks down the "generate demo product" flow into individual mutations
 * so the use case can orchestrate the business logic.
 */
export interface IProductDemoRepository {
  createProduct(title: string): Promise<{
    product: { id: string; [key: string]: unknown };
    variantId: string;
    rawProduct: DemoProductResult["product"];
  }>;

  updateVariantPrice(
    productId: string,
    variantId: string,
    price: string,
  ): Promise<DemoProductResult["variant"]>;

  upsertMetaobject(
    type: string,
    handle: string,
    fields: Array<{ key: string; value: string }>,
  ): Promise<DemoProductResult["metaobject"]>;
}
