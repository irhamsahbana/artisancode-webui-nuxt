export type CustomerDetail = {
  id: string
  customer_entity_type: string
  display_name: string
  company_name?: string | null
  individual_name?: string | null
  customer_type_id?: string | null
  segment_id?: string | null
  business_field?: string | null
  profession?: string | null
  address?: string | null
  city?: string | null
  province?: string | null
  area_id?: string | null
  phone?: string | null
  whatsapp_number?: string | null
  email?: string | null
  customer_status: string
  potential_level: string
  follow_up_priority: string
  relationship_status_id?: string | null
  general_notes?: string | null
  has_contract_before: boolean
  last_contract_value?: number | null
  last_contract_year?: number | null
  contract_notes?: string | null
  primary_contact_name?: string | null
  primary_contact_role?: string | null
}

export type CustomerFormState = {
  id: string
  customer_entity_type: string
  display_name: string
  company_name: string
  individual_name: string
  customer_type_id: string
  segment_id: string
  business_field: string
  profession: string
  address: string
  city: string
  province: string
  area_id: string
  phone: string
  whatsapp_number: string
  email: string
  customer_status: string
  potential_level: string
  follow_up_priority: string
  relationship_status_id: string
  general_notes: string
  has_contract_before: boolean
  last_contract_value: string
  last_contract_year: string
  contract_notes: string
  primary_contact_name: string
  primary_contact_role: string
}

export const createEmptyCustomerForm = (): CustomerFormState => ({
  id: '',
  customer_entity_type: 'company',
  display_name: '',
  company_name: '',
  individual_name: '',
  customer_type_id: '',
  segment_id: '',
  business_field: '',
  profession: '',
  address: '',
  city: '',
  province: '',
  area_id: '',
  phone: '',
  whatsapp_number: '',
  email: '',
  customer_status: 'prospect',
  potential_level: 'medium',
  follow_up_priority: 'medium',
  relationship_status_id: '',
  general_notes: '',
  has_contract_before: false,
  last_contract_value: '',
  last_contract_year: '',
  contract_notes: '',
  primary_contact_name: '',
  primary_contact_role: '',
})

const normalizeOptionalText = (value: string) => {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export const buildCustomerPayload = (form: CustomerFormState) => {
  const displayName = form.display_name.trim()
  if (!displayName) {
    return { payload: null, error: 'display_name' as const }
  }

  if (form.has_contract_before && !form.last_contract_year.trim()) {
    return { payload: null, error: 'last_contract_year' as const }
  }

  let lastContractValue: number | null = null
  if (form.last_contract_value.trim()) {
    const parsed = Number(form.last_contract_value)
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { payload: null, error: 'last_contract_value' as const }
    }
    lastContractValue = parsed
  }

  let lastContractYear: number | null = null
  if (form.last_contract_year.trim()) {
    const parsed = Number(form.last_contract_year)
    if (!Number.isInteger(parsed) || parsed < 1900 || parsed > 2100) {
      return { payload: null, error: 'last_contract_year' as const }
    }
    lastContractYear = parsed
  }

  return {
    error: null,
    payload: {
      customer_entity_type: form.customer_entity_type,
      display_name: displayName,
      company_name: normalizeOptionalText(form.company_name),
      individual_name: normalizeOptionalText(form.individual_name),
      customer_type_id: normalizeOptionalText(form.customer_type_id),
      segment_id: normalizeOptionalText(form.segment_id),
      business_field: normalizeOptionalText(form.business_field),
      profession: normalizeOptionalText(form.profession),
      address: normalizeOptionalText(form.address),
      city: normalizeOptionalText(form.city),
      province: normalizeOptionalText(form.province),
      area_id: normalizeOptionalText(form.area_id),
      phone: normalizeOptionalText(form.phone),
      whatsapp_number: normalizeOptionalText(form.whatsapp_number),
      email: normalizeOptionalText(form.email),
      customer_status: form.customer_status,
      potential_level: form.potential_level,
      follow_up_priority: form.follow_up_priority,
      relationship_status_id: normalizeOptionalText(form.relationship_status_id),
      general_notes: normalizeOptionalText(form.general_notes),
      has_contract_before: form.has_contract_before,
      last_contract_value: lastContractValue,
      last_contract_year: lastContractYear,
      contract_notes: normalizeOptionalText(form.contract_notes),
      primary_contact_name: normalizeOptionalText(form.primary_contact_name),
      primary_contact_role: normalizeOptionalText(form.primary_contact_role),
    },
  }
}

export const syncCustomerForm = (
  form: CustomerFormState,
  detail: CustomerDetail,
) => {
  form.id = detail.id
  form.customer_entity_type = detail.customer_entity_type || 'company'
  form.display_name = detail.display_name || ''
  form.company_name = detail.company_name || ''
  form.individual_name = detail.individual_name || ''
  form.customer_type_id = detail.customer_type_id || ''
  form.segment_id = detail.segment_id || ''
  form.business_field = detail.business_field || ''
  form.profession = detail.profession || ''
  form.address = detail.address || ''
  form.city = detail.city || ''
  form.province = detail.province || ''
  form.area_id = detail.area_id || ''
  form.phone = detail.phone || ''
  form.whatsapp_number = detail.whatsapp_number || ''
  form.email = detail.email || ''
  form.customer_status = detail.customer_status || 'prospect'
  form.potential_level = detail.potential_level || 'medium'
  form.follow_up_priority = detail.follow_up_priority || 'medium'
  form.relationship_status_id = detail.relationship_status_id || ''
  form.general_notes = detail.general_notes || ''
  form.has_contract_before = detail.has_contract_before === true
  form.last_contract_value = detail.last_contract_value == null ? '' : String(detail.last_contract_value)
  form.last_contract_year = detail.last_contract_year == null ? '' : String(detail.last_contract_year)
  form.contract_notes = detail.contract_notes || ''
  form.primary_contact_name = detail.primary_contact_name || ''
  form.primary_contact_role = detail.primary_contact_role || ''
}
