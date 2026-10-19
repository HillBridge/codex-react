// 键层级：overview → merchantId。
const overviewRoot = ["overview"] as const;

export const overviewKeys = {
  // 某商户的经营概览，订单、结算、商品的变更后需要让它失效
  merchant: (merchantId: string) => [...overviewRoot, merchantId] as const,
};
