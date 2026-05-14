export type JsonObject = Record<string, unknown>;

export interface DemoProduct extends JsonObject {
  id: string;
}

export interface DemoProductResult {
  product: DemoProduct;
  variant: JsonObject[];
  metaobject: JsonObject | null;
}
