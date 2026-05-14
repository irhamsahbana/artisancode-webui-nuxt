import type { ListResponse } from '~/types/api'
import type {
  ApiFetch,
  TenantBillingActionRequest,
  TenantBillingCheckoutRequest,
  TenantBillingCheckoutResponse,
  TenantBillingEntitlements,
  TenantBillingInvoice,
  TenantBillingPaymentAttempt,
  TenantBillingPlan,
  TenantBillingSubscription,
} from './types'

const TENANT_BILLING_BASE = '/tenant-billing'

export const createTenantBillingApi = (apiFetch: ApiFetch) => ({
  listPlans: (signal?: AbortSignal | null) =>
    apiFetch<ListResponse<TenantBillingPlan> | TenantBillingPlan[]>(`${TENANT_BILLING_BASE}/plans`, {
      signal,
    }),

  getSubscription: (signal?: AbortSignal | null) =>
    apiFetch<TenantBillingSubscription>(`${TENANT_BILLING_BASE}/subscription`, {
      signal,
    }),

  getEntitlements: (signal?: AbortSignal | null) =>
    apiFetch<TenantBillingEntitlements>(`${TENANT_BILLING_BASE}/entitlements`, {
      signal,
    }),

  listInvoices: (
    query: Record<string, unknown>,
    signal?: AbortSignal | null,
  ) => apiFetch<ListResponse<TenantBillingInvoice> | TenantBillingInvoice[]>(`${TENANT_BILLING_BASE}/invoices`, {
    query,
    signal,
  }),

  getInvoice: (
    id: string,
    signal?: AbortSignal | null,
  ) => apiFetch<TenantBillingInvoice>(`${TENANT_BILLING_BASE}/invoices/${id}`, {
    signal,
  }),

  listPaymentAttempts: (
    invoiceId: string,
    signal?: AbortSignal | null,
  ) => apiFetch<ListResponse<TenantBillingPaymentAttempt> | TenantBillingPaymentAttempt[]>(
    `${TENANT_BILLING_BASE}/invoices/${invoiceId}/payment-attempts`,
    { signal },
  ),

  createCheckout: (body: TenantBillingCheckoutRequest) =>
    apiFetch<TenantBillingCheckoutResponse>(`${TENANT_BILLING_BASE}/checkouts`, {
      method: 'POST',
      body,
    }),

  runInvoiceAction: (
    invoiceId: string,
    body: TenantBillingActionRequest,
  ) => apiFetch(`${TENANT_BILLING_BASE}/invoices/${invoiceId}/actions`, {
    method: 'POST',
    body,
  }),

  runPaymentAttemptAction: (
    paymentAttemptId: string,
    body: TenantBillingActionRequest,
  ) => apiFetch(`${TENANT_BILLING_BASE}/payment-attempts/${paymentAttemptId}/actions`, {
    method: 'POST',
    body,
  }),

  runSubscriptionAction: (body: TenantBillingActionRequest) =>
    apiFetch(`${TENANT_BILLING_BASE}/subscription/actions`, {
      method: 'POST',
      body,
    }),

  runAddOnsAction: (body: TenantBillingActionRequest & { add_on_ids?: string[] }) =>
    apiFetch(`${TENANT_BILLING_BASE}/add-ons/actions`, {
      method: 'POST',
      body,
    }),
})
