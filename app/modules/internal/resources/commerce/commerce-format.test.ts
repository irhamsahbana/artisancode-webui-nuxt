import assert from 'node:assert/strict'
import test from 'node:test'

const {
  buildCommerceActionPayload,
  findCommerceAction,
  formatCommerceMoney,
  hasCommerceAction,
  normalizeCommerceActionPath,
  resolveStatusDescriptor,
} = await import(new URL('./commerce-format.ts', import.meta.url).href)

test('maps quotation, invoice, and payment statuses to stable descriptor keys', () => {
  assert.deepEqual(resolveStatusDescriptor('quotation', 'sent'), {
    labelKey: 'internalCommerce.status.quotation.sent',
    tone: 'info',
  })
  assert.deepEqual(resolveStatusDescriptor('invoice', 'paid'), {
    labelKey: 'internalCommerce.status.invoice.paid',
    tone: 'success',
  })
  assert.deepEqual(resolveStatusDescriptor('payment', 'awaiting_verification'), {
    labelKey: 'internalCommerce.status.payment.awaitingVerification',
    tone: 'warning',
  })
  assert.deepEqual(resolveStatusDescriptor('payment', 'unmapped'), {
    labelKey: 'internalCommerce.status.unknown',
    tone: 'neutral',
  })
})

test('derives visible actions from available_actions', () => {
  const actions = [
    {
      key: 'create_doku_payment_attempt',
      label: 'Pay with DOKU',
      method: 'POST',
      href: '/internal-commerce/invoices/uuid/actions',
    },
  ]

  assert.equal(hasCommerceAction(actions, 'create_doku_payment_attempt'), true)
  assert.equal(hasCommerceAction(actions, 'retry_payment'), false)
  assert.equal(findCommerceAction(actions, 'create_doku_payment_attempt')?.href, '/internal-commerce/invoices/uuid/actions')
})

test('builds action payloads with the backend action key', () => {
  const action = {
    key: 'retry_payment',
    label: 'Retry',
    method: 'POST',
    href: '/internal-commerce/payment-attempts/uuid/actions',
  }

  assert.deepEqual(buildCommerceActionPayload(action, {
    provider: 'doku',
    payment_method_type: 'gateway',
  }), {
    action: 'retry_payment',
    provider: 'doku',
    payment_method_type: 'gateway',
  })
})

test('normalizes internal action hrefs and preserves external URLs', () => {
  assert.equal(normalizeCommerceActionPath('internal-commerce/invoices/id/actions'), '/internal-commerce/invoices/id/actions')
  assert.equal(normalizeCommerceActionPath('/internal-commerce/invoices/id/actions'), '/internal-commerce/invoices/id/actions')
  assert.equal(normalizeCommerceActionPath('https://pay.doku.com/checkout/session'), 'https://pay.doku.com/checkout/session')
})

test('formats commerce money using locale and currency', () => {
  assert.equal(formatCommerceMoney('150000.00', 'IDR', 'id'), 'Rp 150.000')
  assert.equal(formatCommerceMoney('150000.50', 'IDR', 'en'), 'IDR 150,000.50')
  assert.equal(formatCommerceMoney('abc', 'IDR', 'id'), '-')
})
