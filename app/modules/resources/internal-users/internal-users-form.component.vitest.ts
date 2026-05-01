import { describe, expect, it } from 'vitest'
import {
  buildInternalUserPayload,
  createEmptyInternalUserForm,
  roleOptionList,
  statusOptionList,
  syncInternalUserForm,
} from './internal-users-form'

describe('internal-users-form', () => {
  it('creates an empty internal user form state', () => {
    expect(createEmptyInternalUserForm()).toEqual({
      id: '',
      full_name: '',
      email: '',
      password: '',
      role_code: 'operator',
      status: 'active',
    })
  })

  it('builds a normalized payload and omits blank password', () => {
    const form = createEmptyInternalUserForm()
    form.full_name = '  Jane Admin  '
    form.email = '  jane@example.com  '
    form.password = '   '
    form.role_code = 'super_admin'
    form.status = 'inactive'

    expect(buildInternalUserPayload(form)).toEqual({
      full_name: 'Jane Admin',
      email: 'jane@example.com',
      role_code: 'super_admin',
      status: 'inactive',
    })

    form.password = '  secret123  '

    expect(buildInternalUserPayload(form)).toEqual({
      full_name: 'Jane Admin',
      email: 'jane@example.com',
      password: 'secret123',
      role_code: 'super_admin',
      status: 'inactive',
    })
  })

  it('syncs internal user detail and falls back for unknown enum values', () => {
    const form = createEmptyInternalUserForm()
    form.password = 'should-reset'

    syncInternalUserForm(form, {
      id: 'user-1',
      full_name: 'Jane Admin',
      email: 'jane@example.com',
      role_code: 'unknown',
      status: 'unexpected',
      last_login_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    })

    expect(form).toEqual({
      id: 'user-1',
      full_name: 'Jane Admin',
      email: 'jane@example.com',
      password: '',
      role_code: 'operator',
      status: 'active',
    })
  })

  it('exposes fixed option lists for role and status fields', () => {
    expect(roleOptionList).toEqual([
      { value: 'super_admin', label: 'super_admin' },
      { value: 'operator', label: 'operator' },
    ])
    expect(statusOptionList).toEqual([
      { value: 'invited', label: 'invited' },
      { value: 'active', label: 'active' },
      { value: 'inactive', label: 'inactive' },
    ])
  })
})
