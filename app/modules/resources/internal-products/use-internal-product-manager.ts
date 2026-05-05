import { computed, reactive, ref, shallowRef, watch } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'
import { normalizePriceAmountInput } from '~/utils/price-format'
import type {
  InternalCurrencyOption,
  InternalProduct,
  InternalProductForm,
  InternalProductPrice,
  InternalProductPriceForm,
  InternalProductPricing,
  InternalProductPricingForm,
  InternalProductStatus,
} from './types'

type DialogMode = 'create' | 'edit'
type EditorMode = 'create' | 'edit'

type ListResponse<T> = {
  items?: T[]
  meta?: Record<string, unknown>
}

const statusOptions = ['draft', 'active', 'inactive', 'archived'] as const satisfies readonly InternalProductStatus[]

const createEmptyProductForm = (): InternalProductForm => ({
  id: '',
  code: '',
  name: '',
  description: '',
  status: 'draft',
})

const createEmptyPricingForm = (): InternalProductPricingForm => ({
  id: '',
  internal_product_id: '',
  code: '',
  name: '',
  description: '',
  status: 'draft',
})

const createEmptyPriceForm = (): InternalProductPriceForm => ({
  id: '',
  internal_product_pricing_id: '',
  currency_code: '',
  amount: '',
  started_at: '',
  ended_at: '',
})

const applyFormValues = <T extends Record<string, unknown>>(target: T, source: T) => {
  Object.assign(target, source)
}

const toDateTimeLocalValue = (value: string | null | undefined) => {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  const timezoneOffset = parsed.getTimezoneOffset() * 60_000
  return new Date(parsed.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

const toIsoDateTime = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toISOString()
}

const extractResponseId = (value: unknown) => {
  if (!value || typeof value !== 'object' || !('id' in value)) {
    return ''
  }

  return typeof value.id === 'string' ? value.id : ''
}

export const useInternalProductManager = (onProductSaved: () => void) => {
  const { apiFetch } = useApi()
  const { show } = useBanner()
  const { t } = useLocale()

  const dialogOpen = ref(false)
  const dialogMode = ref<DialogMode>('create')
  const dialogLoading = ref(false)
  const productSaving = ref(false)
  const pricingsLoading = ref(false)
  const pricesLoading = ref(false)
  const pricingSaving = ref(false)
  const priceSaving = ref(false)
  const deletingPricingId = ref('')
  const deletingPriceId = ref('')
  const pricingEditorMode = ref<EditorMode>('create')
  const priceEditorMode = ref<EditorMode>('create')
  const selectedPricingId = ref('')
  const selectedPriceId = ref('')

  const productForm = reactive<InternalProductForm>(createEmptyProductForm())
  const pricingForm = reactive<InternalProductPricingForm>(createEmptyPricingForm())
  const priceForm = reactive<InternalProductPriceForm>(createEmptyPriceForm())

  const pricings = shallowRef<InternalProductPricing[]>([])
  const prices = shallowRef<InternalProductPrice[]>([])
  const activeCurrencies = shallowRef<InternalCurrencyOption[]>([])

  const statusOptionList = statusOptions.map((value) => ({
    value,
    label: value,
  }))
  const activeCurrencyOptions = computed(() => activeCurrencies.value.map(currency => ({
    value: currency.code,
    label: `${currency.code} - ${currency.name}`,
    decimalPlaces: currency.decimal_places,
  })))

  const hasSavedProduct = computed(() => productForm.id.length > 0)
  const selectedPricing = computed(() => (
    pricings.value.find((item) => item.id === selectedPricingId.value) ?? null
  ))
  const selectedPrice = computed(() => (
    prices.value.find((item) => item.id === selectedPriceId.value) ?? null
  ))

  const resetProductForm = () => {
    applyFormValues(productForm, createEmptyProductForm())
  }

  const resetPricingForm = () => {
    applyFormValues(pricingForm, createEmptyPricingForm())
    pricingForm.internal_product_id = productForm.id
    pricingEditorMode.value = 'create'
  }

  const applyPricingToForm = (pricing: InternalProductPricing) => {
    pricingEditorMode.value = 'edit'
    applyFormValues(pricingForm, {
      id: pricing.id,
      internal_product_id: pricing.internal_product_id,
      code: pricing.code,
      name: pricing.name,
      description: pricing.description,
      status: statusOptions.includes(pricing.status as InternalProductStatus)
        ? pricing.status as InternalProductStatus
        : 'draft',
    })
  }

  const resetPriceForm = () => {
    applyFormValues(priceForm, createEmptyPriceForm())
    priceForm.internal_product_pricing_id = selectedPricingId.value
    priceEditorMode.value = 'create'
  }

  const applyPriceToForm = (price: InternalProductPrice) => {
    priceEditorMode.value = 'edit'
    applyFormValues(priceForm, {
      id: price.id,
      internal_product_pricing_id: price.internal_product_pricing_id,
      currency_code: price.currency_code,
      amount: price.amount,
      started_at: toDateTimeLocalValue(price.started_at),
      ended_at: toDateTimeLocalValue(price.ended_at),
    })
  }

  const resetCollections = () => {
    pricings.value = []
    prices.value = []
    selectedPricingId.value = ''
    selectedPriceId.value = ''
  }

  const closeDialog = () => {
    dialogOpen.value = false
    dialogLoading.value = false
    productSaving.value = false
    pricingsLoading.value = false
    pricesLoading.value = false
    pricingSaving.value = false
    priceSaving.value = false
    deletingPricingId.value = ''
    deletingPriceId.value = ''
    resetCollections()
    resetProductForm()
    resetPricingForm()
    resetPriceForm()
  }

  const loadProduct = async (id: string) => {
    const response = await apiFetch<InternalProduct>(`/internal-products/${id}`, {
      authMode: 'internal',
    })

    if (!response.success || !response.data) {
      return false
    }

    applyFormValues(productForm, {
      id: response.data.id,
      code: response.data.code,
      name: response.data.name,
      description: response.data.description,
      status: statusOptions.includes(response.data.status as InternalProductStatus)
        ? response.data.status as InternalProductStatus
        : 'draft',
    })
    pricingForm.internal_product_id = response.data.id

    return true
  }

  const loadPricings = async (productId: string) => {
    pricingsLoading.value = true

    const response = await apiFetch<ListResponse<InternalProductPricing>>(`/internal-products/${productId}/pricings`, {
      authMode: 'internal',
    })

    pricingsLoading.value = false

    if (!response.success || !response.data) {
      pricings.value = []
      selectedPricingId.value = ''
      prices.value = []
      resetPricingForm()
      resetPriceForm()
      return
    }

    pricings.value = response.data.items ?? []

    if (selectedPricingId.value && pricings.value.some((item) => item.id === selectedPricingId.value)) {
      return
    }

    selectedPricingId.value = pricings.value[0]?.id ?? ''
  }

  const loadPrices = async (pricingId: string) => {
    if (!pricingId) {
      prices.value = []
      resetPriceForm()
      return
    }

    pricesLoading.value = true

    const response = await apiFetch<ListResponse<InternalProductPrice>>(`/internal-products/pricings/${pricingId}/prices`, {
      authMode: 'internal',
    })

    pricesLoading.value = false

    if (!response.success || !response.data) {
      prices.value = []
      selectedPriceId.value = ''
      resetPriceForm()
      return
    }

    prices.value = response.data.items ?? []

    if (selectedPriceId.value && prices.value.some((item) => item.id === selectedPriceId.value)) {
      return
    }

    selectedPriceId.value = prices.value[0]?.id ?? ''

    if (!priceForm.internal_product_pricing_id || priceEditorMode.value === 'create') {
      priceForm.internal_product_pricing_id = pricingId
    }
  }

  const loadActiveCurrencies = async () => {
    const response = await apiFetch<ListResponse<InternalCurrencyOption>>('/internal-currencies', {
      authMode: 'internal',
      query: {
        is_active: true,
        page: 1,
        paginate: 100,
      },
    })

    if (!response.success || !response.data) {
      activeCurrencies.value = []
      return
    }

    activeCurrencies.value = response.data.items ?? []
  }

  const openCreateDialog = () => {
    closeDialog()
    dialogMode.value = 'create'
    dialogOpen.value = true
    pricingForm.internal_product_id = ''
    void loadActiveCurrencies()
  }

  const openEditDialog = async (id: string) => {
    closeDialog()
    dialogMode.value = 'edit'
    dialogOpen.value = true
    dialogLoading.value = true

    const loaded = await loadProduct(id)
    if (loaded) {
      await loadActiveCurrencies()
      await loadPricings(id)
    }

    dialogLoading.value = false
  }

  watch(selectedPricingId, async (pricingId) => {
    selectedPriceId.value = ''
    resetPriceForm()
    if (!pricingId) {
      prices.value = []
      return
    }

    await loadPrices(pricingId)
  })

  watch(selectedPricing, (pricing) => {
    if (!pricing) {
      resetPricingForm()
      return
    }

    applyPricingToForm(pricing)
  })

  watch(selectedPrice, (price) => {
    if (!price) {
      resetPriceForm()
      return
    }

    applyPriceToForm(price)
  })

  const validateProductForm = () => {
    if (!productForm.code.trim()) {
      show(t('ui.codeIsRequired'), 'error')
      return false
    }

    if (!productForm.name.trim()) {
      show(t('ui.nameIsRequired'), 'error')
      return false
    }

    if (!statusOptions.includes(productForm.status)) {
      show(t('ui.statusIsInvalid'), 'error')
      return false
    }

    return true
  }

  const submitProduct = async () => {
    if (!validateProductForm()) {
      return
    }

    const wasCreate = dialogMode.value === 'create'
    productSaving.value = true

    const payload = {
      code: productForm.code.trim(),
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      status: productForm.status,
      metadata: {},
    }

    const response = wasCreate
      ? await apiFetch<{ id: string }>('/internal-products', {
          method: 'POST',
          body: payload,
          authMode: 'internal',
        })
      : await apiFetch(`/internal-products/${productForm.id}`, {
          method: 'PUT',
          body: payload,
          authMode: 'internal',
        })

    productSaving.value = false

    if (!response.success) {
      return
    }

    if (wasCreate) {
      const nextId = extractResponseId(response.data)
      if (nextId.length > 0) {
        dialogMode.value = 'edit'
        productForm.id = nextId
        pricingForm.internal_product_id = nextId
        await loadPricings(nextId)
      }
    }

    show(
      wasCreate
        ? t('ui.internalProductCreatedSuccessfully')
        : t('ui.internalProductUpdatedSuccessfully'),
      'success',
    )
    onProductSaved()
  }

  const selectPricing = (pricingId: string) => {
    selectedPricingId.value = pricingId
  }

  const startCreatePricing = () => {
    selectedPricingId.value = ''
    resetPricingForm()
  }

  const startEditPricing = (pricing: InternalProductPricing) => {
    applyPricingToForm(pricing)
    selectPricing(pricing.id)
  }

  const validatePricingForm = () => {
    if (!hasSavedProduct.value) {
      show(t('ui.saveProductFirstToManagePricingsAndPrices'), 'error')
      return false
    }

    if (!pricingForm.code.trim()) {
      show(t('ui.codeIsRequired'), 'error')
      return false
    }

    if (!pricingForm.name.trim()) {
      show(t('ui.nameIsRequired'), 'error')
      return false
    }

    if (!statusOptions.includes(pricingForm.status)) {
      show(t('ui.statusIsInvalid'), 'error')
      return false
    }

    return true
  }

  const submitPricing = async () => {
    if (!validatePricingForm()) {
      return
    }

    pricingSaving.value = true

    const payload = {
      internal_product_id: productForm.id,
      code: pricingForm.code.trim(),
      name: pricingForm.name.trim(),
      description: pricingForm.description.trim(),
      status: pricingForm.status,
      metadata: {},
    }

    const response = pricingEditorMode.value === 'create'
      ? await apiFetch<{ id: string }>(`/internal-products/${productForm.id}/pricings`, {
          method: 'POST',
          body: payload,
          authMode: 'internal',
        })
      : await apiFetch(`/internal-products/pricings/${pricingForm.id}`, {
          method: 'PUT',
          body: payload,
          authMode: 'internal',
        })

    pricingSaving.value = false

    if (!response.success) {
      return
    }

    const createdPricingId = pricingEditorMode.value === 'create'
      ? extractResponseId(response.data)
      : pricingForm.id

    show(
      pricingEditorMode.value === 'create'
        ? t('ui.pricingCreatedSuccessfully')
        : t('ui.pricingUpdatedSuccessfully'),
      'success',
    )

    resetPricingForm()
    await loadPricings(productForm.id)
    if (createdPricingId) {
      selectedPricingId.value = createdPricingId
    }
  }

  const deletePricing = async (pricing: InternalProductPricing) => {
    if (!confirm(t('ui.deleteThisPricingAndItsLinkedPriceSetup'))) {
      return
    }

    deletingPricingId.value = pricing.id
    const response = await apiFetch(`/internal-products/pricings/${pricing.id}`, {
      method: 'DELETE',
      authMode: 'internal',
    })
    deletingPricingId.value = ''

    if (!response.success) {
      return
    }

    show(t('ui.pricingDeletedSuccessfully'), 'success')

    if (pricingForm.id === pricing.id) {
      resetPricingForm()
    }

    if (selectedPricingId.value === pricing.id) {
      selectedPricingId.value = ''
      prices.value = []
      resetPriceForm()
    }

    await loadPricings(productForm.id)
  }

  const startCreatePrice = () => {
    selectedPriceId.value = ''
    resetPriceForm()
  }

  const selectPrice = (priceId: string) => {
    selectedPriceId.value = priceId
  }

  const startEditPrice = (price: InternalProductPrice) => {
    applyPriceToForm(price)
    selectPrice(price.id)
  }

  const validatePriceForm = () => {
    if (!selectedPricingId.value) {
      show(t('ui.selectAPricingToManageItsPrices'), 'error')
      return false
    }

    if (!priceForm.currency_code.trim()) {
      show(t('ui.currencyCodeIsRequired'), 'error')
      return false
    }

    if (!priceForm.amount.trim()) {
      show(t('ui.amountIsRequired'), 'error')
      return false
    }

    if (!priceForm.started_at.trim()) {
      show(t('ui.startTimeIsRequired'), 'error')
      return false
    }

    const startedAtIso = toIsoDateTime(priceForm.started_at)
    if (!startedAtIso) {
      show(t('ui.startTimeIsInvalid'), 'error')
      return false
    }

    if (priceForm.ended_at.trim() && !toIsoDateTime(priceForm.ended_at)) {
      show(t('ui.endTimeIsInvalid'), 'error')
      return false
    }

    return true
  }

  const submitPrice = async () => {
    if (!validatePriceForm()) {
      return
    }
    if (!activeCurrencies.value.length) {
      show(t('billingSettings.currencies.noActiveCurrency'), 'error')
      return
    }

    const startedAtIso = toIsoDateTime(priceForm.started_at)
    const endedAtIso = priceForm.ended_at.trim() ? toIsoDateTime(priceForm.ended_at) : ''
    const selectedCurrency = activeCurrencies.value.find(c => c.code === priceForm.currency_code)
    const normalizedAmount = normalizePriceAmountInput(priceForm.amount, selectedCurrency?.decimal_places ?? 0)

    priceSaving.value = true

    const payload = {
      internal_product_pricing_id: selectedPricingId.value,
      currency_code: priceForm.currency_code.trim().toUpperCase(),
      amount: normalizedAmount,
      started_at: startedAtIso,
      ended_at: endedAtIso || null,
      metadata: {},
    }

    const response = priceEditorMode.value === 'create'
      ? await apiFetch<{ id: string }>(`/internal-products/pricings/${selectedPricingId.value}/prices`, {
          method: 'POST',
          body: payload,
          authMode: 'internal',
        })
      : await apiFetch(`/internal-products/prices/${priceForm.id}`, {
          method: 'PUT',
          body: payload,
          authMode: 'internal',
        })

    priceSaving.value = false

    if (!response.success) {
      return
    }

    const activePriceId = priceEditorMode.value === 'create'
      ? extractResponseId(response.data)
      : priceForm.id

    show(
      priceEditorMode.value === 'create'
        ? t('ui.priceCreatedSuccessfully')
        : t('ui.priceUpdatedSuccessfully'),
      'success',
    )

    resetPriceForm()
    await loadPrices(selectedPricingId.value)
    if (activePriceId) {
      selectedPriceId.value = activePriceId
    }
  }

  const deletePrice = async (price: InternalProductPrice) => {
    if (!confirm(t('ui.deleteThisPricePoint'))) {
      return
    }

    deletingPriceId.value = price.id
    const response = await apiFetch(`/internal-products/prices/${price.id}`, {
      method: 'DELETE',
      authMode: 'internal',
    })
    deletingPriceId.value = ''

    if (!response.success) {
      return
    }

    show(t('ui.priceDeletedSuccessfully'), 'success')

    if (priceForm.id === price.id) {
      resetPriceForm()
    }

    if (selectedPriceId.value === price.id) {
      selectedPriceId.value = ''
    }

    await loadPrices(selectedPricingId.value)
  }

  return {
    closeDialog,
    deletePrice,
    deletePricing,
    deletingPriceId,
    deletingPricingId,
    dialogLoading,
    dialogMode,
    dialogOpen,
    activeCurrencyOptions,
    hasSavedProduct,
    openCreateDialog,
    openEditDialog,
    priceEditorMode,
    priceForm,
    priceSaving,
    prices,
    pricesLoading,
    pricingEditorMode,
    pricingForm,
    pricingSaving,
    pricings,
    pricingsLoading,
    productForm,
    productSaving,
    resetPriceForm,
    resetPricingForm,
    selectPrice,
    selectPricing,
    selectedPrice,
    selectedPriceId,
    selectedPricing,
    selectedPricingId,
    startCreatePrice,
    startCreatePricing,
    startEditPrice,
    startEditPricing,
    statusOptionList,
    submitPrice,
    submitPricing,
    submitProduct,
  }
}
