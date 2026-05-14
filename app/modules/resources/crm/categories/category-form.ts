export const categoryStatusOptions = ['active', 'inactive'] as const

export type CategoryStatus = (typeof categoryStatusOptions)[number]

export type CategoryFormState = {
  parentId: string
  name: string
  status: string
}

export const createEmptyCategoryForm = (): CategoryFormState => ({
  parentId: '',
  name: '',
  status: 'active',
})

export const categoryStatusOptionList = categoryStatusOptions.map((status) => ({
  value: status,
  label: status,
}))

export const createCategoryStatusOptions = (t: (key: string) => string) => (
  categoryStatusOptions.map(status => ({
    value: status,
    label: t(`ui.${status}`),
  }))
)

export const isCategoryStatus = (value: string): value is CategoryStatus =>
  categoryStatusOptions.includes(value as CategoryStatus)

export const createCategoryPayload = (form: CategoryFormState) => {
  const name = form.name.trim()
  if (!name) {
    return null
  }

  const payload: Record<string, unknown> = {
    name,
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
