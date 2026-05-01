export const categoryStatusOptions = ['active', 'inactive'] as const

export type CategoryStatus = (typeof categoryStatusOptions)[number]

export type CategoryFormState = {
  parentId: string
  group: string
  name: string
  status: string
}

export const categoryStatusOptionList = categoryStatusOptions.map((status) => ({
  value: status,
  label: status,
}))

export const isCategoryStatus = (value: string): value is CategoryStatus =>
  categoryStatusOptions.includes(value as CategoryStatus)

export const createCategoryPayload = (form: CategoryFormState) => {
  const name = form.name.trim()
  if (!name) {
    return null
  }

  const payload: Record<string, unknown> = {
    name,
    group: form.group.trim(),
    parent_id: null,
  }

  const parentId = form.parentId.trim()
  if (parentId) {
    payload.parent_id = parentId
  }

  if (isCategoryStatus(form.status)) {
    payload.status = form.status
  }

  return payload
}
