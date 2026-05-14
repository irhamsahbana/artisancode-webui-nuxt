import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountComposable, stubTestLocale } from '~/testing/component-test-utils'
import { useOrgUnitCreateFlow } from './use-org-unit-create-flow'

const { apiFetch, show } = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  show: vi.fn(),
}))

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({ apiFetch }),
}))

vi.mock('~/composables/useBanner', () => ({
  useBanner: () => ({ show }),
}))

describe('useOrgUnitCreateFlow', () => {
  beforeEach(() => {
    apiFetch.mockReset()
    show.mockReset()
    stubTestLocale()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resets the form when opening and validates the trimmed name', async () => {
    const createFlow = mountComposable(() => useOrgUnitCreateFlow())

    createFlow.createForm.name = 'Dirty'
    createFlow.createForm.category = 'unit'
    createFlow.createForm.parent_id = 'ou-1'
    createFlow.openCreate()

    expect(createFlow.createOpen.value).toBe(true)
    expect(createFlow.createForm).toEqual({
      name: '',
      category: 'company',
      parent_id: '',
    })

    createFlow.createForm.name = '   '
    await createFlow.submitCreate()

    expect(show).toHaveBeenCalledWith('ui.nameIsRequired', 'error')
    expect(apiFetch).not.toHaveBeenCalled()
  })

  it('submits the normalized payload and runs post-create callbacks', async () => {
    const onCreated = vi.fn()
    const refreshParentOptions = vi.fn()
    apiFetch.mockResolvedValue({ success: true })

    const createFlow = mountComposable(() => useOrgUnitCreateFlow({
      onCreated,
      refreshParentOptions,
    }))

    createFlow.openCreate()
    createFlow.createForm.name = '  People Ops  '
    createFlow.createForm.category = 'department'
    createFlow.createForm.parent_id = ''

    await createFlow.submitCreate()

    expect(apiFetch).toHaveBeenCalledWith('/org-units', {
      method: 'POST',
      body: {
        name: 'People Ops',
        category: 'department',
        parent_id: null,
      },
    })
    expect(show).toHaveBeenCalledWith('ui.orgUnitCreated', 'success')
    expect(onCreated).toHaveBeenCalledTimes(1)
    expect(refreshParentOptions).toHaveBeenCalledTimes(1)
    expect(createFlow.createOpen.value).toBe(false)
    expect(createFlow.createLoading.value).toBe(false)
  })

  it('closes the dialog and resets loading even when a post-create callback fails', async () => {
    const refreshParentOptions = vi.fn().mockRejectedValue(new Error('refresh failed'))
    apiFetch.mockResolvedValue({ success: true })

    const createFlow = mountComposable(() => useOrgUnitCreateFlow({
      refreshParentOptions,
    }))

    createFlow.openCreate()
    createFlow.createForm.name = 'People Ops'

    await expect(createFlow.submitCreate()).rejects.toThrow('refresh failed')

    expect(show).toHaveBeenCalledWith('ui.orgUnitCreated', 'success')
    expect(createFlow.createOpen.value).toBe(false)
    expect(createFlow.createLoading.value).toBe(false)
  })
})
