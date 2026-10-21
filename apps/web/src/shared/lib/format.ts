// 金额以分为单位存储，展示为人民币。
export const formatCents = (cents: number) => `¥${(cents / 100).toFixed(2)}`;
