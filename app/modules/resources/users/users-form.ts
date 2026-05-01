export type RoleItem = {
  id: string
  name: string
}

export type UserRole = {
  id: string
  name: string
}

export type UserDetail = {
  id: string
  name: string
  username: string
  email: string
  roles: UserRole[]
}

export type UserFormState = {
  id: string
  name: string
  username: string
  email: string
  password: string
  role_ids: string[]
}

export const createEmptyUserForm = (): UserFormState => ({
  id: '',
  name: '',
  username: '',
  email: '',
  password: '',
  role_ids: [],
})

export const buildUserPayload = (form: UserFormState) => {
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    username: form.username.trim(),
    email: form.email.trim(),
    role_ids: [...form.role_ids],
  }

  const trimmedPassword = form.password.trim()
  if (trimmedPassword.length > 0) {
    payload.password = trimmedPassword
  }

  return payload
}

export const syncUserForm = (form: UserFormState, detail: UserDetail) => {
  form.id = detail.id
  form.name = detail.name
  form.username = detail.username
  form.email = detail.email
  form.password = ''
  form.role_ids = detail.roles.map(role => role.id)
}

export const formatUserRoles = (value: unknown) => {
  const roles = Array.isArray(value) ? value as Array<{ name?: string }> : []
  if (roles.length === 0) {
    return '-'
  }

  return roles.map(role => role.name ?? '-').join(', ')
}
