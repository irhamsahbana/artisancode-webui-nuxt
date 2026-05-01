import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import InternalResourceListControls from './internal-resource-list-controls.vue'

const { apiFetch, show, formatDateTime } = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  show: vi.fn(),
  formatDateTime: vi.fn((value: string | null | undefined) => value ?? '-'),
}))

const ActionMenuStub = defineComponent({
  name: 'ActionMenu',
  props: {
    open: { type: Boolean, default: false },
    label: { type: String, default: '' },
    items: { type: Array, default: () => [] },
  },
  emits: ['toggle', 'close', 'select'],
  setup(props, { emit }) {
    return () => h('div', { 'data-testid': 'action-menu', 'data-open': String(props.open) }, [
      h('button', {
        'data-testid': 'action-menu-toggle',
        onClick: () => emit('toggle'),
      }, props.label),
      ...(props.items as Array<{ key: string, label: string }>).map(item => h('button', {
        'data-testid': `action-menu-item-${item.key}`,
        onClick: () => emit('select', item.key),
      }, item.label)),
    ])
  },
})

const mountControls = (overrides: Record<string, unknown> = {}) => mount(InternalResourceListControls, {
  props: {
    endpoint: '/internal-users',
    resourceKey: 'internal-users',
    filenamePrefix: 'internal-users',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
    ],
    actionItems: [
      { key: 'export-users', label: 'ui.export', kind: 'export' },
      { key: 'user-export-history', label: 'ui.exportHistory', kind: 'export-history' },
    ],
    query: {
      status: 'active',
    },
    ...overrides,
  },
  global: {
    stubs: {
      ActionMenu: ActionMenuStub,
    },
  },
})

describe('InternalResourceListControls', () => {
  beforeEach(() => {
    const originalCreateElement = document.createElement.bind(document)

    apiFetch.mockReset()
    show.mockReset()
    formatDateTime.mockClear()
    vi.stubGlobal('useApi', () => ({
      apiFetch,
    }))
    vi.stubGlobal('useBanner', () => ({
      show,
    }))
    vi.stubGlobal('useLocale', () => ({
      t: (key: string) => key,
    }))
    vi.stubGlobal('useDateTime', () => ({
      formatDateTime,
    }))
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    })
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'history-1'),
    })
    vi.stubGlobal('Blob', vi.fn(() => ({})))
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:export')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const anchor = document.createElement('a')
    vi.spyOn(anchor, 'click').mockImplementation(() => {})
    vi.spyOn(anchor, 'remove').mockImplementation(() => {})
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return anchor
      }

      return originalCreateElement(tagName)
    })
    vi.spyOn(document.body, 'appendChild').mockImplementation((node: Node) => node)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('exports rows, emits action selection, and resets exporting when requests throw', async () => {
    apiFetch
      .mockResolvedValueOnce({
        success: true,
        data: {
          items: [
            { name: 'Ayu', email: 'ayu@example.com' },
          ],
          pagination: { total: 1, page: 1, per_page: 10, last_page: 1 },
        },
      })
      .mockRejectedValueOnce(new Error('export failed'))

    const wrapper = mountControls()

    await wrapper.get('[data-testid="action-menu-item-export-users"]').trigger('click')
    await flushPromises()

    expect(apiFetch).toHaveBeenNthCalledWith(1, '/internal-users', {
      query: {
        status: 'active',
        page: 1,
        limit: 100000,
        paginate: 100000,
      },
      authMode: 'internal',
    })
    expect(show).toHaveBeenCalledWith('ui.exportCompleted', 'success')
    expect(wrapper.emitted('actionSelect')).toEqual([['export-users']])

    await expect((wrapper.vm as typeof wrapper.vm & {
      handleActionSelect: (key: string) => Promise<void>
    }).handleActionSelect('export-users')).rejects.toThrow('export failed')
    expect((wrapper.vm as typeof wrapper.vm & {
      exporting: boolean
    }).exporting).toBe(false)
  })

  it('opens export history and renders empty state', async () => {
    const wrapper = mountControls()

    await wrapper.get('[data-testid="action-menu-item-user-export-history"]').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('actionSelect')).toEqual([['user-export-history']])
    expect(wrapper.text()).toContain('ui.noExportHistoryYet')
  })
})
