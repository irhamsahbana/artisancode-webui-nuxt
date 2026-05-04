import type { ApiResponse, ListResponse } from '~/types/api'

export type ApiFetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Record<string, unknown>
  body?: BodyInit | Record<string, unknown> | null
  signal?: AbortSignal | null
  authMode?: 'user' | 'internal' | 'none'
}

export type ApiFetch = <T>(
  path: string,
  options?: ApiFetchOptions,
) => Promise<ApiResponse<T>>

export type TenantBillingCycle = 'monthly' | 'annual'

export type TenantBillingInvoiceStatus =
  | 'draft'
  | 'open'
  | 'partially_paid'
  | 'paid'
  | 'expired'
  | 'cancelled'

export type TenantBillingPaymentAttemptStatus =
  | 'initiated'
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'expired'
  | 'cancelled'

export type TenantBillingSubscriptionStatus =
  | 'free'
  | 'pending_activation'
  | 'active'
  | 'grace_period'
  | 'suspended'
  | 'cancelled'
  | 'expired'

export type TenantBillingReceiptStatus =
  | 'pending_verification'
  | 'accepted'
  | 'rejected'

export type TenantBillingErrorCode =
  | 'FORBIDDEN_BILLING_ACTION'
  | 'PLAN_NOT_AVAILABLE'
  | 'ADD_ON_NOT_COMPATIBLE'
  | 'CHECKOUT_ALREADY_IN_PROGRESS'
  | 'CHECKOUT_REPLACEMENT_NOT_ALLOWED'
  | 'INVOICE_NOT_PAYABLE'
  | 'PAYMENT_ATTEMPT_NOT_RETRYABLE'
  | 'WEBHOOK_SIGNATURE_INVALID'
  | 'WEBHOOK_EVENT_DUPLICATE'
  | 'PAYMENT_RECEIPT_ALREADY_VERIFIED'
  | 'SUBSCRIPTION_CHANGE_NOT_ALLOWED'
  | 'DOKU_STATUS_UNMAPPED'
  | 'DOKU_EVENT_NOT_TERMINAL'

export type TenantBillingPlanPrice = {
  id: string
  pricing_id: string
  billing_cycle: TenantBillingCycle
  amount: string
  currency: string
  currency_symbol?: string | null
  currency_decimal_places?: number | null
  is_default_currency?: boolean | null
}

export type TenantBillingAddOn = {
  id: string
  name: string
  description?: string | null
  amount?: string | null
  currency?: string | null
  billing_cycle?: TenantBillingCycle | null
}

export type TenantBillingPlan = {
  id: string
  name: string
  description?: string | null
  pricing_id?: string | null
  billing_cycle?: TenantBillingCycle | null
  amount?: string | null
  currency?: string | null
  features?: string[]
  prices?: TenantBillingPlanPrice[]
  add_ons?: TenantBillingAddOn[]
}

export type TenantBillingSubscription = {
  id?: string
  status: TenantBillingSubscriptionStatus
  plan_name?: string | null
  billing_cycle?: TenantBillingCycle | null
  current_period_start?: string | null
  current_period_end?: string | null
  next_renewal_at?: string | null
  add_ons?: TenantBillingAddOn[]
}

export type TenantBillingEntitlements = {
  subscription_state: TenantBillingSubscriptionStatus
  features: string[]
  usage_limits: Record<string, number>
}

export type TenantBillingInvoice = {
  id: string
  invoice_number?: string | null
  amount?: string | null
  currency?: string | null
  status: TenantBillingInvoiceStatus
  payment_attempt_id?: string | null
  payment_url?: string | null
  due_at?: string | null
  created_at?: string | null
  paid_at?: string | null
}

export type TenantBillingPaymentAttempt = {
  id: string
  status: TenantBillingPaymentAttemptStatus
  provider?: string | null
  payment_url?: string | null
  created_at?: string | null
  expires_at?: string | null
}

export type TenantBillingCheckoutRequest = {
  price_id: string
  add_on_ids?: string[]
  replace_active_checkout?: boolean
  callback_url?: string
}

export type TenantBillingCheckoutResponse = {
  invoice_id: string
  payment_attempt_id: string
  payment_url: string
  target_subscription_state: TenantBillingSubscriptionStatus
  checkout_reused: boolean
}

export type TenantBillingActionRequest = {
  action: string
  reason?: string
}

export type TenantBillingList<T> = ListResponse<T> | T[]
