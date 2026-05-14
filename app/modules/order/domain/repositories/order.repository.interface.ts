import type { OrderDetailResult, OrderListResult } from "../order.types";

/**
 * Port (interface) for order data access.
 * Defined in domain layer — infrastructure must implement this.
 */
export interface IOrderRepository {
  listOrders(first: number, after?: string): Promise<OrderListResult>;
  getOrder(id: string): Promise<OrderDetailResult>;
}
