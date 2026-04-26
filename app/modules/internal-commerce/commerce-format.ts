import type { CommerceAction } from './types'

export type CommerceStatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export type CommerceStatusDescriptor = {
  labelKey: string
  tone: CommerceStatusTone
}

const fallbackStatusDescriptor: CommerceStatusDescriptor = {
  labelKey: 'internalCommerce.status.unknown',
  tone: 'neutral',
}

export const quotationStatusDescriptors: Record<string, CommerceStatusDescriptor> = {
  draft: { labelKey: 'internalCommerce.status.quotation.draft', tone: 'neutral' },
  sent: { labelKey: 'internalCommerce.status.quotation.sent', tone: 'info' },
  approved: { labelKey: 'internalCommerce.status.quotation.approved', tone: 'success' },
  rejected: { labelKey: 'internalCommerce.status.quotation.rejected', tone: 'danger' },
  expired: { labelKey: 'internalCommerce.status.quotation.expired', tone: 'warning' },
  converted: { labelKey: 'internalCommerce.status.quotation.converted', tone: 'success' },
}

export const orderStatusDescriptors: Record<string, CommerceStatusDescriptor> = {
  draft: { labelKey: 'internalCommerce.status.order.draft', tone: 'neutral' },
  pending_invoice: { labelKey: 'internalCommerce.status.order.pendingInvoice', tone: 'warning' },
  pending_payment: { labelKey: 'internalCommerce.status.order.pendingPayment', tone: 'warning' },
  paid: { labelKey: 'internalCommerce.status.order.paid', tone: 'success' },
  cancelled: { labelKey: 'internalCommerce.status.order.cancelled', tone: 'danger' },
  expired: { labelKey: 'internalCommerce.status.order.expired', tone: 'warning' },
}

export const invoiceStatusDescriptors: Record<string, CommerceStatusDescriptor> = {
  open: { labelKey: 'internalCommerce.status.invoice.open', tone: 'warning' },
  paid: { labelKey: 'internalCommerce.status.invoice.paid', tone: 'success' },
  expired: { labelKey: 'internalCommerce.status.invoice.expired', tone: 'warning' },
  cancelled: { labelKey: 'internalCommerce.status.invoice.cancelled', tone: 'danger' },
}

export const paymentStatusDescriptors: Record<string, CommerceStatusDescriptor> = {
  initiated: { labelKey: 'internalCommerce.status.payment.initiated', tone: 'info' },
  pending: { labelKey: 'internalCommerce.status.payment.pending', tone: 'warning' },
  succeeded: { labelKey: 'internalCommerce.status.payment.succeeded', tone: 'success' },
  failed: { labelKey: 'internalCommerce.status.payment.failed', tone: 'danger' },
  expired: { labelKey: 'internalCommerce.status.payment.expired', tone: 'warning' },
  awaiting_verification: { labelKey: 'internalCommerce.status.payment.awaitingVerification', tone: 'warning' },
  waiting_verification: { labelKey: 'internalCommerce.status.payment.awaitingVerification', tone: 'warning' },
}

export const resolveStatusDescriptor = (
  group: 'quotation' | 'order' | 'invoice' | 'payment',
  status: string | null | undefined,
) => {
  const normalized = String(status ?? '').trim().toLowerCase()
  const descriptors = {
    quotation: quotationStatusDescriptors,
    order: orderStatusDescriptors,
    invoice: invoiceStatusDescriptors,
    payment: paymentStatusDescriptors,
  }[group]

  return descriptors[normalized] ?? fallbackStatusDescriptor
}

export const findCommerceAction = (
  actions: CommerceAction[] | null | undefined,
  key: string,
) => actions?.find(action => action.key === key) ?? null

export const hasCommerceAction = (
  actions: CommerceAction[] | null | undefined,
  key: string,
) => Boolean(findCommerceAction(actions, key))

export const normalizeCommerceActionPath = (href: string) => {
  if (/^https?:\/\//i.test(href)) {
    return href
  }

  return href.startsWith('/') ? href : `/${href}`
}

export const buildCommerceActionPayload = (
  action: CommerceAction,
  payload: Record<string, unknown> = {},
) => ({
  action: action.key,
  ...payload,
})

export const formatCommerceMoney = (
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
