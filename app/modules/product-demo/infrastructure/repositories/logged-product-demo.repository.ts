import type { IProductDemoRepository } from "../../domain/repositories/product-demo.repository.interface";
import type { DemoProductResult } from "../../domain/product-demo.types";

/**
 * OCP Decorator: wraps any IProductDemoRepository and adds structured logging.
 *
 * Open for extension (wrap with more decorators),
 * closed for modification (inner repository is never touched).
 *
 * Usage in composition root:
 *   const repo = new LoggedProductDemoRepository(new ShopifyProductDemoRepository(client));
 */
export class LoggedProductDemoRepository implements IProductDemoRepository {
  constructor(
    private readonly inner: IProductDemoRepository,
    private readonly logger: Pick<Console, "log" | "error"> = console,
  ) {}

  async createProduct(title: string) {
    const label = `[ProductDemoRepository] createProduct(title="${title}")`;
    const start = Date.now();
    try {
      const result = await this.inner.createProduct(title);
      this.logger.log(
        `${label} → id=${result.product.id} [${Date.now() - start}ms]`,
      );
      return result;
    } catch (err) {
      this.logger.error(`${label} → ERROR`, err);
      throw err;
    }
  }

  async updateVariantPrice(
    productId: string,
    variantId: string,
    price: string,
  ): Promise<DemoProductResult["variant"]> {
    const label = `[ProductDemoRepository] updateVariantPrice(productId=${productId}, price=${price})`;
    const start = Date.now();
    try {
      const result = await this.inner.updateVariantPrice(
        productId,
        variantId,
        price,
      );
      this.logger.log(
        `${label} → ${result.length} variant(s) updated [${Date.now() - start}ms]`,
      );
      return result;
    } catch (err) {
      this.logger.error(`${label} → ERROR`, err);
      throw err;
    }
  }

  async upsertMetaobject(
    type: string,
    handle: string,
    fields: Array<{ key: string; value: string }>,
  ): Promise<DemoProductResult["metaobject"]> {
    const label = `[ProductDemoRepository] upsertMetaobject(type=${type}, handle=${handle})`;
    const start = Date.now();
    try {
      const result = await this.inner.upsertMetaobject(type, handle, fields);
      const status = result ? `id=${result["id"]}` : "null";
      this.logger.log(`${label} → ${status} [${Date.now() - start}ms]`);
      return result;
    } catch (err) {
      this.logger.error(`${label} → ERROR`, err);
      throw err;
    }
  }
}
