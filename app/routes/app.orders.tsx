import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { createOrderController, type OrderSummary } from "../modules/order";
import type { IGraphQLClient } from "../shared/ports/shopify-client.port";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const after = url.searchParams.get("after") ?? undefined;

  const controller = createOrderController(admin as unknown as IGraphQLClient);
  return controller.list(20, after);
};

export default function OrdersPage() {
  const { orders, hasNextPage, endCursor } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Orders">
      <s-section>
        {orders.length === 0 ? (
          <s-paragraph>No orders found.</s-paragraph>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Order", "Customer", "Payment", "Fulfillment", "Total"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "8px 12px",
                        borderBottom: "1px solid #e1e3e5",
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {orders.map((order: OrderSummary) => (
                <tr key={order.id}>
                  <td style={{ padding: "8px 12px" }}>{order.name}</td>
                  <td style={{ padding: "8px 12px" }}>
                    {order.customer?.displayName ?? "Guest"}
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    {order.displayFinancialStatus}
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    {order.displayFulfillmentStatus}
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    {order.currentTotalPriceSet.shopMoney.currencyCode}{" "}
                    {order.currentTotalPriceSet.shopMoney.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </s-section>

      {hasNextPage && endCursor && (
        <s-section>
          <s-link href={`/app/orders?after=${endCursor}`}>
            Load next page
          </s-link>
        </s-section>
      )}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
