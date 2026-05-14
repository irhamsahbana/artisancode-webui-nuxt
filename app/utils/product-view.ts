type Product = "hr" | "crm";

const DEFAULT_PRODUCT: Product = "hr";

const resolveProduct = (value: unknown): Product => {
  if (value === "crm" || value === "hr") {
    return value;
  }

  return DEFAULT_PRODUCT;
};

export const resolveActiveProduct = (
  value: unknown,
  enabledProducts: Product[],
  primaryProduct: Product
): Product => {
  const fallbackProduct = enabledProducts.includes(primaryProduct)
    ? primaryProduct
    : enabledProducts[0] ?? DEFAULT_PRODUCT;
  const resolvedProduct = resolveProduct(value);

  if (enabledProducts.includes(resolvedProduct)) {
    return resolvedProduct;
  }

  return fallbackProduct;
};

export const shouldShowProductSwitcher = (enabledProducts: Product[]) =>
  enabledProducts.length > 1;
