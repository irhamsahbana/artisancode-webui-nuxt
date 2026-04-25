export type InternalProductStatus = 'draft' | 'active' | 'inactive' | 'archived'

export type InternalProduct = {
  id: string
  code: string
  name: string
  description: string
  status: string
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type InternalProductPricing = {
  id: string
  internal_product_id: string
  code: string
  name: string
  description: string
  status: string
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type InternalProductPrice = {
  id: string
  internal_product_pricing_id: string
  currency_code: string
  amount: string
  started_at: string
  ended_at: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type InternalProductForm = {
  id: string
  code: string
  name: string
  description: string
  status: InternalProductStatus
}

export type InternalProductPricingForm = {
  id: string
  internal_product_id: string
  code: string
  name: string
  description: string
  status: InternalProductStatus
}

export type InternalProductPriceForm = {
  id: string
  internal_product_pricing_id: string
  currency_code: string
  amount: string
  started_at: string
  ended_at: string
}
