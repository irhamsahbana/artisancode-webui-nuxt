import { SHARED_ROUTE_PREFIXES, PRODUCT_ROUTE_PREFIXES } from "./product-routes.js"

export type Product = "hr" | "crm";

export type ProductAccess = {
  primaryProduct: Product;
  enabledProducts: Product[];
};

export const DEFAULT_PRODUCT: Product = "hr";

export const resolveProduct = (value: unknown): Product => {
  if (value === "crm" || value === "hr") {
    return value;
  }

  return DEFAULT_PRODUCT;
};

export const resolveEnabledProducts = (value: unknown, primaryProduct: Product): Product[] => {
  const products = Array.isArray(value)
    ? value
        .map((item) => resolveProduct(item))
        .filter((item, index, items) => items.indexOf(item) === index)
    : [];

  if (!products.includes(primaryProduct)) {
    products.push(primaryProduct);
  }

  return products.length > 0 ? products : [primaryProduct];
};

export const resolveProductAccess = (value: {
  primary_product?: unknown;
  enabled_products?: unknown;
  product_mode?: unknown;
} | null | undefined): ProductAccess => {
  const fallbackPrimary = resolveProduct(value?.product_mode);
  const primaryProduct = resolveProduct(value?.primary_product ?? fallbackPrimary);

  return {
    primaryProduct,
    enabledProducts: resolveEnabledProducts(value?.enabled_products, primaryProduct),
  };
};

export const extractProductAccessFromToken = (token: string | null | undefined): ProductAccess => {
  if (!token) {
    return {
      primaryProduct: DEFAULT_PRODUCT,
      enabledProducts: [DEFAULT_PRODUCT],
    };
  }

  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload || ""));

    return resolveProductAccess(decoded);
  } catch {
    return {
      primaryProduct: DEFAULT_PRODUCT,
      enabledProducts: [DEFAULT_PRODUCT],
    };
  }
};

export const getProductHomePath = (_primaryProduct: Product) => "/app";

export const hasEnabledProduct = (enabledProducts: Product[], product: Product) =>
  enabledProducts.includes(product);

const pathMatchesPrefix = (path: string, prefix: string) =>
  path === prefix || path.startsWith(`${prefix}/`);

const getRouteRequiredProduct = (path: string): Product | null => {
  for (const prefix of PRODUCT_ROUTE_PREFIXES.crm) {
    if (pathMatchesPrefix(path, prefix)) {
      return "crm";
    }
  }

  for (const prefix of PRODUCT_ROUTE_PREFIXES.hr) {
    if (pathMatchesPrefix(path, prefix)) {
      return "hr";
    }
  }

  return null;
};

export const isProductRouteAllowed = (enabledProducts: Product[], path: string) => {
  const requiredProduct = getRouteRequiredProduct(path);

  if (!requiredProduct) {
    return SHARED_ROUTE_PREFIXES.some((prefix) => pathMatchesPrefix(path, prefix));
  }

  return hasEnabledProduct(enabledProducts, requiredProduct);
};
