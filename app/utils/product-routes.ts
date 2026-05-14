import type { Product } from "./product-mode";

export const SHARED_ROUTE_PREFIXES = [
  "/app",
  "/app/billing",
  "/app/resources/companies",
  "/app/settings/tenant",
] as const;

export const PRODUCT_ROUTE_PREFIXES: Record<Product, readonly string[]> = {
  hr: [
    "/app/resources/attendance-logs",
    "/app/resources/employees",
    "/app/resources/job-positions",
    "/app/resources/roles",
    "/app/resources/work-locations",
    "/app/resources/work-shifts",
  ],
  crm: [
    "/app/resources/categories",
    "/app/resources/customers",
    "/app/resources/customer-types",
    "/app/resources/segments",
    "/app/resources/areas",
    "/app/resources/relationship-statuses",
  ],
} as const;
