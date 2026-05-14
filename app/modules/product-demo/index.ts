import type { IGraphQLClient } from "../../shared/ports/shopify-client.port";
import { ShopifyProductDemoRepository } from "./infrastructure/repositories/shopify-product-demo.repository";
import { LoggedProductDemoRepository } from "./infrastructure/repositories/logged-product-demo.repository";
import { GenerateDemoProductUseCase } from "./application/use-cases/generate-demo-product.use-case";
import { ProductDemoController } from "./presentation/controllers/product-demo.controller";

export { ProductDemoController };
export type { DemoProductResult } from "./domain/product-demo.types";
export type { IProductDemoRepository } from "./domain/repositories/product-demo.repository.interface";

/**
 * Composition root: wires all dependencies and returns a ready-to-use ProductDemoController.
 *
 * OCP in action: repository is wrapped with LoggedProductDemoRepository decorator.
 * New cross-cutting concerns (caching, metrics) can be layered here
 * without modifying any existing class.
 */
export function createProductDemoController(
  adminClient: IGraphQLClient,
): ProductDemoController {
  const shopifyRepo = new ShopifyProductDemoRepository(adminClient);
  const repository = new LoggedProductDemoRepository(shopifyRepo);
  const generateDemoProductUseCase = new GenerateDemoProductUseCase(repository);
  return new ProductDemoController(generateDemoProductUseCase);
}
