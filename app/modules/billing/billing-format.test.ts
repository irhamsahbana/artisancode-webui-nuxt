import assert from 'node:assert/strict'
import test from 'node:test'

const {
  formatBillingMoney,
  normalizeBillingList,
  resolveBillingErrorMessageKey,
  resolveBillingStatusDescriptor,
} = await import(new URL('./billing-format.ts', import.meta.url).href)

test('billing status descriptors follow API contract enums', () => {
  assert.deepEqual(resolveBillingStatusDescriptor('invoice', 'partially_paid'), {
    labelKey: 'billing.status.invoice.partiallyPaid',
    tone: 'warning',
  })
  assert.deepEqual(resolveBillingStatusDescriptor('payment', 'succeeded'), {
    labelKey: 'billing.status.payment.succeeded',
    tone: 'success',
  })
  assert.deepEqual(resolveBillingStatusDescriptor('subscription', 'grace_period'), {
    labelKey: 'billing.status.subscription.gracePeriod',
    tone: 'warning',
  })
  assert.equal(resolveBillingStatusDescriptor('invoice', 'unknown').labelKey, 'billing.status.unknown')
})

test('billing stable error codes resolve to localized message keys', () => {
  assert.equal(
    resolveBillingErrorMessageKey('CHECKOUT_ALREADY_IN_PROGRESS'),
    'billing.errors.checkoutAlreadyInProgress',
  )
  assert.equal(resolveBillingErrorMessageKey('missing'), 'billing.errors.generic')
})

test('billing helpers normalize list payloads and money formatting', () => {
  assert.deepEqual(normalizeBillingList([{ id: 'plan-1' }]), [{ id: 'plan-1' }])
  assert.deepEqual(
    normalizeBillingList({
      items: [{ id: 'plan-2' }],
      pagination: {
        total: 1,
        page: 1,
        per_page: 15,
        last_page: 1,
      },
    }),
    [{ id: 'plan-2' }],
  )
  assert.equal(formatBillingMoney('100000', 'IDR', 'id').includes('100.000'), true)
  assert.equal(formatBillingMoney('not-money', 'IDR', 'id'), '-')
})
