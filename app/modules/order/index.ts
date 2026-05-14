import type { IGraphQLClient } from "../../shared/ports/shopify-client.port";
import { ShopifyOrderRepository } from "./infrastructure/repositories/shopify-order.repository";
import { LoggedOrderRepository } from "./infrastructure/repositories/logged-order.repository";
import { ListOrdersUseCase } from "./application/use-cases/list-orders.use-case";
import { GetOrderUseCase } from "./application/use-cases/get-order.use-case";
import { OrderController } from "./presentation/controllers/order.controller";

export { OrderController };
export type {
  OrderDetail,
  OrderDetailResult,
  OrderListResult,
  OrderSummary,
} from "./domain/order.types";
export type { IOrderRepository } from "./domain/repositories/order.repository.interface";

/**
 * Composition root: wires all dependencies and returns a ready-to-use OrderController.
 *
 * OCP in action: repository is wrapped with LoggedOrderRepository decorator.
 * New cross-cutting concerns (caching, metrics) can be layered here
 * without modifying any existing class.
 */
export function createOrderController(
  adminClient: IGraphQLClient,
): OrderController {
  const shopifyRepo = new ShopifyOrderRepository(adminClient);
  const repository = new LoggedOrderRepository(shopifyRepo);
  const listOrdersUseCase = new ListOrdersUseCase(repository);
  const getOrderUseCase = new GetOrderUseCase(repository);
  return new OrderController(listOrdersUseCase, getOrderUseCase);
}
