/**
 * Minimal port for executing GraphQL queries/mutations.
 *
 * ISP: Modules that only need GraphQL capability depend on this narrow
 * interface — not on the full Shopify admin client object.
 * If the Shopify SDK later adds REST or webhook helpers, those modules
 * remain completely unaffected.
 */
export interface IGraphQLClient {
  graphql(
    query: string,
    options?: {
      variables?: Record<string, unknown>;
    },
  ): Promise<Response>;
}

/**
 * @deprecated Use IGraphQLClient instead.
 * Kept as a type alias for backward compatibility during migration.
 */
export type IShopifyAdminClient = IGraphQLClient;
