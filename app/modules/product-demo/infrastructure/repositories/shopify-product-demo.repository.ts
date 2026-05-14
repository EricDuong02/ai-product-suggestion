import type { IGraphQLClient } from "../../../../shared/ports/shopify-client.port";
import type { IProductDemoRepository } from "../../domain/repositories/product-demo.repository.interface";
import type { DemoProduct, JsonObject } from "../../domain/product-demo.types";
import {
  CREATE_PRODUCT_MUTATION,
  UPDATE_VARIANT_PRICE_MUTATION,
  UPSERT_METAOBJECT_MUTATION,
} from "../graphql/product-demo.queries";

// ─── Raw GraphQL response shapes ─────────────────────────────────────────────

interface RawCreateProductResponse {
  data?: {
    productCreate?: {
      product?: {
        id?: string;
        variants?: {
          edges?: Array<{ node?: { id?: string } }>;
        };
        [key: string]: unknown;
      };
    };
  };
}

interface RawUpdateVariantResponse {
  data?: {
    productVariantsBulkUpdate?: {
      productVariants?: JsonObject[];
    };
  };
}

interface RawUpsertMetaobjectResponse {
  data?: {
    metaobjectUpsert?: {
      metaobject?: JsonObject;
    };
  };
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

/**
 * Implements IProductDemoRepository using the Shopify Admin GraphQL API.
 * Each method corresponds to a single GraphQL mutation.
 */
export class ShopifyProductDemoRepository implements IProductDemoRepository {
  constructor(private readonly adminClient: IGraphQLClient) {}

  async createProduct(title: string) {
    const response = await this.adminClient.graphql(CREATE_PRODUCT_MUTATION, {
      variables: {
        product: {
          title,
          metafields: [
            {
              namespace: "$app",
              key: "demo_info",
              value: "Created by React Router Template",
            },
          ],
        },
      },
    });

    const json = (await response.json()) as RawCreateProductResponse;
    const product = json.data?.productCreate?.product;
    const productId = product?.id;
    const variantId = product?.variants?.edges?.[0]?.node?.id;

    if (!productId || !variantId) {
      throw new Error(
        "Unable to create demo product or resolve its first variant",
      );
    }

    return {
      product: product as DemoProduct,
      variantId,
      rawProduct: product as DemoProduct,
    };
  }

  async updateVariantPrice(
    productId: string,
    variantId: string,
    price: string,
  ) {
    const response = await this.adminClient.graphql(
      UPDATE_VARIANT_PRICE_MUTATION,
      {
        variables: {
          productId,
          variants: [{ id: variantId, price }],
        },
      },
    );

    const json = (await response.json()) as RawUpdateVariantResponse;
    return json.data?.productVariantsBulkUpdate?.productVariants ?? [];
  }

  async upsertMetaobject(
    type: string,
    handle: string,
    fields: Array<{ key: string; value: string }>,
  ) {
    const response = await this.adminClient.graphql(
      UPSERT_METAOBJECT_MUTATION,
      {
        variables: {
          handle: { type, handle },
          metaobject: { fields },
        },
      },
    );

    const json = (await response.json()) as RawUpsertMetaobjectResponse;
    return json.data?.metaobjectUpsert?.metaobject ?? null;
  }
}
