import { computed, ref } from 'vue'
import { formatMoneyAmount } from '~/utils/price-format'
import {
  buildCustomerPayload,
  createEmptyCustomerForm,
  syncCustomerForm,
  type CustomerDetail,
} from './customer-form'
import {
  createCustomerCompanyOption,
  fetchCustomerCompanyOptions,
} from '../customer-companies/customer-company-options'

type CategoryOption = {
  id: string
  name: string
}

export const useCustomersPage = () => {
  const { apiFetch } = useApi()
  const { show } = useBanner()
  const { locale, t } = useLocale()

  const deleteLabelFormatter = (row: Record<string, unknown>) => {
    const name = row.display_name
    if (typeof name === 'string' && name.length > 0) {
      return name
    }
    return String(row.id ?? '-')
  }

  const formatEntityType = (value: unknown) => {
    return value === 'individual' ? t('ui.individual') : t('company.company')
  }

  const formatCustomerStatus = (value: unknown) => {
    if (value === 'active') return t('ui.active')
    if (value === 'inactive') return t('ui.inactive')
    return t('ui.prospect')
  }

  const formatLevel = (value: unknown) => {
    if (value === 'high') return t('ui.high')
    if (value === 'low') return t('ui.low')
    return t('ui.medium')
  }

  const formatContractBefore = (value: unknown) => value === true ? t('ui.yes') : t('ui.no')

  const formatContractValue = (value: unknown) => {
    if (value == null || value === '') {
      return '-'
    }
    return formatMoneyAmount(
      typeof value === 'number' || typeof value === 'string' ? value : null,
      'IDR',
      locale.value,
    )
  }

  const columns = computed(() => [
    { key: 'display_name', label: t('ui.customers') },
    { key: 'customer_entity_type', label: t('ui.customerEntityType'), format: formatEntityType },
    { key: 'customer_type_name', label: t('ui.customerTypes') },
    { key: 'area_name', label: t('ui.areas') },
    { key: 'customer_status', label: t('ui.customerStatus'), format: formatCustomerStatus },
    { key: 'has_contract_before', label: t('ui.hasContractBefore'), format: formatContractBefore },
    { key: 'last_contract_value', label: t('ui.lastContractValue'), format: formatContractValue },
    { key: 'primary_contact_name', label: t('ui.primaryContactName') },
    { key: 'whatsapp_number', label: t('ui.whatsappNumber') },
    { key: 'potential_level', label: t('ui.potentialLevel'), format: formatLevel },
  ])

  const refreshKey = ref(0)
  const modalOpen = ref(false)
  const modalMode = ref<'create' | 'edit'>('create')
  const modalLoading = ref(false)
  const submitLoading = ref(false)

  const customerTypeOptions = ref<CategoryOption[]>([])
  const segmentOptions = ref<CategoryOption[]>([])
  const areaOptions = ref<CategoryOption[]>([])
  const relationshipStatusOptions = ref<CategoryOption[]>([])

  const form = ref(createEmptyCustomerForm())

  const resetForm = () => {
    form.value = createEmptyCustomerForm()
  }

  const triggerRefresh = () => {
    refreshKey.value += 1
  }

  const createCategoryOptions = (items: CategoryOption[]) =>
    items.map(item => ({ value: item.id, label: item.name }))

  const customerTypeSelectOptions = computed(() => createCategoryOptions(customerTypeOptions.value))
  const segmentSelectOptions = computed(() => createCategoryOptions(segmentOptions.value))
  const areaSelectOptions = computed(() => createCategoryOptions(areaOptions.value))
  const relationshipStatusSelectOptions = computed(() => createCategoryOptions(relationshipStatusOptions.value))

  const entityTypeOptions = computed(() => [
    { value: 'company', label: t('company.company') },
    { value: 'individual', label: t('ui.individual') },
  ])

  const customerStatusOptions = computed(() => [
    { value: 'prospect', label: t('ui.prospect') },
    { value: 'active', label: t('ui.active') },
    { value: 'inactive', label: t('ui.inactive') },
  ])

  const levelOptions = computed(() => [
    { value: 'high', label: t('ui.high') },
    { value: 'medium', label: t('ui.medium') },
    { value: 'low', label: t('ui.low') },
  ])

  const fetchCompanyNameOptions = (query: string, page: number) => fetchCustomerCompanyOptions(apiFetch, query, page)
  const createCompanyNameOption = async (query: string) => {
    const created = await createCustomerCompanyOption(apiFetch, query)
    if (created) {
      show(t('ui.categoryCreatedSuccessfully'), 'success')
    }
    return created
  }

  const loadCategoryGroup = async (group: string) => {
    const response = await apiFetch<{ items?: CategoryOption[] }>('/categories', {
      query: {
        group,
        limit: 200,
        paginate: 200,
      },
    })

    if (!response.success || !response.data) {
      return []
    }

    return response.data.items ?? []
  }

  const loadOptions = async () => {
    const [customerTypes, segments, areas, relationshipStatuses] = await Promise.all([
      loadCategoryGroup('customer_type'),
      loadCategoryGroup('segment'),
      loadCategoryGroup('area'),
      loadCategoryGroup('relationship_status'),
    ])

    customerTypeOptions.value = customerTypes
    segmentOptions.value = segments
    areaOptions.value = areas
    relationshipStatusOptions.value = relationshipStatuses
  }

  const openCreateModal = async () => {
    resetForm()
    modalMode.value = 'create'
    modalOpen.value = true
    await loadOptions()
  }

  const openEditModal = async (row: Record<string, unknown>) => {
    resetForm()
    modalMode.value = 'edit'
    modalOpen.value = true
    modalLoading.value = true

    try {
      await loadOptions()

      const id = String(row.id ?? '')
      const response = await apiFetch<CustomerDetail>(`/customers/${id}`)
      if (response.success && response.data) {
        syncCustomerForm(form.value, response.data)
      }
    }
    finally {
      modalLoading.value = false
    }
  }

  const closeModal = () => {
    modalOpen.value = false
    modalLoading.value = false
    submitLoading.value = false
    resetForm()
  }

  const validateForm = () => {
    const result = buildCustomerPayload(form.value)
    if (result.error === 'display_name') {
      show(t('ui.nameIsRequired'), 'error')
      return false
    }
    if (result.error === 'last_contract_value') {
      show(t('ui.lastContractValueMustBeValid'), 'error')
      return false
    }
    if (result.error === 'last_contract_year') {
      show(t('ui.lastContractYearMustBeValid'), 'error')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    const result = buildCustomerPayload(form.value)
    if (!validateForm() || !result.payload) {
      return
    }

    submitLoading.value = true

    try {
      if (modalMode.value === 'create') {
        const response = await apiFetch('/customers', {
          method: 'POST',
          body: result.payload,
        })
        if (response.success) {
          show(t('ui.customerCreatedSuccessfully'), 'success')
          closeModal()
          triggerRefresh()
        }
      }
      else {
        const response = await apiFetch(`/customers/${form.value.id}`, {
          method: 'PUT',
          body: result.payload,
        })
        if (response.success) {
          show(t('ui.customerUpdatedSuccessfully'), 'success')
          closeModal()
          triggerRefresh()
        }
      }
    }
    finally {
      submitLoading.value = false
    }
  }

  return {
    columns,
    createCompanyNameOption,
    customerStatusOptions,
    customerTypeSelectOptions,
    deleteLabelFormatter,
    entityTypeOptions,
    fetchCompanyNameOptions,
    form,
    handleSubmit,
    levelOptions,
    modalLoading,
    modalMode,
    modalOpen,
    openCreateModal,
    openEditModal,
    areaSelectOptions,
    closeModal,
    refreshKey,
    relationshipStatusSelectOptions,
    segmentSelectOptions,
    submitLoading,
  }
}
