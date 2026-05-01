import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import { mountWithRoleStubs } from '~/testing/component-test-utils'
import InternalResourceFilterPanel from './internal-resource-filter-panel.vue'

const FloatingFilterPanelStub = defineComponent({
  name: 'FloatingFilterPanel',
  props: {
    open: {
      type: Boolean,
      default: false,
    },
    closeLabel: {
      type: String,
      default: '',
    },
  },
  emits: ['close'],
  setup(props, { emit, slots }) {
    return () => h('section', {
      'data-testid': 'internal-filter-panel',
      'data-open': String(props.open),
    }, [
      h('button', {
        'data-testid': 'internal-filter-close',
        onClick: () => emit('close'),
      }, props.closeLabel),
      slots.default?.(),
    ])
  },
})

const mountPanel = (overrides: Record<string, unknown> = {}) => mountWithRoleStubs(InternalResourceFilterPanel, {
  props: {
    open: true,
    ...overrides,
  },
  slots: {
    default: '<div data-testid="internal-filter-slot">content</div>',
  },
  global: {
    stubs: {
      FloatingFilterPanel: FloatingFilterPanelStub,
    },
  },
})

describe('InternalResourceFilterPanel', () => {
  it('renders localized labels and projected content', () => {
    const wrapper = mountPanel()

    expect(wrapper.get('[data-testid="internal-filter-panel"]').attributes('data-open')).toBe('true')
    expect(wrapper.text()).toContain('ui.filters')
    expect(wrapper.text()).toContain('ui.clearFilter')
    expect(wrapper.text()).toContain('ui.submit')
    expect(wrapper.get('[data-testid="internal-filter-slot"]').text()).toBe('content')
  })

  it('emits clear separately and requests the panel to close from close and apply actions', async () => {
    const closeWrapper = mountPanel()
    const clearWrapper = mountPanel()
    const applyWrapper = mountPanel()

    const clearButton = clearWrapper.findAll('button').find(button => button.text() === 'ui.clearFilter')
    const applyButton = applyWrapper.findAll('button').find(button => button.text() === 'ui.submit')

    await closeWrapper.get('[data-testid="internal-filter-close"]').trigger('click')
    expect(clearButton).toBeDefined()
    await clearButton!.trigger('click')
    expect(applyButton).toBeDefined()
    await applyButton!.trigger('click')

    expect(closeWrapper.emitted('update:open')).toEqual([[false]])
    expect(clearWrapper.emitted('clear')).toHaveLength(1)
    expect(clearWrapper.emitted('update:open')).toBeUndefined()
    expect(applyWrapper.emitted('update:open')).toEqual([[false]])
  })
})
