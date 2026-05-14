<script setup lang="ts">
import { computed, onMounted, shallowRef, watch } from 'vue'
import {
  CreditCard,
  Download,
  PackageCheck,
  X,
} from 'lucide-vue-next'

import { createTenantBillingApi } from '../billing-api'
import {
  formatBillingMoney,
  normalizeBillingList,
  resolveBillingErrorMessageKey,
  resolveBillingStatusDescriptor,
  type BillingStatusTone,
} from '../billing-format'
import type {
  TenantBillingCycle,
  TenantBillingInvoice,
  TenantBillingPlan,
  TenantBillingPlanPrice,
} from '../types'

defineOptions({ name: 'TenantBillingPayments' })

const { user } = useAuth()
const { apiFetch } = useApi()
const { locale, t } = useLocale()
const { formatIsoDate } = useDateTime()
const billingApi = createTenantBillingApi(apiFetch)

const plans = shallowRef<TenantBillingPlan[]>([])
const invoices = shallowRef<TenantBillingInvoice[]>([])
const selectedPlan = shallowRef<TenantBillingPlan | null>(null)
const selectedCycle = shallowRef<TenantBillingCycle>('monthly')
const selectedCurrency = shallowRef('')
const isLoading = shallowRef(false)
const isSubmitting = shallowRef(false)
const isPlanModalOpen = shallowRef(false)
const errorMessage = shallowRef('')

const canManageBilling = computed(() => {
  const roles = Array.isArray(user.value?.roles) ? user.value.roles : []
  return roles.includes('owner') || roles.includes('admin')
})

const activePlanPrice = computed(() => {
  if (!selectedPlan.value) {
    return null
  }

  return resolvePlanPrice(selectedPlan.value, selectedCycle.value, selectedCurrency.value)
})

const statusClassMap: Record<BillingStatusTone, string> = {
  neutral: 'border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
  info: 'border-sky-200 bg-sky-100 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100',
  success: 'border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
  warning: 'border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
  danger: 'border-red-200 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
}

function resolvePlanPrice(
  plan: TenantBillingPlan,
  cycle: TenantBillingCycle,
  currency?: string,
): TenantBillingPlanPrice | null {
  const matchedPrice = plan.prices?.find(price =>
    price.billing_cycle === cycle && (!currency || price.currency === currency),
  )
  if (matchedPrice) {
    return matchedPrice
  }

  if (plan.amount && plan.currency) {
    return {
      id: plan.id,
      pricing_id: plan.pricing_id ?? plan.id,
      billing_cycle: plan.billing_cycle ?? cycle,
      amount: plan.amount,
      currency: plan.currency,
    }
  }

  return null
}

const availableCurrencies = computed(() => {
  const plan = selectedPlan.value
  if (!plan?.prices?.length) {
    return []
  }

  return [...new Map(plan.prices.map(price => [price.currency, {
    value: price.currency,
    label: price.currency,
    isDefault: Boolean(price.is_default_currency),
  }])).values()].sort((left, right) => {
    if (left.isDefault !== right.isDefault) {
      return left.isDefault ? -1 : 1
    }

    return left.value.localeCompare(right.value)
  })
})

const formatMoney = (amount: string | number | null | undefined, currency?: string | null) =>
  formatBillingMoney(amount, currency, locale.value)

const formatPlanPrice = (price: TenantBillingPlanPrice | null) => {
  if (!price) {
    return '-'
  }

  const numericValue = Number(price.amount)
  if (!Number.isFinite(numericValue)) {
    return '-'
  }

  const decimalPlaces = price.currency_decimal_places ?? 0
  const formatted = numericValue.toLocaleString(locale.value === 'en' ? 'en-US' : 'id-ID', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  })

  return price.currency_symbol?.trim()
    ? `${price.currency_symbol}${formatted}`
    : `${price.currency} ${formatted}`
}

const statusBadge = (status: string | null | undefined) => {
  const descriptor = resolveBillingStatusDescriptor('invoice', status)
  return {
    label: t(descriptor.labelKey),
    className: statusClassMap[descriptor.tone],
  }
}

const setResponseError = (response: { code?: string, message?: string }) => {
  const messageKey = resolveBillingErrorMessageKey(response.code)
  errorMessage.value = messageKey === 'billing.errors.generic'
    ? response.message || t(messageKey)
    : t(messageKey)
}

const loadPlans = async () => {
  const response = await billingApi.listPlans()
  if (!response.success) {
    setResponseError(response)
    return
  }

  plans.value = normalizeBillingList(response.data)
  selectedPlan.value = selectedPlan.value ?? plans.value[0] ?? null
}

const loadInvoices = async () => {
  const response = await billingApi.listInvoices({ page: 1, limit: 20, paginate: 20 })
  if (!response.success) {
    setResponseError(response)
    return
  }

  invoices.value = normalizeBillingList(response.data)
}

const refreshPage = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    await Promise.all([loadPlans(), loadInvoices()])
  } finally {
    isLoading.value = false
  }
}

const openPlanModal = () => {
  isPlanModalOpen.value = true
}

const closePlanModal = () => {
  if (!isSubmitting.value) {
    isPlanModalOpen.value = false
  }
}

const continueInvoicePayment = async (invoice: TenantBillingInvoice) => {
  if (!invoice.payment_url || isSubmitting.value) {
    return
  }

  await navigateTo(invoice.payment_url, { external: true })
}

const startCheckout = async () => {
  const price = activePlanPrice.value
  if (!price || !selectedPlan.value || isSubmitting.value) {
    return
  }

  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const response = await billingApi.createCheckout({
      price_id: price.id,
      add_on_ids: [],
      replace_active_checkout: false,
    })

    if (!response.success || !response.data) {
      setResponseError(response)
      return
    }

    await navigateTo(response.data.payment_url, { external: true })
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  void refreshPage()
})

watch(selectedPlan, (plan) => {
  if (!plan?.prices?.length) {
    selectedCurrency.value = ''
    return
  }

  const defaultCurrency = plan.prices.find(price => price.is_default_currency)?.currency
  selectedCurrency.value = defaultCurrency ?? plan.prices[0]?.currency ?? ''
})

watch(selectedCycle, (cycle) => {
  const plan = selectedPlan.value
  if (!plan?.prices?.length) {
    return
  }

  const hasCycleCurrency = plan.prices.some(price =>
    price.billing_cycle === cycle && price.currency === selectedCurrency.value,
  )
  if (hasCycleCurrency) {
    return
  }

  const nextPrice = plan.prices.find(price => price.billing_cycle === cycle)
  selectedCurrency.value = nextPrice?.currency ?? selectedCurrency.value
})
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ t('billing.payments.title') }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ t('billing.payments.description') }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button
          :disabled="!canManageBilling"
          @click="openPlanModal"
        >
          <PackageCheck
            class="size-4"
            aria-hidden="true"
          />
          {{ t('billing.payments.choosePlan') }}
        </Button>
      </div>
    </div>

    <div
      v-if="!canManageBilling"
      class="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
    >
      {{ t('billing.common.managePermissionHint') }}
    </div>

    <div
      v-if="errorMessage"
      class="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200"
    >
      {{ errorMessage }}
    </div>

    <Card>
      <CardHeader class="flex flex-col gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{{ t('billing.payments.history') }}</CardTitle>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ t('billing.payments.historyHint') }}
          </p>
        </div>
      </CardHeader>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[720px] text-sm">
            <thead class="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th class="px-5 py-3 font-medium">
                  {{ t('billing.payments.date') }}
                </th>
                <th class="px-5 py-3 font-medium">
                  {{ t('billing.payments.invoice') }}
                </th>
                <th class="px-5 py-3 font-medium">
                  {{ t('billing.common.amount') }}
                </th>
                <th class="px-5 py-3 font-medium">
                  {{ t('ui.status') }}
                </th>
                <th class="px-5 py-3 text-right font-medium">
                  {{ t('common.actions') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="invoice in invoices"
                :key="invoice.id"
                class="border-t"
              >
                <td class="px-5 py-4">
                  {{ formatIsoDate(invoice.created_at || invoice.due_at) }}
                </td>
                <td class="px-5 py-4 font-medium">
                  {{ invoice.invoice_number || invoice.id }}
                </td>
                <td class="px-5 py-4">
                  {{ formatMoney(invoice.amount, invoice.currency) }}
                </td>
                <td class="px-5 py-4">
                  <Badge
                    variant="outline"
                    :class="statusBadge(invoice.status).className"
                  >
                    {{ statusBadge(invoice.status).label }}
                  </Badge>
                </td>
                <td class="px-5 py-4">
                  <div class="flex justify-end">
                    <Button
                      v-if="invoice.status === 'open'"
                      size="sm"
                      :disabled="!invoice.payment_url"
                      @click="continueInvoicePayment(invoice)"
                    >
                      {{ t('billing.payments.pay') }}
                    </Button>
                    <Button
                      v-else-if="invoice.status === 'paid'"
                      size="sm"
                      variant="outline"
                    >
                      <Download
                        class="size-4"
                        aria-hidden="true"
                      />
                      {{ t('billing.payments.invoiceAction') }}
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          v-if="!isLoading && !invoices.length"
          class="p-6 text-sm text-muted-foreground"
        >
          {{ t('billing.payments.empty') }}
        </div>
        <div
          v-if="isLoading"
          class="grid gap-3 p-5"
        >
          <div
            v-for="index in 4"
            :key="index"
            class="h-12 rounded-md bg-muted"
          />
        </div>
      </CardContent>
    </Card>

    <Teleport to="body">
      <div
        v-if="isPlanModalOpen"
        class="fixed inset-y-0 left-0 right-0 z-50 flex items-center justify-center bg-black/45 p-4 lg:left-80"
        role="dialog"
        aria-modal="true"
        aria-labelledby="billing-plan-title"
        @click.self="closePlanModal"
      >
        <div class="w-full max-w-2xl rounded-lg border bg-background shadow-lg">
          <div class="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2
                id="billing-plan-title"
                class="text-lg font-semibold"
              >
                {{ t('billing.planModal.title') }}
              </h2>
              <p class="mt-1 text-sm text-muted-foreground">
                {{ t('billing.planModal.description') }}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              :aria-label="t('common.close')"
              @click="closePlanModal"
            >
              <X
                class="size-5"
                aria-hidden="true"
              />
            </Button>
          </div>

          <div class="space-y-4 p-5">
            <div class="inline-flex rounded-md border bg-muted/40 p-1">
              <button
                v-for="cycle in (['monthly', 'annual'] as TenantBillingCycle[])"
                :key="cycle"
                type="button"
                class="rounded px-3 py-1.5 text-sm font-medium"
                :class="selectedCycle === cycle ? 'bg-background shadow-sm' : 'text-muted-foreground'"
                @click="selectedCycle = cycle"
              >
                {{ t(`billing.cycles.${cycle}`) }}
              </button>
            </div>

            <div
              v-if="availableCurrencies.length > 1"
              class="space-y-2"
            >
              <Label for="billing-currency">{{ t('billing.plans.currency') }}</Label>
              <SearchableSelect
                id="billing-currency"
                v-model="selectedCurrency"
                :options="availableCurrencies"
                :placeholder="t('billing.plans.currency')"
                :search-placeholder="t('billing.plans.currency')"
              />
            </div>

            <div class="grid gap-3">
              <button
                v-for="plan in plans"
                :key="plan.id"
                type="button"
                class="rounded-md border p-4 text-left transition-colors hover:bg-muted/50"
                :class="selectedPlan?.id === plan.id ? 'border-primary ring-2 ring-primary/20' : 'border-border'"
                @click="selectedPlan = plan"
              >
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div class="space-y-1">
                    <p class="font-semibold">
                      {{ plan.name }}
                    </p>
                    <p class="text-sm text-muted-foreground">
                      {{ plan.description || t('billing.plans.defaultDescription') }}
                    </p>
                  </div>
                  <p class="text-lg font-semibold">
                    {{ formatPlanPrice(resolvePlanPrice(plan, selectedCycle, selectedPlan?.id === plan.id ? selectedCurrency : plan.prices?.find(price => price.is_default_currency)?.currency)) }}
                  </p>
                </div>
              </button>
            </div>

            <p
              v-if="!plans.length"
              class="rounded-md border p-4 text-sm text-muted-foreground"
            >
              {{ t('billing.plans.empty') }}
            </p>
          </div>

          <div class="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm text-muted-foreground">
              {{ t('billing.planModal.checkoutHint') }}
            </p>
            <Button
              class="sm:min-w-36"
              :disabled="!activePlanPrice || !canManageBilling || isSubmitting"
              @click="startCheckout"
            >
              <CreditCard
                class="size-4"
                aria-hidden="true"
              />
              {{ isSubmitting ? t('billing.checkout.redirecting') : t('billing.payments.pay') }}
            </Button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
