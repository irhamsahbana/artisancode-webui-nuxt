export type InternalUser = {
  id: string
  full_name: string
  email: string
  role_code: string
  status: string
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export type InternalUserFormState = {
  id: string
  full_name: string
  email: string
  password: string
  role_code: string
  status: string
}

export const roleOptions = ['super_admin', 'operator'] as const
export const statusOptions = ['invited', 'active', 'inactive'] as const

export const roleOptionList = roleOptions.map((value) => ({ value, label: value }))
export const statusOptionList = statusOptions.map((value) => ({ value, label: value }))

export const createEmptyInternalUserForm = (): InternalUserFormState => ({
  id: '',
  full_name: '',
  email: '',
  password: '',
  role_code: 'operator',
  status: 'active',
})

export const buildInternalUserPayload = (form: InternalUserFormState) => {
  const payload: Record<string, unknown> = {
    full_name: form.full_name.trim(),
    email: form.email.trim(),
    role_code: form.role_code,
    status: form.status,
  }

  const password = form.password.trim()
  if (password.length > 0) {
    payload.password = password
  }

  return payload
}

export const syncInternalUserForm = (
  form: InternalUserFormState,
  user: InternalUser,
) => {
  form.id = user.id
  form.full_name = user.full_name
  form.email = user.email
  form.password = ''
  form.role_code = roleOptions.includes(user.role_code as (typeof roleOptions)[number])
    ? user.role_code
    : 'operator'
  form.status = statusOptions.includes(user.status as (typeof statusOptions)[number])
    ? user.status
    : 'active'
}
