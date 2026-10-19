export interface Overview {
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    confirmedAmount: number;
  };
  settlements: {
    pendingCount: number;
    pendingAmount: number;
  };
  products: {
    onShelf: number;
    offShelf: number;
    lowStock: number;
  };
}
