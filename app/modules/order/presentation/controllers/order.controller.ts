import type { ListOrdersUseCase } from "../../application/use-cases/list-orders.use-case";
import type { GetOrderUseCase } from "../../application/use-cases/get-order.use-case";
import type {
  OrderDetailResult,
  OrderListResult,
} from "../../domain/order.types";

export class OrderController {
  constructor(
    private readonly listOrdersUseCase: ListOrdersUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
  ) {}

  list(first = 20, after?: string): Promise<OrderListResult> {
    return this.listOrdersUseCase.execute(first, after);
  }

  detail(orderId: string): Promise<OrderDetailResult> {
    return this.getOrderUseCase.execute(orderId);
  }
}
