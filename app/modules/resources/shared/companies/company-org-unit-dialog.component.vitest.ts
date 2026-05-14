import { reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { ButtonStub, InputStub, LabelStub } from '~/testing/component-stubs'
import { mountWithRoleStubs } from '~/testing/component-test-utils'
import { createEmptyOrgUnitForm } from './company-org-unit'
import CompanyOrgUnitDialog from './company-org-unit-dialog.vue'

const SearchableSelectStub = {
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
  template: `
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
  `,
}

const FormDialogShellStub = {
  name: 'FormDialogShell',
  props: {
    title: {
      type: String,
      required: true,
    },
  },
  template: `
    <section data-testid="company-org-unit-dialog">
      <h2>{{ title }}</h2>
      <slot />
      <slot name="footer" />
    </section>
  `,
}

const mountDialog = (overrides: Record<string, unknown> = {}) => {
  const form = reactive(createEmptyOrgUnitForm())

  const wrapper = mountWithRoleStubs(CompanyOrgUnitDialog, {
    props: {
      open: true,
      mode: 'create',
      loading: false,
      categoryOptions: [
        { value: 'division', label: 'Division' },
        { value: 'department', label: 'Department' },
      ],
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

  return { form, wrapper }
}

describe('CompanyOrgUnitDialog', () => {
  it('renders localized title based on mode and parent label', () => {
    const { wrapper } = mountDialog({
      parentLabel: 'company.parentLabel',
    })

    expect(wrapper.get('[data-testid="company-org-unit-dialog"]').text()).toContain('company.createOrganizationUnit')
    expect(wrapper.text()).toContain('company.parentLabel')
  })

  it('binds form fields and emits close and submit actions', async () => {
    const { wrapper, form } = mountDialog({
      mode: 'edit',
    })

    await wrapper.get('#company-org-unit-code').setValue('DIV-02')
    await wrapper.get('#company-org-unit-name').setValue('Operations')
    await wrapper.get('#company-org-unit-category').setValue('department')
    await wrapper.findAll('button')[0]?.trigger('click')
    await wrapper.findAll('button')[1]?.trigger('click')

    expect(wrapper.text()).toContain('company.editOrganizationUnit')
    expect(form.code).toBe('DIV-02')
    expect(form.name).toBe('Operations')
    expect(form.category).toBe('department')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })
})
