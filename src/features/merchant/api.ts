import { apiRequest } from "../../shared/api/request";
import type { MerchantListResponse } from "./types";

export function getMerchants() {
  return apiRequest<MerchantListResponse>("/api/merchants");
}
