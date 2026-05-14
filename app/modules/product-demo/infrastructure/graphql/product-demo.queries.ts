export const CREATE_PRODUCT_MUTATION = `#graphql
  mutation populateProduct($product: ProductCreateInput!) {
    productCreate(product: $product) {
      product {
        id
        title
        handle
        status
        variants(first: 10) {
          edges {
            node {
              id
              price
              barcode
              createdAt
            }
          }
        }
        demoInfo: metafield(namespace: "$app", key: "demo_info") {
          jsonValue
        }
      }
    }
  }
`;

export const UPDATE_VARIANT_PRICE_MUTATION = `#graphql
  mutation shopifyReactRouterTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants {
        id
        price
        barcode
        createdAt
      }
    }
  }
`;

export const UPSERT_METAOBJECT_MUTATION = `#graphql
  mutation shopifyReactRouterTemplateUpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
      metaobject {
        id
        handle
        title: field(key: "title") {
          jsonValue
        }
        description: field(key: "description") {
          jsonValue
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;
