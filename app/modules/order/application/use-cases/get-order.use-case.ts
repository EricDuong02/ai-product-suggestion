import type { IOrderRepository } from "../../domain/repositories/order.repository.interface";
import type { OrderDetailResult } from "../../domain/order.types";

export class GetOrderUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  execute(id: string): Promise<OrderDetailResult> {
    return this.orderRepository.getOrder(id);
  }
}
