import { Button } from "@/shared/ui/button";
import { Alert } from "@/shared/ui/alert";
import { ApiError } from "@/shared/api/ApiError";
import { useUpdateOrderStatus } from "../mutations";
import { formatOrderAmount, formatOrderTime, type Order } from "@/entries/order";
import styles from "./OrderDetails.module.css";

export function OrderDetails({ order, canUpdate }: { order: Order; canUpdate: boolean }) {
  const mutation = useUpdateOrderStatus();
  const conflict = mutation.error instanceof ApiError && mutation.error.status === 409;
  return (
    <>
      {conflict ? (
        <Alert
          kind="warning"
          title="订单已被其他操作更新"
          description="页面已重新读取最新数据，请确认后再操作。"
        />
      ) : null}
      <dl className={styles.detail}>
        <dt>订单号</dt>
        <dd>{order.number}</dd>
        <dt>创建时间</dt>
        <dd>{formatOrderTime(order.createdAt)}</dd>
        <dt>订单金额</dt>
        <dd>{formatOrderAmount(order.amount)}</dd>
        <dt>订单状态</dt>
        <dd>{order.status}</dd>
      </dl>
      {canUpdate && order.status === "pending" ? (
        <div className={styles.actions}>
          <Button
            isDisabled={mutation.isPending}
            onPress={() =>
              mutation.mutate({
                merchantId: order.merchantId,
                orderId: order.id,
                status: "confirmed",
                version: order.version,
              })
            }
            variant="primary"
          >
            确认订单
          </Button>
          <Button
            isDisabled={mutation.isPending}
            onPress={() =>
              mutation.mutate({
                merchantId: order.merchantId,
                orderId: order.id,
                status: "cancelled",
                version: order.version,
              })
            }
            variant="danger"
          >
            取消订单
          </Button>
        </div>
      ) : null}
    </>
  );
}
