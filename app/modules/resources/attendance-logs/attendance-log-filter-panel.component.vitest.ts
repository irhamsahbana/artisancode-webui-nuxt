import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import AttendanceLogFilterPanel from './attendance-log-filter-panel.vue'

const ButtonStub = defineComponent({
  name: 'Button',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h('button', attrs, slots.default?.())
  },
})

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
    return () => h('div', {
      'data-testid': 'floating-filter-panel',
      'data-open': String(props.open),
    }, [
      h('button', {
        'data-testid': 'floating-filter-close',
        onClick: () => emit('close'),
      }, props.closeLabel),
      slots.default?.(),
    ])
  },
})

const SearchableSelectStub = defineComponent({
  name: 'SearchableSelect',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('button', {
      type: 'button',
      'data-testid': `searchable-select-${props.placeholder}`,
      onClick: () => emit('update:modelValue', `${props.placeholder}-value`),
    }, props.placeholder)
  },
})

const DateRangePickerStub = defineComponent({
  name: 'DateRangePicker',
  emits: ['update:from', 'update:to'],
  setup(_, { emit }) {
    return () => h('div', [
      h('button', {
        type: 'button',
        'data-testid': 'date-range-from',
        onClick: () => emit('update:from', '2026-05-01'),
      }),
      h('button', {
        type: 'button',
        'data-testid': 'date-range-to',
        onClick: () => emit('update:to', '2026-05-02'),
      }),
    ])
  },
})

const mountPanel = (overrides = {}) => mount(AttendanceLogFilterPanel, {
  props: {
    open: true,
    filters: {
      date_from: '',
      date_to: '',
      type: '',
      source: '',
      employee_id: '',
      status: '',
      selfie_status: '',
      org_unit_id: '',
      branch_id: '',
      work_location_id: '',
      exception_type: '',
    },
    options: {
      employeeOptions: [{ value: '', label: 'All employees' }],
      statusOptions: [
        { value: '', label: 'All statuses' },
        { value: 'recorded', label: 'Recorded' },
      ],
      typeOptions: [{ value: '', label: 'All types' }],
      sourceOptions: [{ value: '', label: 'All sources' }],
      selfieOptions: [{ value: '', label: 'All photo states' }],
      orgUnitOptions: [{ value: '', label: 'All org units' }],
      branchOptions: [{ value: '', label: 'All branches' }],
      workLocationOptions: [{ value: '', label: 'All work locations' }],
      exceptionOptions: [{ value: '', label: 'All exceptions' }],
    },
    isDatePresetActive: (preset: string) => preset === 'today',
    ...overrides,
  },
  global: {
    stubs: {
      Button: ButtonStub,
      DateRangePicker: DateRangePickerStub,
      FloatingFilterPanel: FloatingFilterPanelStub,
      SearchableSelect: SearchableSelectStub,
    },
  },
})

describe('AttendanceLogFilterPanel', () => {
  it('passes open state through the floating panel wrapper and emits close actions', async () => {
    const wrapper = mountPanel()

    expect(wrapper.get('[data-testid="floating-filter-panel"]').attributes('data-open')).toBe('true')

    await wrapper.get('[data-testid="floating-filter-close"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits preset, date, select, status, and clear actions through its public contract', async () => {
    const wrapper = mountPanel()
    const buttons = wrapper.findAll('button')
    const todayButton = buttons.find(button => button.text() === 'ui.today')
    const recordedButton = buttons.find(button => button.text() === 'Recorded')
    const clearButton = buttons.find(button => button.text() === 'ui.clearFilter')

    expect(todayButton).toBeDefined()
    await todayButton!.trigger('click')
    await wrapper.get('[data-testid="date-range-from"]').trigger('click')
    await wrapper.get('[data-testid="date-range-to"]').trigger('click')
    await wrapper.get('[data-testid="searchable-select-ui.employee"]').trigger('click')
    expect(recordedButton).toBeDefined()
    await recordedButton!.trigger('click')
    await wrapper.get('[data-testid="searchable-select-ui.allTypes"]').trigger('click')
    expect(clearButton).toBeDefined()
    await clearButton!.trigger('click')

    expect(wrapper.emitted('applyDatePreset')).toEqual([['today']])
    expect(wrapper.emitted('updateFilter')).toEqual([
      ['date_from', '2026-05-01'],
      ['date_to', '2026-05-02'],
      ['employee_id', 'ui.employee-value'],
      ['status', 'recorded'],
      ['type', 'ui.allTypes-value'],
    ])
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })
})
