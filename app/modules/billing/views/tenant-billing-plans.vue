<script setup lang="ts">
import { computed, onMounted, shallowRef, watch } from 'vue'
import { Check, CreditCard, X } from 'lucide-vue-next'

import { createTenantBillingApi } from '../billing-api'
import {
  normalizeBillingList,
  resolveBillingErrorMessageKey,
} from '../billing-format'
import type {
  TenantBillingCycle,
  TenantBillingPlan,
  TenantBillingPlanPrice,
} from '../types'

defineOptions({ name: 'TenantBillingPlans' })

const { user } = useAuth()
const { apiFetch } = useApi()
const { locale, t } = useLocale()
const billingApi = createTenantBillingApi(apiFetch)

const plans = shallowRef<TenantBillingPlan[]>([])
const selectedCycle = shallowRef<TenantBillingCycle>('monthly')
const isSubmitting = shallowRef(false)
const errorMessage = shallowRef('')
const isLoading = shallowRef(false)

const canManageBilling = computed(() => {
  const roles = Array.isArray(user.value?.roles) ? user.value.roles : []
  return roles.includes('owner') || roles.includes('admin')
})

const currentPlanId = computed(() => {
  return plans.value.find(p => p.is_current_plan)?.id ?? null
})

const formatPrice = (price: TenantBillingPlanPrice | null) => {
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

const resolvePlanPrice = (
  plan: TenantBillingPlan,
  cycle: TenantBillingCycle,
): TenantBillingPlanPrice | null => {
  const matched = plan.prices?.find(price => price.billing_cycle === cycle)
  if (matched) return matched
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

const loadPlans = async () => {
  const response = await billingApi.listPlans()
  if (!response.success) {
    const messageKey = resolveBillingErrorMessageKey(response.code)
    errorMessage.value = messageKey === 'billing.errors.generic'
      ? response.message || t(messageKey)
      : t(messageKey)
    return
  }
  plans.value = normalizeBillingList(response.data)
}

const startCheckout = async (plan: TenantBillingPlan) => {
  const price = resolvePlanPrice(plan, selectedCycle.value)
  if (!price || isSubmitting.value) return

  errorMessage.value = ''
  isSubmitting.value = true
  try {
    const response = await billingApi.createCheckout({
      price_id: price.id,
      add_on_ids: [],
      replace_active_checkout: false,
    })
    if (!response.success || !response.data) {
      const messageKey = resolveBillingErrorMessageKey(response.code)
      errorMessage.value = messageKey === 'billing.errors.generic'
        ? response.message || t(messageKey)
        : t(messageKey)
      return
    }
    await navigateTo(response.data.payment_url, { external: true })
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  isLoading.value = true
  try {
    await loadPlans()
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <section class="space-y-6">
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold tracking-tight">
        {{ t('billing.plans.title') }}
      </h1>
      <p class="text-sm text-muted-foreground">
        {{ t('billing.plans.description') }}
      </p>
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

    <div class="flex justify-center">
      <div class="inline-flex rounded-md border bg-muted/40 p-1">
        <button
          v-for="cycle in (['monthly', 'annual'] as TenantBillingCycle[])"
          :key="cycle"
          type="button"
          class="rounded px-4 py-1.5 text-sm font-medium"
          :class="selectedCycle === cycle ? 'bg-background shadow-sm' : 'text-muted-foreground'"
          @click="selectedCycle = cycle"
        >
          {{ t(`billing.cycles.${cycle}`) }}
        </button>
      </div>
    </div>

    <div
      v-if="isLoading"
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div
        v-for="index in 3"
        :key="index"
        class="h-64 rounded-md bg-muted"
      />
    </div>

    <div
      v-else-if="plans.length"
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <Card
        v-for="plan in plans"
        :key="plan.id"
        :class="plan.is_current_plan ? 'border-primary ring-2 ring-primary/20' : ''"
      >
        <CardHeader>
          <div class="flex items-start justify-between">
            <CardTitle>{{ plan.name }}</CardTitle>
            <Badge
              v-if="plan.is_current_plan"
              variant="outline"
              class="border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
            >
              {{ t('billing.plans.current') }}
            </Badge>
          </div>
          <CardDescription>
            {{ plan.description || t('billing.plans.defaultDescription') }}
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <p class="text-2xl font-bold">
            {{ formatPrice(resolvePlanPrice(plan, selectedCycle)) }}
            <span class="text-sm font-normal text-muted-foreground">
              /{{ t(`billing.cycles.${selectedCycle}`) }}
            </span>
          </p>

          <ul
            v-if="plan.features?.length"
            class="space-y-2"
          >
            <li
              v-for="(feature, i) in plan.features"
              :key="i"
              class="flex items-start gap-2 text-sm"
            >
              <Check
                class="mt-0.5 size-4 shrink-0 text-emerald-500"
                aria-hidden="true"
              />
              <span>{{ feature }}</span>
            </li>
          </ul>

          <Button
            class="w-full"
            :disabled="plan.is_current_plan || !canManageBilling || isSubmitting"
            @click="startCheckout(plan)"
          >
            <CreditCard
              class="size-4"
              aria-hidden="true"
            />
            <template v-if="plan.is_current_plan">
              {{ t('billing.plans.currentPlan') }}
            </template>
            <template v-else-if="isSubmitting">
              {{ t('billing.checkout.redirecting') }}
            </template>
            <template v-else>
              {{ t('billing.payments.choosePlan') }}
            </template>
          </Button>
        </CardContent>
      </Card>
    </div>

    <div
      v-else
      class="rounded-md border p-6 text-sm text-muted-foreground"
    >
      {{ t('billing.plans.empty') }}
    </div>
  </section>
</template>
