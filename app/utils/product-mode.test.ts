import assert from "node:assert/strict";
import test from "node:test";

const {
  DEFAULT_PRODUCT,
  extractProductAccessFromToken,
  getProductHomePath,
  hasEnabledProduct,
  isProductRouteAllowed,
  resolveEnabledProducts,
  resolveProduct,
  resolveProductAccess,
} = await import(new URL("./product-mode.ts", import.meta.url).href);

const createToken = (payload: Record<string, unknown>) => {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64");

  return `header.${encodedPayload}.signature`;
};

test("resolves product identifiers and falls back safely", () => {
  assert.equal(resolveProduct("hr"), "hr");
  assert.equal(resolveProduct("crm"), "crm");
  assert.equal(resolveProduct("finance"), DEFAULT_PRODUCT);
});

test("normalizes enabled products and always includes primary product", () => {
  assert.deepEqual(resolveEnabledProducts(["crm"], "hr"), ["crm", "hr"]);
  assert.deepEqual(resolveEnabledProducts([], "crm"), ["crm"]);
});

test("resolves access from modern and legacy token shapes", () => {
  assert.deepEqual(resolveProductAccess({
    primary_product: "crm",
    enabled_products: ["crm", "hr"],
  }), {
    primaryProduct: "crm",
    enabledProducts: ["crm", "hr"],
  });

  assert.deepEqual(resolveProductAccess({
    product_mode: "crm",
  }), {
    primaryProduct: "crm",
    enabledProducts: ["crm"],
  });
});

test("extracts product access from access token payload", () => {
  assert.deepEqual(extractProductAccessFromToken(createToken({
    primary_product: "hr",
    enabled_products: ["hr", "crm"],
  })), {
    primaryProduct: "hr",
    enabledProducts: ["hr", "crm"],
  });
});

test("checks enabled products and route access by entitlement", () => {
  assert.equal(hasEnabledProduct(["hr", "crm"], "crm"), true);
  assert.equal(isProductRouteAllowed(["crm"], "/app/resources/customer-types"), true);
  assert.equal(isProductRouteAllowed(["crm"], "/app/resources/categories"), true);
  assert.equal(isProductRouteAllowed(["crm"], "/app/resources/employees"), false);
  assert.equal(isProductRouteAllowed(["hr"], "/app/resources/employees"), true);
  assert.equal(isProductRouteAllowed(["hr", "crm"], "/app/settings/tenant"), true);
  assert.equal(getProductHomePath("crm"), "/app");
});
