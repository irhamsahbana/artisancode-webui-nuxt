import { mount } from '@vue/test-utils'
import { defineComponent, h, reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { ButtonStub, InputStub, LabelStub } from '~/testing/component-stubs'
import { branchStatusOptionList, createEmptyBranchForm } from '../branch-form'
import BranchManageDialog from './branch-manage-dialog.vue'

const SearchableSelectStub = defineComponent({
  name: 'SearchableSelect',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    options: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    return () => h('select', {
      ...attrs,
      value: props.modelValue,
      onChange: (event: Event) => {
        emit('update:modelValue', (event.target as HTMLSelectElement).value)
      },
    }, (props.options as Array<{ value: string; label: string }>).map((option) =>
      h('option', { value: option.value }, option.label),
    ))
  },
})

const FormDialogShellStub = defineComponent({
  name: 'FormDialogShell',
  props: {
    title: {
      type: String,
      required: true,
    },
  },
  setup(props, { slots }) {
    return () => h('section', { 'data-testid': 'branch-manage-dialog' }, [
      h('h2', props.title),
      slots.default?.(),
      slots.footer?.(),
    ])
  },
})

const mountDialog = (overrides: Record<string, unknown> = {}) => {
  const form = reactive(createEmptyBranchForm())

  const wrapper = mount(BranchManageDialog, {
    props: {
      open: true,
      title: 'Edit branch',
      idPrefix: 'branch',
      statusOptions: branchStatusOptionList,
      submitLabel: 'Save changes',
      savingLabel: 'Saving',
      form,
      ...overrides,
    },
    global: {
      stubs: {
        Button: ButtonStub,
        Input: InputStub,
        Label: LabelStub,
        SearchableSelect: SearchableSelectStub,
        FormDialogShell: FormDialogShellStub,
      },
    },
  })

  return { wrapper, form }
}

describe('BranchManageDialog', () => {
  it('renders loading state and action labels', () => {
    const { wrapper } = mountDialog({ loading: true })

    expect(wrapper.text()).toContain('Edit branch')
    expect(wrapper.text()).toContain('ui.loading2')
    expect(wrapper.text()).toContain('Save changes')
  })

  it('binds form fields and emits close/submit actions', async () => {
    const { wrapper, form } = mountDialog()

    await wrapper.get('#branch-name').setValue('Branch C')
    await wrapper.get('#branch-city').setValue('Parepare')
    await wrapper.get('#branch-status').setValue('inactive')
    await wrapper.get('button').trigger('click')
    await wrapper.findAll('button')[1]?.trigger('click')

    expect(form.name).toBe('Branch C')
    expect(form.city).toBe('Parepare')
    expect(form.status).toBe('inactive')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })
})
