import type { Product } from "~/utils/product-mode";
import {
  resolveActiveProduct,
  shouldShowProductSwitcher,
} from "~/utils/product-view";

const ACTIVE_PRODUCT_COOKIE = "ac_active_product";

export const useActiveProduct = () => {
  const { t } = useLocale();
  const { enabledProducts, primaryProduct } = useProductMode();
  const activeProductCookie = useCookie<Product | null>(ACTIVE_PRODUCT_COOKIE, {
    sameSite: "lax",
  });

  const activeProduct = computed<Product>(() =>
    resolveActiveProduct(
      activeProductCookie.value,
      enabledProducts.value,
      primaryProduct.value
    )
  );

  const productOptions = computed(() =>
    enabledProducts.value.map((product) => ({
      value: product,
      label: t(product === "crm" ? "layout.productCrm" : "layout.productHr"),
    }))
  );

  const showProductSwitcher = computed(() =>
    shouldShowProductSwitcher(enabledProducts.value)
  );

  const setActiveProduct = (value: Product) => {
    activeProductCookie.value = resolveActiveProduct(
      value,
      enabledProducts.value,
      primaryProduct.value
    );
  };

  watchEffect(() => {
    activeProductCookie.value = activeProduct.value;
  });

  return {
    activeProduct,
    productOptions,
    setActiveProduct,
    showProductSwitcher,
  };
};
