import type { IProductDemoRepository } from "../../domain/repositories/product-demo.repository.interface";
import type { DemoProductResult } from "../../domain/product-demo.types";

const COLORS = ["Red", "Orange", "Yellow", "Green"] as const;

/**
 * Use case: orchestrates all steps needed to generate a demo product.
 * Business logic (colour selection, step sequencing) lives here —
 * data access is delegated to the repository.
 */
export class GenerateDemoProductUseCase {
  constructor(private readonly productDemoRepository: IProductDemoRepository) {}

  async execute(): Promise<DemoProductResult> {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    const { product, variantId } =
      await this.productDemoRepository.createProduct(`${color} Snowboard`);

    const variant = await this.productDemoRepository.updateVariantPrice(
      product.id,
      variantId,
      "100.00",
    );

    const metaobject = await this.productDemoRepository.upsertMetaobject(
      "$app:example",
      "demo-entry",
      [
        { key: "title", value: "Demo Entry" },
        {
          key: "description",
          value:
            "This metaobject was created by the Shopify app template to demonstrate the metaobject API.",
        },
      ],
    );

    return { product, variant, metaobject };
  }
}
