import type { IOrderRepository } from "../../domain/repositories/order.repository.interface";
import type { OrderListResult } from "../../domain/order.types";

export class ListOrdersUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  execute(first = 20, after?: string): Promise<OrderListResult> {
    return this.orderRepository.listOrders(first, after);
  }
}
