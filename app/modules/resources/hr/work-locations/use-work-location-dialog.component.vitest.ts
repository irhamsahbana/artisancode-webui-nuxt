import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountComposable, stubTestLocale } from '~/testing/component-test-utils'
import { useWorkLocationDialog } from './use-work-location-dialog'

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

describe('useWorkLocationDialog', () => {
  beforeEach(() => {
    apiFetch.mockReset()
    show.mockReset()
    stubTestLocale({
      format: (key: string, params?: Record<string, string>) => `${key}:${params?.field ?? ''}`,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('validates trimmed name before submit', async () => {
    const dialog = mountComposable(() => useWorkLocationDialog())

    dialog.openCreateModal()
    dialog.form.value.name = '   '

    await dialog.handleSubmit()

    expect(show).toHaveBeenCalledWith('common.requiredField:common.name', 'error')
    expect(apiFetch).not.toHaveBeenCalled()
    expect(dialog.submitLoading.value).toBe(false)
  })

  it('resets modal loading when detail fetch fails', async () => {
    apiFetch.mockRejectedValue(new Error('detail failed'))

    const dialog = mountComposable(() => useWorkLocationDialog())

    await expect(dialog.openEditModal({ id: 'wl-1' })).rejects.toThrow('detail failed')

    expect(dialog.modalOpen.value).toBe(true)
    expect(dialog.modalLoading.value).toBe(false)
  })

  it('normalizes payload and resets submit loading when save fails', async () => {
    apiFetch.mockRejectedValue(new Error('save failed'))

    const dialog = mountComposable(() => useWorkLocationDialog())

    dialog.openCreateModal()
    dialog.form.value.name = '  HQ Office  '
    dialog.form.value.org_unit_id = 'org-1'
    dialog.form.value.address = '  Jl. Sudirman  '
    dialog.form.value.latitude = '  -6.2 '
    dialog.form.value.longitude = ' 106.8  '
    dialog.form.value.radius_meters = '   '

    await expect(dialog.handleSubmit()).rejects.toThrow('save failed')

    expect(apiFetch).toHaveBeenCalledWith('/work-locations', {
      method: 'POST',
      body: {
        name: 'HQ Office',
        org_unit_id: 'org-1',
        address: 'Jl. Sudirman',
        latitude: -6.2,
        longitude: 106.8,
        radius_meters: null,
      },
    })
    expect(dialog.submitLoading.value).toBe(false)
    expect(dialog.modalOpen.value).toBe(true)
  })
})
