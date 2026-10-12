export interface Merchant {
  id: string;
  name: string;
  permissions: string[];
}

export interface MerchantListResponse {
  items: Merchant[];
}

export interface MerchantRouteContext {
  merchant: Merchant;
  merchants: Merchant[];
}
