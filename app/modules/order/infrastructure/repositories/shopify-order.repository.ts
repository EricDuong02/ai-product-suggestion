import type { IGraphQLClient } from "../../../../shared/ports/shopify-client.port";
import type { IOrderRepository } from "../../domain/repositories/order.repository.interface";
import type {
  OrderDetail,
  OrderDetailResult,
  OrderListResult,
  OrderSummary,
} from "../../domain/order.types";
import { GET_ORDER_QUERY, LIST_ORDERS_QUERY } from "../graphql/order.queries";

// ─── Raw GraphQL response shapes ─────────────────────────────────────────────

interface RawOrdersResponse {
  data?: {
    orders?: {
      pageInfo?: { hasNextPage: boolean; endCursor: string | null };
      edges?: Array<{ node: OrderSummary }>;
    };
  };
}

interface RawOrderResponse {
  data?: {
    order?: OrderDetail | null;
  };
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

/**
 * Implements IOrderRepository using the Shopify Admin GraphQL API.
 */
export class ShopifyOrderRepository implements IOrderRepository {
  constructor(private readonly adminClient: IGraphQLClient) {}

  async listOrders(first = 20, after?: string): Promise<OrderListResult> {
    const response = await this.adminClient.graphql(LIST_ORDERS_QUERY, {
      variables: { first, after: after ?? null },
    });

    const json = (await response.json()) as RawOrdersResponse;
    const ordersData = json.data?.orders;

    return {
      orders: ordersData?.edges?.map((e) => e.node) ?? [],
      hasNextPage: ordersData?.pageInfo?.hasNextPage ?? false,
      endCursor: ordersData?.pageInfo?.endCursor ?? null,
    };
  }

  async getOrder(id: string): Promise<OrderDetailResult> {
    const response = await this.adminClient.graphql(GET_ORDER_QUERY, {
      variables: { id },
    });

    const json = (await response.json()) as RawOrderResponse;

    return { order: json.data?.order ?? null };
  }
}
