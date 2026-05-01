import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stubTestLocale } from '~/testing/component-test-utils'

const navigateTo = vi.fn()

vi.mock('#app', () => ({
  navigateTo,
}))

describe('permissions-page', () => {
  beforeEach(() => {
    navigateTo.mockReset()
    vi.resetModules()
    stubTestLocale()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('redirects to the roles resource route', async () => {
    const module = await import('./permissions-page.vue')

    mount(module.default)

    expect(navigateTo).toHaveBeenCalledWith('/app/resources/roles')
  })
})
