import type { IOrderRepository } from "../../domain/repositories/order.repository.interface";
import type {
  OrderDetailResult,
  OrderListResult,
} from "../../domain/order.types";

/**
 * OCP Decorator: wraps any IOrderRepository and adds structured logging.
 *
 * Open for extension (wrap with more decorators like CachedOrderRepository),
 * closed for modification (inner repository is never touched).
 *
 * Usage in composition root:
 *   const repo = new LoggedOrderRepository(new ShopifyOrderRepository(client));
 */
export class LoggedOrderRepository implements IOrderRepository {
  constructor(
    private readonly inner: IOrderRepository,
    private readonly logger: Pick<Console, "log" | "error"> = console,
  ) {}

  async listOrders(first: number, after?: string): Promise<OrderListResult> {
    const label = `[OrderRepository] listOrders(first=${first}, after=${after ?? "null"})`;
    const start = Date.now();
    try {
      const result = await this.inner.listOrders(first, after);
      this.logger.log(
        `${label} → ${result.orders.length} orders [${Date.now() - start}ms]`,
      );
      return result;
    } catch (err) {
      this.logger.error(`${label} → ERROR`, err);
      throw err;
    }
  }

  async getOrder(id: string): Promise<OrderDetailResult> {
    const label = `[OrderRepository] getOrder(id=${id})`;
    const start = Date.now();
    try {
      const result = await this.inner.getOrder(id);
      const found = result.order ? "found" : "not found";
      this.logger.log(`${label} → ${found} [${Date.now() - start}ms]`);
      return result;
    } catch (err) {
      this.logger.error(`${label} → ERROR`, err);
      throw err;
    }
  }
}
