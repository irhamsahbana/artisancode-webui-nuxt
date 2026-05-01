export const branchStatusOptions = [
  'active',
  'inactive',
  'under_construction',
  'temporarily_closed',
  'planning',
] as const

export type BranchStatus = (typeof branchStatusOptions)[number]

export type BranchFormState = {
  name: string
  city: string
  capacity: string
  description: string
  address: string
  phone: string
  email: string
  headCoach: string
  status: BranchStatus
}

export const branchStatusOptionList = branchStatusOptions.map((status) => ({
  value: status,
  label: status,
}))

export const branchColumns = [
  { key: 'name', label: 'Name' },
  { key: 'city', label: 'City' },
  { key: 'status', label: 'Status' },
  { key: 'phone', label: 'Phone' },
]

export const createEmptyBranchForm = (): BranchFormState => ({
  name: '',
  city: '',
  capacity: '',
  description: '',
  address: '',
  phone: '',
  email: '',
  headCoach: '',
  status: 'active',
})

export const resetBranchForm = (form: BranchFormState) => {
  Object.assign(form, createEmptyBranchForm())
}

export const isBranchStatus = (value: string): value is BranchStatus =>
  branchStatusOptions.includes(value as BranchStatus)

const normalizeOptionalText = (value: string) => {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

export const formatBranchDeleteLabel = (row: Record<string, unknown>) => {
  const name = row.name
  const city = row.city
  if (typeof name === 'string' && name.length > 0) {
    if (typeof city === 'string' && city.length > 0) {
      return `${name} - ${city}`
    }
    return name
  }
  return String(row.id ?? '-')
}

export const getBranchRowId = (row: Record<string, unknown>) => {
  const id = row.id ?? row.uuid ?? row.code
  if (id === undefined || id === null) {
    return null
  }
  return String(id)
}

export const syncBranchForm = (
  form: BranchFormState,
  row: Record<string, unknown>,
) => {
  form.name = typeof row.name === 'string' ? row.name : ''
  form.city = typeof row.city === 'string' ? row.city : ''
  form.capacity = row.capacity !== null && row.capacity !== undefined ? String(row.capacity) : ''
  form.description = typeof row.description === 'string' ? row.description : ''
  form.address = typeof row.address === 'string' ? row.address : ''
  form.phone = typeof row.phone === 'string' ? row.phone : ''
  form.email = typeof row.email === 'string' ? row.email : ''
  form.headCoach = typeof row.head_coach === 'string' ? row.head_coach : ''

  const status = typeof row.status === 'string' ? row.status : ''
  form.status = isBranchStatus(status) ? status : 'active'
}

export const createBranchPayload = (form: BranchFormState) => {
  const name = form.name.trim()
  const city = form.city.trim()

  if (!name || !city) {
    return null
  }

  const payload: Record<string, unknown> = {
    name,
    city,
  }

  const description = normalizeOptionalText(form.description)
  if (description) {
    payload.description = description
  }

  const address = normalizeOptionalText(form.address)
  if (address) {
    payload.address = address
  }

  const phone = normalizeOptionalText(form.phone)
  if (phone) {
    payload.phone = phone
  }

  const headCoach = normalizeOptionalText(form.headCoach)
  if (headCoach) {
    payload.head_coach = headCoach
  }

  const email = normalizeOptionalText(form.email)
  if (email) {
    payload.email = email
  }

  const capacity = form.capacity.trim()
  if (capacity.length > 0) {
    const capacityNumber = Number(capacity)
    if (!Number.isNaN(capacityNumber)) {
      payload.capacity = capacityNumber
    }
  }

  if (isBranchStatus(form.status)) {
    payload.status = form.status
  }

  return payload
}
