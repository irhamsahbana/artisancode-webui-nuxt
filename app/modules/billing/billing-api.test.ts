import assert from 'node:assert/strict'
import test from 'node:test'

const { createTenantBillingApi } = await import(new URL('./billing-api.ts', import.meta.url).href)

test('createTenantBillingApi delegates tenant billing endpoints', async () => {
  const calls: Array<{ path: string, options?: Record<string, unknown> }> = []
  const apiFetch = async <T>(path: string, options?: Record<string, unknown>) => {
    calls.push({ path, options })
    return {
      success: true,
      message: 'ok',
      data: null as T,
      errors: null,
    }
  }

  const api = createTenantBillingApi(apiFetch)
  const signal = new AbortController().signal

  await api.listPlans(signal)
  await api.getSubscription(signal)
  await api.getEntitlements(signal)
  await api.listInvoices({ page: 1, limit: 15 }, signal)
  await api.getInvoice('inv_1', signal)
  await api.listPaymentAttempts('inv_1', signal)
  await api.createCheckout({
    pricing_id: 'price_1',
    billing_cycle: 'monthly',
    add_on_ids: ['addon_1'],
    replace_active_checkout: false,
  })
  await api.runInvoiceAction('inv_1', { action: 'cancel_checkout_order', reason: 'changed_plan' })

  assert.deepEqual(calls, [
    { path: '/tenant-billing/plans', options: { signal } },
    { path: '/tenant-billing/subscription', options: { signal } },
    { path: '/tenant-billing/entitlements', options: { signal } },
    { path: '/tenant-billing/invoices', options: { query: { page: 1, limit: 15 }, signal } },
    { path: '/tenant-billing/invoices/inv_1', options: { signal } },
    { path: '/tenant-billing/invoices/inv_1/payment-attempts', options: { signal } },
    {
      path: '/tenant-billing/checkouts',
      options: {
        method: 'POST',
        body: {
          pricing_id: 'price_1',
          billing_cycle: 'monthly',
          add_on_ids: ['addon_1'],
          replace_active_checkout: false,
        },
      },
    },
    {
      path: '/tenant-billing/invoices/inv_1/actions',
      options: {
        method: 'POST',
        body: { action: 'cancel_checkout_order', reason: 'changed_plan' },
      },
    },
  ])
})
