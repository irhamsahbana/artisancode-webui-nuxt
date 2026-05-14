import {
  hasEnabledProduct,
  resolveEnabledProducts,
  resolveProduct,
  type Product,
} from "~/utils/product-mode";

export const useProductMode = () => {
  const { user } = useAuth();

  const primaryProduct = computed<Product>(() => resolveProduct(user.value?.primary_product));
  const enabledProducts = computed<Product[]>(() =>
    resolveEnabledProducts(user.value?.enabled_products, primaryProduct.value)
  );
  const isHrMode = computed(() => primaryProduct.value === "hr");
  const isCrmMode = computed(() => primaryProduct.value === "crm");
  const hasHrProduct = computed(() => hasEnabledProduct(enabledProducts.value, "hr"));
  const hasCrmProduct = computed(() => hasEnabledProduct(enabledProducts.value, "crm"));

  return {
    primaryProduct,
    enabledProducts,
    isHrMode,
    isCrmMode,
    hasHrProduct,
    hasCrmProduct,
  };
};
