import { reactive, ref, computed } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'

type DialogMode = 'create' | 'edit'

type CurrencyItem = {
  code: string
  name: string
  symbol: string
  decimal_places: number
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

type CurrencyForm = {
  code: string
  name: string
  symbol: string
  decimal_places: number
  is_active: boolean
  is_default: boolean
}

const createEmptyForm = (): CurrencyForm => ({
  code: '',
  name: '',
  symbol: '',
  decimal_places: 2,
  is_active: false,
  is_default: false,
})

export const useInternalCurrencyManager = (onSaved: () => void) => {
  const { apiFetch } = useApi()
  const { show } = useBanner()

  const dialogOpen = ref(false)
  const dialogMode = ref<DialogMode>('create')
  const dialogLoading = ref(false)
  const saving = ref(false)
  const form = reactive<CurrencyForm>(createEmptyForm())

  const submitLabel = computed(() =>
    dialogMode.value === 'create' ? 'billingSettings.currencies.add' : 'common.save',
  )

  const openCreateDialog = () => {
    dialogMode.value = 'create'
    const empty = createEmptyForm()
    Object.assign(form, empty)
    dialogOpen.value = true
  }

  const openEditDialog = (currency: CurrencyItem) => {
    dialogMode.value = 'edit'
    form.code = currency.code
    form.name = currency.name
    form.symbol = currency.symbol
    form.decimal_places = currency.decimal_places
    form.is_active = currency.is_active
    form.is_default = currency.is_default
    dialogLoading.value = false
    saving.value = false
    dialogOpen.value = true
  }

  const closeDialog = () => {
    dialogOpen.value = false
  }

  const submitForm = async () => {
    saving.value = true
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      symbol: form.symbol.trim(),
      decimal_places: Number(form.decimal_places),
      is_active: form.is_default ? true : form.is_active,
      is_default: form.is_default,
    }

    const response = dialogMode.value === 'create'
      ? await apiFetch('/internal-currencies', {
          method: 'POST',
          authMode: 'internal',
          body: payload,
        })
      : await apiFetch(`/internal-currencies/${form.code}`, {
          method: 'PUT',
          authMode: 'internal',
          body: payload,
        })
    saving.value = false

    if (!response.success) {
      show(response.message || 'Failed to save currency.', 'error')
      return
    }

    dialogOpen.value = false
    onSaved()
  }

  const toggleActive = async (currency: CurrencyItem) => {
    if (currency.is_default && currency.is_active) {
      return
    }

    const response = await apiFetch(`/internal-currencies/${currency.code}`, {
      method: 'PUT',
      authMode: 'internal',
      body: {
        name: currency.name,
        symbol: currency.symbol,
        decimal_places: currency.decimal_places,
        is_active: !currency.is_active,
        is_default: currency.is_default,
      },
    })

    if (!response.success) {
      show(response.message || 'Failed to save currency.', 'error')
      return
    }

    onSaved()
  }

  const setDefault = async (currency: CurrencyItem) => {
    const response = await apiFetch(`/internal-currencies/${currency.code}`, {
      method: 'PUT',
      authMode: 'internal',
      body: {
        name: currency.name,
        symbol: currency.symbol,
        decimal_places: currency.decimal_places,
        is_active: true,
        is_default: true,
      },
    })

    if (!response.success) {
      show(response.message || 'Failed to save currency.', 'error')
      return
    }

    onSaved()
  }

  return {
    dialogOpen,
    dialogMode,
    dialogLoading,
    saving,
    form,
    submitLabel,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    submitForm,
    toggleActive,
    setDefault,
  }
}
