import type { GenerateDemoProductUseCase } from "../../application/use-cases/generate-demo-product.use-case";
import type { DemoProductResult } from "../../domain/product-demo.types";

export class ProductDemoController {
  constructor(
    private readonly generateDemoProductUseCase: GenerateDemoProductUseCase,
  ) {}

  createProductDemo(): Promise<DemoProductResult> {
    return this.generateDemoProductUseCase.execute();
  }
}
