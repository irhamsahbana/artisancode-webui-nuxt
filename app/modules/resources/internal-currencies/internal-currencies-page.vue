<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

defineOptions({ name: 'InternalCurrenciesPage' })

type CurrencyItem = {
  code: string
  name: string
  symbol: string
  decimal_places: number
  is_active: boolean
  is_default: boolean
  sort_order: number
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

type ProviderCurrencyItem = {
  provider: string
  currency_code: string
  is_active: boolean
  min_amount: string | null
  max_amount: string | null
  metadata: Record<string, unknown> | null
}

type ListResponse<T> = {
  items?: T[]
}

const { apiFetch } = useApi()
const { show } = useBanner()
const { t } = useLocale()

const currencies = ref<CurrencyItem[]>([])
const loading = ref(false)
const saving = ref(false)
const providerSaving = ref(false)
const formOpen = ref(false)
const providerOpen = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const selectedCurrency = ref<CurrencyItem | null>(null)
const form = reactive({
  code: '',
  name: '',
  symbol: '',
  decimal_places: 2,
  is_active: false,
  is_default: false,
  sort_order: 0,
  metadata: '{}',
})
const providerForm = reactive({
  is_active: false,
  min_amount: '',
  max_amount: '',
  metadata: '{}',
})

const filteredCurrencies = computed(() => currencies.value)
const hasCurrencies = computed(() => filteredCurrencies.value.length > 0)

const parseJsonText = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return {}
  }

  return JSON.parse(trimmed) as Record<string, unknown>
}

const loadCurrencies = async () => {
  loading.value = true
  const response = await apiFetch<ListResponse<CurrencyItem>>('/internal-currencies', {
    authMode: 'internal',
    query: {
      page: 1,
      paginate: 100,
    },
  })
  loading.value = false

  if (!response.success || !response.data) {
    currencies.value = []
    return
  }

  currencies.value = response.data.items ?? []
}

const resetForm = () => {
  form.code = ''
  form.name = ''
  form.symbol = ''
  form.decimal_places = 2
  form.is_active = false
  form.is_default = false
  form.sort_order = 0
  form.metadata = '{}'
}

const openCreate = () => {
  formMode.value = 'create'
  resetForm()
  formOpen.value = true
}

const openEdit = (currency: CurrencyItem) => {
  formMode.value = 'edit'
  selectedCurrency.value = currency
  form.code = currency.code
  form.name = currency.name
  form.symbol = currency.symbol
  form.decimal_places = currency.decimal_places
  form.is_active = currency.is_active
  form.is_default = currency.is_default
  form.sort_order = currency.sort_order
  form.metadata = JSON.stringify(currency.metadata ?? {}, null, 2)
  formOpen.value = true
}

const submitForm = async () => {
  let metadata: Record<string, unknown>
  try {
    metadata = parseJsonText(form.metadata)
  } catch {
    show(t('billingSettings.currencies.invalidJson'), 'error')
    return
  }

  saving.value = true
  const payload = {
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    symbol: form.symbol.trim(),
    decimal_places: Number(form.decimal_places),
    is_active: form.is_default ? true : form.is_active,
    is_default: form.is_default,
    sort_order: Number(form.sort_order),
    metadata,
  }

  const response = formMode.value === 'create'
    ? await apiFetch<CurrencyItem>('/internal-currencies', {
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
    show(response.message || t('billingSettings.currencies.saveFailed'), 'error')
    return
  }

  formOpen.value = false
  await loadCurrencies()
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
      sort_order: currency.sort_order,
      metadata: currency.metadata ?? {},
    },
  })

  if (!response.success) {
    show(response.message || t('billingSettings.currencies.saveFailed'), 'error')
    return
  }

  await loadCurrencies()
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
      sort_order: currency.sort_order,
      metadata: currency.metadata ?? {},
    },
  })

  if (!response.success) {
    show(response.message || t('billingSettings.currencies.saveFailed'), 'error')
    return
  }

  await loadCurrencies()
}

const removeCurrency = async (currency: CurrencyItem) => {
  if (!confirm(t('billingSettings.currencies.deleteConfirm', { code: currency.code }))) {
    return
  }

  const response = await apiFetch(`/internal-currencies/${currency.code}`, {
    method: 'DELETE',
    authMode: 'internal',
  })
  if (!response.success) {
    show(response.message || t('billingSettings.currencies.deleteFailed'), 'error')
    return
  }

  await loadCurrencies()
}

const openProvider = async (currency: CurrencyItem) => {
  selectedCurrency.value = currency
  providerOpen.value = true
  providerForm.is_active = false
  providerForm.min_amount = ''
  providerForm.max_amount = ''
  providerForm.metadata = '{}'

  const response = await apiFetch<ListResponse<ProviderCurrencyItem>>('/internal-currencies/providers/doku', {
    authMode: 'internal',
    query: { page: 1, paginate: 100 },
  })

  if (!response.success || !response.data) {
    return
  }

  const item = (response.data.items ?? []).find(entry => entry.currency_code === currency.code)
  if (!item) {
    return
  }

  providerForm.is_active = item.is_active
  providerForm.min_amount = item.min_amount ?? ''
  providerForm.max_amount = item.max_amount ?? ''
  providerForm.metadata = JSON.stringify(item.metadata ?? {}, null, 2)
}

const submitProvider = async () => {
  if (!selectedCurrency.value) {
    return
  }

  let metadata: Record<string, unknown>
  try {
    metadata = parseJsonText(providerForm.metadata)
  } catch {
    show(t('billingSettings.currencies.invalidJson'), 'error')
    return
  }

  providerSaving.value = true
  const response = await apiFetch(`/internal-currencies/providers/doku/${selectedCurrency.value.code}`, {
    method: 'PUT',
    authMode: 'internal',
    body: {
      is_active: providerForm.is_active,
      min_amount: providerForm.min_amount || null,
      max_amount: providerForm.max_amount || null,
      metadata,
    },
  })
  providerSaving.value = false

  if (!response.success) {
    show(response.message || t('billingSettings.currencies.providerSaveFailed'), 'error')
    return
  }

  providerOpen.value = false
}

onMounted(() => {
  void loadCurrencies()
})
</script>

<template>
  <section>
    <Card class="overflow-hidden rounded-[28px] border-border/80 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.82)]">
      <CardHeader class="border-b border-border/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.82),rgba(255,255,255,0.98))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.96))]">
        <div class="space-y-4">
          <div class="space-y-1">
            <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {{ t('layout.resources') }}
            </div>
            <CardTitle class="text-xl">
              {{ t('billingSettings.currencies.title') }}
            </CardTitle>
          </div>

          <div class="flex items-center justify-end">
            <Button
              size="sm"
              class="rounded-xl"
              @click="openCreate"
            >
              {{ t('ui.addNew') }}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent class="pt-5">
        <div
          v-if="loading && !hasCurrencies"
          class="rounded-[22px] border border-dashed border-border/70 bg-background/60 px-4 py-10 text-center text-sm text-muted-foreground"
        >
          {{ t('common.loading') }}
        </div>

        <div
          v-else
          class="overflow-hidden rounded-[22px] border border-border/70"
        >
          <div
            v-if="loading && hasCurrencies"
            class="border-b border-border/70 bg-muted/35 px-4 py-3 text-sm text-muted-foreground"
          >
            {{ t('common.loading') }}
          </div>

          <div class="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{{ t('billingSettings.currencies.columns.code') }}</TableHead>
                  <TableHead>{{ t('billingSettings.currencies.columns.name') }}</TableHead>
                  <TableHead>{{ t('billingSettings.currencies.columns.symbol') }}</TableHead>
                  <TableHead>{{ t('billingSettings.currencies.columns.decimalPlaces') }}</TableHead>
                  <TableHead>{{ t('billingSettings.currencies.columns.status') }}</TableHead>
                  <TableHead>{{ t('billingSettings.currencies.columns.default') }}</TableHead>
                  <TableHead>{{ t('billingSettings.currencies.columns.sortOrder') }}</TableHead>
                  <TableHead class="text-right">{{ t('common.actions') }}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                <TableRow
                  v-for="currency in filteredCurrencies"
                  :key="currency.code"
                  class="transition hover:bg-muted/30"
                >
                  <TableCell class="font-semibold">{{ currency.code }}</TableCell>
                  <TableCell>{{ currency.name }}</TableCell>
                  <TableCell>{{ currency.symbol || '-' }}</TableCell>
                  <TableCell>{{ currency.decimal_places }}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      :class="currency.is_active ? 'border-emerald-200 text-emerald-700' : 'border-slate-200 text-slate-600'"
                    >
                      {{ currency.is_active ? t('billingSettings.currencies.filters.active') : t('billingSettings.currencies.filters.inactive') }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      v-if="currency.is_default"
                      variant="secondary"
                    >
                      {{ t('billingSettings.currencies.defaultBadge') }}
                    </Badge>
                    <span v-else>-</span>
                  </TableCell>
                  <TableCell>{{ currency.sort_order }}</TableCell>
                  <TableCell class="text-right">
                    <div class="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="outline" @click="openEdit(currency)">{{ t('common.edit') }}</Button>
                      <Button
                        size="sm"
                        variant="outline"
                        :disabled="currency.is_default && currency.is_active"
                        @click="toggleActive(currency)"
                      >
                        {{ currency.is_active ? t('billingSettings.currencies.deactivate') : t('billingSettings.currencies.activate') }}
                      </Button>
                      <Button size="sm" variant="outline" :disabled="currency.is_default" @click="setDefault(currency)">
                        {{ t('billingSettings.currencies.setDefault') }}
                      </Button>
                      <Button size="sm" variant="outline" @click="openProvider(currency)">{{ t('billingSettings.currencies.manageProviders') }}</Button>
                      <Button size="sm" variant="destructive" :disabled="currency.is_default" @click="removeCurrency(currency)">
                        {{ t('common.delete') }}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                <TableRow v-if="!filteredCurrencies.length">
                  <TableCell
                    :colspan="8"
                    class="py-10 text-center text-muted-foreground"
                  >
                    {{ t('billingSettings.currencies.empty') }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>

    <Teleport to="body">
      <div
        v-if="formOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="formOpen = false"
      >
        <div class="w-full max-w-2xl rounded-lg border bg-background p-5 shadow-lg">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">{{ formMode === 'create' ? t('billingSettings.currencies.add') : t('common.edit') }}</h2>
            </div>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label for="currency-code">{{ t('billingSettings.currencies.columns.code') }}</Label>
              <Input id="currency-code" v-model="form.code" :disabled="formMode === 'edit'" />
            </div>
            <div class="space-y-2">
              <Label for="currency-name">{{ t('billingSettings.currencies.columns.name') }}</Label>
              <Input id="currency-name" v-model="form.name" />
            </div>
            <div class="space-y-2">
              <Label for="currency-symbol">{{ t('billingSettings.currencies.columns.symbol') }}</Label>
              <Input id="currency-symbol" v-model="form.symbol" />
            </div>
            <div class="space-y-2">
              <Label for="currency-decimals">{{ t('billingSettings.currencies.columns.decimalPlaces') }}</Label>
              <Input
                id="currency-decimals"
                :model-value="String(form.decimal_places)"
                type="number"
                min="0"
                max="6"
                @update:model-value="form.decimal_places = Number($event)"
              />
            </div>
            <div class="space-y-2">
              <Label for="currency-sort">{{ t('billingSettings.currencies.columns.sortOrder') }}</Label>
              <Input
                id="currency-sort"
                :model-value="String(form.sort_order)"
                type="number"
                @update:model-value="form.sort_order = Number($event)"
              />
            </div>
            <div class="space-y-3 rounded-md border p-3">
              <label class="flex items-center gap-2 text-sm font-medium">
                <input v-model="form.is_active" type="checkbox">
                {{ t('billingSettings.currencies.filters.active') }}
              </label>
              <label class="flex items-center gap-2 text-sm font-medium">
                <input v-model="form.is_default" type="checkbox" @change="form.is_default ? form.is_active = true : null">
                {{ t('billingSettings.currencies.defaultBadge') }}
              </label>
            </div>
            <div class="space-y-2 md:col-span-2">
              <Label for="currency-metadata">Metadata</Label>
              <textarea id="currency-metadata" v-model="form.metadata" class="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div class="mt-5 flex justify-end gap-2">
            <Button variant="outline" @click="formOpen = false">{{ t('common.cancel') }}</Button>
            <Button :disabled="saving" @click="submitForm">{{ saving ? t('common.saving') : t('common.save') }}</Button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="providerOpen && selectedCurrency"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="providerOpen = false"
      >
        <div class="w-full max-w-xl rounded-lg border bg-background p-5 shadow-lg">
          <div class="space-y-1">
            <h2 class="text-lg font-semibold">{{ t('billingSettings.currencies.providerTitle', { code: selectedCurrency.code }) }}</h2>
            <p class="text-sm text-muted-foreground">{{ t('billingSettings.currencies.providerHint') }}</p>
          </div>
          <div class="mt-4 space-y-4">
            <label class="flex items-center gap-2 text-sm font-medium">
              <input
                v-model="providerForm.is_active"
                type="checkbox"
                :disabled="!selectedCurrency.is_active"
              >
              {{ t('billingSettings.currencies.providerActive') }}
            </label>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <Label for="provider-min">{{ t('billingSettings.currencies.providerMinAmount') }}</Label>
                <Input id="provider-min" v-model="providerForm.min_amount" />
              </div>
              <div class="space-y-2">
                <Label for="provider-max">{{ t('billingSettings.currencies.providerMaxAmount') }}</Label>
                <Input id="provider-max" v-model="providerForm.max_amount" />
              </div>
            </div>
            <div class="space-y-2">
              <Label for="provider-metadata">Metadata</Label>
              <textarea id="provider-metadata" v-model="providerForm.metadata" class="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div class="mt-5 flex justify-end gap-2">
            <Button variant="outline" @click="providerOpen = false">{{ t('common.cancel') }}</Button>
            <Button :disabled="providerSaving" @click="submitProvider">{{ providerSaving ? t('common.saving') : t('common.save') }}</Button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
