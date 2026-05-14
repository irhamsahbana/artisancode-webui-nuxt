import type { ListResponse } from '~/types/api'
import type {
  TenantBillingErrorCode,
  TenantBillingInvoiceStatus,
  TenantBillingPaymentAttemptStatus,
  TenantBillingReceiptStatus,
  TenantBillingSubscriptionStatus,
} from './types'

export type BillingStatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export type BillingStatusDescriptor = {
  labelKey: string
  tone: BillingStatusTone
}

const fallbackStatusDescriptor: BillingStatusDescriptor = {
  labelKey: 'billing.status.unknown',
  tone: 'neutral',
}

export const invoiceStatusDescriptors: Record<TenantBillingInvoiceStatus, BillingStatusDescriptor> = {
  draft: { labelKey: 'billing.status.invoice.draft', tone: 'neutral' },
  open: { labelKey: 'billing.status.invoice.open', tone: 'warning' },
  partially_paid: { labelKey: 'billing.status.invoice.partiallyPaid', tone: 'warning' },
  paid: { labelKey: 'billing.status.invoice.paid', tone: 'success' },
  expired: { labelKey: 'billing.status.invoice.expired', tone: 'warning' },
  cancelled: { labelKey: 'billing.status.invoice.cancelled', tone: 'danger' },
}

export const paymentAttemptStatusDescriptors: Record<TenantBillingPaymentAttemptStatus, BillingStatusDescriptor> = {
  initiated: { labelKey: 'billing.status.payment.initiated', tone: 'info' },
  pending: { labelKey: 'billing.status.payment.pending', tone: 'warning' },
  succeeded: { labelKey: 'billing.status.payment.succeeded', tone: 'success' },
  failed: { labelKey: 'billing.status.payment.failed', tone: 'danger' },
  expired: { labelKey: 'billing.status.payment.expired', tone: 'warning' },
  cancelled: { labelKey: 'billing.status.payment.cancelled', tone: 'danger' },
}

export const subscriptionStatusDescriptors: Record<TenantBillingSubscriptionStatus, BillingStatusDescriptor> = {
  free: { labelKey: 'billing.status.subscription.free', tone: 'neutral' },
  pending_activation: { labelKey: 'billing.status.subscription.pendingActivation', tone: 'warning' },
  active: { labelKey: 'billing.status.subscription.active', tone: 'success' },
  grace_period: { labelKey: 'billing.status.subscription.gracePeriod', tone: 'warning' },
  suspended: { labelKey: 'billing.status.subscription.suspended', tone: 'danger' },
  cancelled: { labelKey: 'billing.status.subscription.cancelled', tone: 'danger' },
  expired: { labelKey: 'billing.status.subscription.expired', tone: 'warning' },
}

export const receiptStatusDescriptors: Record<TenantBillingReceiptStatus, BillingStatusDescriptor> = {
  pending_verification: { labelKey: 'billing.status.receipt.pendingVerification', tone: 'warning' },
  accepted: { labelKey: 'billing.status.receipt.accepted', tone: 'success' },
  rejected: { labelKey: 'billing.status.receipt.rejected', tone: 'danger' },
}

export const billingErrorMessageKeys: Record<TenantBillingErrorCode, string> = {
  FORBIDDEN_BILLING_ACTION: 'billing.errors.forbiddenBillingAction',
  PLAN_NOT_AVAILABLE: 'billing.errors.planNotAvailable',
  ADD_ON_NOT_COMPATIBLE: 'billing.errors.addOnNotCompatible',
  CHECKOUT_ALREADY_IN_PROGRESS: 'billing.errors.checkoutAlreadyInProgress',
  CHECKOUT_REPLACEMENT_NOT_ALLOWED: 'billing.errors.checkoutReplacementNotAllowed',
  INVOICE_NOT_PAYABLE: 'billing.errors.invoiceNotPayable',
  PAYMENT_ATTEMPT_NOT_RETRYABLE: 'billing.errors.paymentAttemptNotRetryable',
  WEBHOOK_SIGNATURE_INVALID: 'billing.errors.webhookSignatureInvalid',
  WEBHOOK_EVENT_DUPLICATE: 'billing.errors.webhookEventDuplicate',
  PAYMENT_RECEIPT_ALREADY_VERIFIED: 'billing.errors.paymentReceiptAlreadyVerified',
  SUBSCRIPTION_CHANGE_NOT_ALLOWED: 'billing.errors.subscriptionChangeNotAllowed',
  DOKU_STATUS_UNMAPPED: 'billing.errors.dokuStatusUnmapped',
  DOKU_EVENT_NOT_TERMINAL: 'billing.errors.dokuEventNotTerminal',
}

export const resolveBillingStatusDescriptor = (
  group: 'invoice' | 'payment' | 'subscription' | 'receipt',
  status: string | null | undefined,
) => {
  const normalized = String(status ?? '').trim().toLowerCase()
  const descriptors = {
    invoice: invoiceStatusDescriptors,
    payment: paymentAttemptStatusDescriptors,
    subscription: subscriptionStatusDescriptors,
    receipt: receiptStatusDescriptors,
  }[group] as Record<string, BillingStatusDescriptor>

  return descriptors[normalized] ?? fallbackStatusDescriptor
}

export const resolveBillingErrorMessageKey = (code: string | null | undefined) => {
  const normalized = String(code ?? '').trim()
  return billingErrorMessageKeys[normalized as TenantBillingErrorCode] ?? 'billing.errors.generic'
}

export const normalizeBillingList = <T>(value: ListResponse<T> | T[] | null | undefined) => {
  if (Array.isArray(value)) {
    return value
  }

  return value?.items ?? []
}

export const formatBillingMoney = (
  amount: string | number | null | undefined,
  currencyCode: string | null | undefined,
  locale: string,
) => {
  const numericAmount = typeof amount === 'number' ? amount : Number(amount)
  const normalizedCurrency = currencyCode?.trim().toUpperCase() || 'IDR'

  if (!Number.isFinite(numericAmount)) {
    return '-'
  }

  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'id-ID', {
    style: 'currency',
    currency: normalizedCurrency,
    minimumFractionDigits: numericAmount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: numericAmount % 1 === 0 ? 0 : 2,
  }).format(numericAmount)
}
