import { useQuery } from "@tanstack/react-query";
import { getOverview } from "./api";
import { overviewKeys } from "./queryKeys";

// 概览汇总了订单、结算、商品，数据变化频繁，每次挂载都重新拉取。
export const useOverview = (merchantId: string) =>
  useQuery({
    queryKey: overviewKeys.merchant(merchantId),
    queryFn: ({ signal }) => getOverview(merchantId, signal),
    refetchOnMount: "always",
  });
