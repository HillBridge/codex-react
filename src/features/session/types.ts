export interface Session {
  user: {
    id: string;
    name: string;
  };
  merchant: {
    id: string;
    name: string;
    permissions: ("order:read" | "order:update" | "order:delete")[];
  };
}
