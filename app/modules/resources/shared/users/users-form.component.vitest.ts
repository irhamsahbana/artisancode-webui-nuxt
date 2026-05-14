import { describe, expect, it } from 'vitest'
import {
  buildUserPayload,
  createEmptyUserForm,
  formatUserRoles,
  syncUserForm,
} from './users-form'

describe('users-form', () => {
  it('creates an empty user form state', () => {
    expect(createEmptyUserForm()).toEqual({
      id: '',
      name: '',
      username: '',
      email: '',
      password: '',
      role_ids: [],
    })
  })

  it('builds a normalized payload and omits blank password', () => {
    const form = createEmptyUserForm()
    form.name = '  Jane Doe  '
    form.username = '  jdoe  '
    form.email = '  jane@example.com  '
    form.password = '   '
    form.role_ids = ['role-1', 'role-2']

    expect(buildUserPayload(form)).toEqual({
      name: 'Jane Doe',
      username: 'jdoe',
      email: 'jane@example.com',
      role_ids: ['role-1', 'role-2'],
    })

    form.password = '  secret123  '

    expect(buildUserPayload(form)).toEqual({
      name: 'Jane Doe',
      username: 'jdoe',
      email: 'jane@example.com',
      password: 'secret123',
      role_ids: ['role-1', 'role-2'],
    })
  })

  it('syncs user detail into the edit form and clears password', () => {
    const form = createEmptyUserForm()
    form.password = 'should-reset'

    syncUserForm(form, {
      id: 'user-1',
      name: 'Jane Doe',
      username: 'jdoe',
      email: 'jane@example.com',
      roles: [
        { id: 'role-1', name: 'Admin' },
        { id: 'role-2', name: 'HR' },
      ],
    })

    expect(form).toEqual({
      id: 'user-1',
      name: 'Jane Doe',
      username: 'jdoe',
      email: 'jane@example.com',
      password: '',
      role_ids: ['role-1', 'role-2'],
    })
  })

  it('formats role cells defensively', () => {
    expect(formatUserRoles([])).toBe('-')
    expect(formatUserRoles([{ name: 'Admin' }, { name: 'HR' }])).toBe('Admin, HR')
    expect(formatUserRoles([{ }, { name: 'HR' }])).toBe('-, HR')
  })
})
