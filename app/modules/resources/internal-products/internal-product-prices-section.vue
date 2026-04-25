<script setup lang="ts">
import { computed } from 'vue'
import { useDateTime } from '~/composables/useDateTime'
import {
  formatPriceAmountInput,
  isPriceAmountDraftValid,
  normalizeLocalizedPriceAmountInput,
} from './price-format'
import type { InternalProductPrice, InternalProductPriceForm, InternalProductPricing } from './types'

defineOptions({ name: 'InternalProductPricesSection' })

const model = defineModel<InternalProductPriceForm>({ required: true })

const props = defineProps<{
  enabled: boolean
  items: InternalProductPrice[]
  loading: boolean
  saving: boolean
  deletingId: string
  formMode: 'create' | 'edit'
  selectedPriceId: string
  selectedPricing: InternalProductPricing | null
}>()

const emit = defineEmits<{
  delete: [price: InternalProductPrice]
  select: [priceId: string]
  startCreate: []
  submit: []
}>()

const { locale, t, text: uiText } = useLocale()
const { formatReadableDateTime } = useDateTime()

const formTitle = computed(() => (
  props.formMode === 'edit'
    ? uiText('Edit Price')
    : uiText('Add Price')
))

const formDescription = computed(() => (
  props.formMode === 'edit'
    ? uiText('Changes are applied to the selected price entry.')
    : uiText('Create a new price entry for the selected pricing package.')
))

const resetLabel = computed(() => (
  props.formMode === 'edit'
    ? uiText('Create New Price')
    : uiText('Clear Form')
))

const submitLabel = computed(() => (
  props.saving
    ? uiText('Saving...')
    : formTitle.value
))

const baseCurrencyOptions = ['IDR', 'USD', 'SGD', 'EUR'] as const

const selectedPrice = computed(() => (
  props.items.find((item) => item.id === props.selectedPriceId) ?? null
))

const currencyOptions = computed(() => {
  const selectedCurrency = model.value.currency_code.trim().toUpperCase()
  const values = selectedCurrency && !baseCurrencyOptions.includes(selectedCurrency as typeof baseCurrencyOptions[number])
    ? [selectedCurrency, ...baseCurrencyOptions]
    : [...baseCurrencyOptions]

  return values.map((value) => ({
    value,
    label: baseCurrencyOptions.includes(value as typeof baseCurrencyOptions[number])
      ? t(`internalProducts.prices.currencyOptions.${value}`)
      : value,
  }))
})

const amountInput = computed({
  get: () => formatPriceAmountInput(model.value.amount, locale.value),
  set: (value: string) => {
    model.value.amount = normalizeLocalizedPriceAmountInput(value, locale.value)
  },
})

const buildAmountInputValue = (target: HTMLInputElement, value: string) => {
  const selectionStart = target.selectionStart ?? target.value.length
  const selectionEnd = target.selectionEnd ?? target.value.length

  return `${target.value.slice(0, selectionStart)}${value}${target.value.slice(selectionEnd)}`
}

const syncAmountInputElement = (target: HTMLInputElement, value: string) => {
  amountInput.value = value
  target.value = amountInput.value
}

const handleAmountBeforeInput = (event: InputEvent) => {
  if (event.inputType.startsWith('delete')) {
    return
  }

  const target = event.target
  if (!(target instanceof HTMLInputElement)) {
    return
  }

  const nextValue = buildAmountInputValue(target, event.data ?? '')
  if (!isPriceAmountDraftValid(nextValue, locale.value)) {
    event.preventDefault()
  }
}

const handleAmountInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  syncAmountInputElement(target, target.value)
}

const handleAmountPaste = (event: ClipboardEvent) => {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) {
    return
  }

  const pastedValue = event.clipboardData?.getData('text') ?? ''
  const nextValue = buildAmountInputValue(target, pastedValue)

  if (isPriceAmountDraftValid(nextValue, locale.value)) {
    return
  }

  event.preventDefault()
  syncAmountInputElement(target, nextValue)
}

const handleAmountBlur = (event: FocusEvent) => {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) {
    return
  }

  target.value = amountInput.value
}

const formatAmount = (price: InternalProductPrice) => {
  const amount = Number(price.amount)
  if (!Number.isFinite(amount)) {
    return `${price.currency_code} ${price.amount}`
  }

  try {
    return new Intl.NumberFormat(locale.value === 'en' ? 'en-US' : 'id-ID', {
      style: 'currency',
      currency: price.currency_code,
      maximumFractionDigits: 6,
    }).format(amount)
  } catch {
    return `${price.currency_code} ${price.amount}`
  }
}

const formatRangeValue = (value: string | null) => {
  if (!value) {
    return uiText('No end date')
  }

  return formatReadableDateTime(value, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }, '-')
}

const formatEditorDateTime = (value: string) => {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toLocaleString(locale.value === 'en' ? 'en-US' : 'id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const startedAtPreview = computed(() => (
  model.value.started_at
    ? formatEditorDateTime(model.value.started_at)
    : t('internalProducts.prices.effectiveStartHint')
))

const endedAtPreview = computed(() => (
  model.value.ended_at
    ? formatEditorDateTime(model.value.ended_at)
    : t('internalProducts.prices.effectiveEndHint')
))

const isSelectedPrice = (priceId: string) => priceId === props.selectedPriceId

const formatPriceRangeSummary = (price: InternalProductPrice) => {
  const start = formatRangeValue(price.started_at)
  const end = formatRangeValue(price.ended_at)
  return locale.value === 'id' ? `${start} sampai ${end}` : `${start} until ${end}`
}
</script>

<template>
  <Card class="border-border/70 shadow-none">
    <div class="flex items-start justify-between gap-3 border-b border-border/70 px-5 py-4">
      <div class="text-base font-semibold">
        {{ uiText('Prices') }}
      </div>

      <Button
        size="sm"
        variant="outline"
        class="rounded-xl"
        :disabled="!enabled"
        @click="emit('startCreate')"
      >
        {{ uiText('New Price') }}
      </Button>
    </div>

    <div class="space-y-5 p-5">
      <div
        v-if="!enabled"
        class="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground"
      >
        {{ uiText('Select a pricing to manage its prices.') }}
      </div>

      <template v-else>
        <div class="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
          <div class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {{ uiText('Selected pricing') }}
          </div>
          <div class="mt-1 text-sm font-medium">
            {{ selectedPricing?.name || '-' }}
          </div>
          <div class="text-xs text-muted-foreground">
            {{ selectedPricing?.code || '-' }}
          </div>
        </div>

        <div class="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div class="space-y-4">
            <div class="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              {{ uiText('Choose a price entry from the list. Its details will open in the editor on the right.') }}
            </div>

            <div
              v-if="loading"
              class="text-sm text-muted-foreground"
            >
              {{ uiText('Loading prices...') }}
            </div>

            <div
              v-else-if="items.length === 0"
              class="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground"
            >
              <div>{{ uiText('No price points yet for the selected pricing.') }}</div>
              <Button
                size="sm"
                variant="outline"
                class="mt-4 rounded-xl"
                @click="emit('startCreate')"
              >
                {{ uiText('Create First Price') }}
              </Button>
            </div>

            <div
              v-else
              class="space-y-3"
            >
              <button
                v-for="price in items"
                :key="price.id"
                type="button"
                class="w-full rounded-2xl border px-4 py-4 text-left transition-colors"
                :class="isSelectedPrice(price.id)
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border/70 bg-background hover:border-primary/40 hover:bg-muted/20'"
                @click="emit('select', price.id)"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0 space-y-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="font-semibold tabular-nums">
                        {{ formatAmount(price) }}
                      </span>
                      <Badge
                        v-if="isSelectedPrice(price.id)"
                        variant="secondary"
                      >
                        {{ uiText('Editing') }}
                      </Badge>
                    </div>
                    <div class="text-sm text-foreground">
                      {{ price.currency_code }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ formatPriceRangeSummary(price) }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{
                        isSelectedPrice(price.id)
                          ? uiText('This price entry is currently open in the editor.')
                          : uiText('Click to edit this price entry.')
                      }}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    class="rounded-xl"
                    :disabled="deletingId === price.id"
                    @click.stop="emit('delete', price)"
                  >
                    {{ deletingId === price.id ? uiText('Deleting...') : uiText('Delete') }}
                  </Button>
                </div>
              </button>
            </div>
          </div>

          <div class="rounded-2xl border border-border/70 bg-background">
            <form
              class="space-y-5 p-5"
              @submit.prevent="emit('submit')"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="space-y-1">
                  <div class="text-sm font-semibold">
                    {{ formTitle }}
                  </div>
                  <div class="text-sm text-muted-foreground">
                    {{ formDescription }}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  class="rounded-xl"
                  type="button"
                  @click="emit('startCreate')"
                >
                  {{ resetLabel }}
                </Button>
              </div>

              <div
                v-if="selectedPrice && formMode === 'edit'"
                class="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3"
              >
                <div class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {{ uiText('Selected price entry') }}
                </div>
                <div class="mt-1 text-sm font-semibold tabular-nums">
                  {{ formatAmount(selectedPrice) }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ formatPriceRangeSummary(selectedPrice) }}
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <Label for="internal-price-currency">{{ uiText('Currency') }}</Label>
                  <SearchableSelect
                    id="internal-price-currency"
                    v-model="model.currency_code"
                    :options="currencyOptions"
                    :placeholder="t('internalProducts.prices.currencyPlaceholder')"
                    :search-placeholder="t('internalProducts.prices.currencySearchPlaceholder')"
                  />
                </div>

                <div class="space-y-2">
                  <Label for="internal-price-amount">{{ t('internalProducts.prices.amountLabel') }}</Label>
                  <input
                    id="internal-price-amount"
                    :value="amountInput"
                    :placeholder="t('internalProducts.prices.amountPlaceholder')"
                    type="text"
                    inputmode="decimal"
                    autocomplete="off"
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    @beforeinput="handleAmountBeforeInput"
                    @input="handleAmountInput"
                    @paste="handleAmountPaste"
                    @blur="handleAmountBlur"
                  >
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <Label for="internal-price-started-at">{{ t('internalProducts.prices.effectiveStartLabel') }}</Label>
                  <Input
                    id="internal-price-started-at"
                    v-model="model.started_at"
                    type="datetime-local"
                  />
                  <p
                    v-if="model.started_at"
                    class="text-xs text-muted-foreground"
                  >
                    {{ startedAtPreview }}
                  </p>
                </div>

                <div class="space-y-2">
                  <Label for="internal-price-ended-at">{{ t('internalProducts.prices.effectiveEndLabel') }}</Label>
                  <Input
                    id="internal-price-ended-at"
                    v-model="model.ended_at"
                    type="datetime-local"
                  />
                  <p
                    v-if="model.ended_at"
                    class="text-xs text-muted-foreground"
                  >
                    {{ endedAtPreview }}
                  </p>
                </div>
              </div>

              <div class="flex justify-end">
                <Button
                  type="submit"
                  class="rounded-xl"
                  :disabled="saving"
                >
                  {{ submitLabel }}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </template>
    </div>
  </Card>
</template>
