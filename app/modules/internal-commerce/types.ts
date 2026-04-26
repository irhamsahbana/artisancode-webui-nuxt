export type CommerceActionMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type CommerceAction = {
  key: string
  label: string
  method: CommerceActionMethod
  href: string
}

export type CommercePaymentMethod = {
  provider: string
  payment_method_type: string
  label: string
}

export type CommercePaymentInstruction = {
  title?: string
  reference_number?: string
  bank_name?: string
  account_number?: string
  account_name?: string
  notes?: string
}

export type CommerceQuotationSummary = {
  id: string
  quotation_number: string
  status: string
}

export type CommerceQuotation = CommerceQuotationSummary & {
  currency_code: string
  subtotal_amount: string
  discount_amount: string
  tax_amount: string
  total_amount: string
  expires_at: string | null
  quote_snapshot: Record<string, unknown> | null
  available_actions: CommerceAction[]
}

export type CommerceOrderSummary = {
  id: string
  order_number: string
  status: string
  source_type?: string
}

export type CommerceInvoiceSummary = {
  id: string
  invoice_number: string
  status: string
  amount?: string
}

export type CommercePaymentAttempt = {
  id: string
  provider: string
  payment_method_type: string
  payment_channel_code?: string
  status: string
  requested_amount: string
  paid_amount?: string
  provider_reference?: string
  provider_request_id?: string
  payment_url?: string
  instruction?: CommercePaymentInstruction | null
  created_at?: string
  expired_at?: string | null
  available_actions?: CommerceAction[]
}

export type CommerceInvoice = {
  id: string
  invoice_number: string
  status: string
  currency_code: string
  amount: string
  amount_paid: string
  amount_outstanding: string
  due_at?: string | null
  order?: CommerceOrderSummary | Record<string, unknown> | null
  quotation?: CommerceQuotationSummary | Record<string, unknown> | null
  latest_payment_attempt: CommercePaymentAttempt | null
  available_payment_methods: CommercePaymentMethod[]
  available_actions: CommerceAction[]
}

export type CommerceQuotationConversion = {
  quotation: CommerceQuotationSummary
  order: CommerceOrderSummary
  invoice: CommerceInvoiceSummary
  available_actions: CommerceAction[]
}

export type CommerceOrderCreation = {
  order: CommerceOrderSummary
  invoice: CommerceInvoiceSummary & {
    currency_code?: string
    amount_outstanding?: string
  }
  available_actions: CommerceAction[]
}

export type CommercePaymentAttemptList = {
  items: CommercePaymentAttempt[]
  available_actions?: CommerceAction[]
}

export type CreateOrderPayload = {
  internal_product_id?: string
  internal_product_pricing_id?: string
  quotation_id?: string
  currency_code?: string
  invoice_due_at?: string
}
