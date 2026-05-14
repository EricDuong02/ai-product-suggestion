// ─── Money ───────────────────────────────────────────────────────────────────
export interface MoneyV2 {
  amount: string;
  currencyCode: string;
}

// ─── Line item ───────────────────────────────────────────────────────────────
export interface OrderLineItem {
  title: string;
  quantity: number;
  originalUnitPriceSet: { shopMoney: MoneyV2 };
}

// ─── Customer ────────────────────────────────────────────────────────────────
export interface OrderCustomer {
  id: string;
  displayName: string;
  email: string;
}

// ─── Order (list view) ───────────────────────────────────────────────────────
export interface OrderSummary {
  id: string;
  name: string;
  displayFinancialStatus: string;
  displayFulfillmentStatus: string;
  createdAt: string;
  currentTotalPriceSet: { shopMoney: MoneyV2 };
  customer: OrderCustomer | null;
}

// ─── Order (detail view) ─────────────────────────────────────────────────────
export interface OrderDetail extends OrderSummary {
  lineItems: {
    edges: Array<{ node: OrderLineItem }>;
  };
}

// ─── Service results ─────────────────────────────────────────────────────────
export interface OrderListResult {
  orders: OrderSummary[];
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface OrderDetailResult {
  order: OrderDetail | null;
}
