import test from "node:test";
import assert from "node:assert/strict";

const {
  resolveActiveProduct,
  shouldShowProductSwitcher,
} = await import(new URL("./product-view.ts", import.meta.url).href);

test("resolveActiveProduct keeps allowed product selection", () => {
  assert.equal(resolveActiveProduct("crm", ["hr", "crm"], "hr"), "crm");
});

test("resolveActiveProduct falls back to primary product", () => {
  assert.equal(resolveActiveProduct("crm", ["hr"], "hr"), "hr");
});

test("resolveActiveProduct falls back to first enabled product when primary is unavailable", () => {
  assert.equal(resolveActiveProduct("unknown", ["crm"], "hr"), "crm");
});

test("shouldShowProductSwitcher only appears for multiple products", () => {
  assert.equal(shouldShowProductSwitcher(["hr"]), false);
  assert.equal(shouldShowProductSwitcher(["hr", "crm"]), true);
});
