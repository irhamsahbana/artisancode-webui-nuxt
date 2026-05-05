<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { AlertTriangle, ShieldCheck } from 'lucide-vue-next'

import { createTenantBillingApi } from '../billing-api'
import { resolveBillingErrorMessageKey } from '../billing-format'
import type { TenantBillingSubscription } from '../types'

defineOptions({ name: 'TenantBillingSubscription' })

const { user } = useAuth()
const { apiFetch } = useApi()
const { t } = useLocale()
const { formatIsoDate } = useDateTime()
const billingApi = createTenantBillingApi(apiFetch)

const subscription = shallowRef<TenantBillingSubscription | null>(null)
const isLoading = shallowRef(false)
const errorMessage = shallowRef('')

const canManageBilling = computed(() => {
  const roles = Array.isArray(user.value?.roles) ? user.value.roles : []
  return roles.includes('owner') || roles.includes('admin')
})

const subscriptionStatusBadge = computed(() => {
  const status = subscription.value?.status
  switch (status) {
    case 'active':
      return { label: t('billing.subscription.statusActive'), class: 'border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100' }
    case 'grace_period':
      return { label: t('billing.subscription.statusGracePeriod'), class: 'border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100' }
    case 'suspended':
      return { label: t('billing.subscription.statusSuspended'), class: 'border-red-200 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100' }
    case 'cancelled':
      return { label: t('billing.subscription.statusCancelled'), class: 'border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200' }
    case 'expired':
      return { label: t('billing.subscription.statusExpired'), class: 'border-red-200 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100' }
    case 'free':
    default:
      return { label: t('billing.subscription.statusFree'), class: 'border-sky-200 bg-sky-100 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100' }
  }
})

const formatDate = (iso?: string | null) => {
  if (!iso) {
    return t('common.notAvailable')
  }
  return formatIsoDate(iso)
}

const loadSubscription = async () => {
  const response = await billingApi.getSubscription()
  if (!response.success) {
    const messageKey = resolveBillingErrorMessageKey(response.code)
    errorMessage.value = messageKey === 'billing.errors.generic'
      ? response.message || t(messageKey)
      : t(messageKey)
    return
  }

  subscription.value = response.data ?? null
}

onMounted(async () => {
  isLoading.value = true
  try {
    await loadSubscription()
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <section class="space-y-6">
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold tracking-tight">
        {{ t('billing.subscription.title') }}
      </h1>
      <p class="text-sm text-muted-foreground">
        {{ t('billing.subscription.description') }}
      </p>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="isLoading"
      class="grid gap-4"
    >
      <div class="h-32 rounded-md bg-muted" />
      <div class="h-24 rounded-md bg-muted" />
    </div>

    <template v-else-if="subscription">
      <Card>
        <CardHeader>
          <div class="flex items-start justify-between">
            <div>
              <CardTitle>{{ subscription.plan_name || t('billing.subscription.freePlan') }}</CardTitle>
              <p class="mt-1 text-sm text-muted-foreground">
                {{ subscription.billing_cycle ? t(`billing.cycles.${subscription.billing_cycle}`) : '' }}
              </p>
            </div>
            <Badge
              variant="outline"
              :class="subscriptionStatusBadge.class"
            >
              {{ subscriptionStatusBadge.label }}
            </Badge>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1">
              <p class="text-xs text-muted-foreground uppercase tracking-wide">
                {{ t('billing.subscription.currentPeriodStart') }}
              </p>
              <p class="font-medium">
                {{ formatDate(subscription.current_period_start) }}
              </p>
            </div>
            <div class="space-y-1">
              <p class="text-xs text-muted-foreground uppercase tracking-wide">
                {{ t('billing.subscription.currentPeriodEnd') }}
              </p>
              <p class="font-medium">
                {{ formatDate(subscription.current_period_end) }}
              </p>
            </div>
            <div class="space-y-1">
              <p class="text-xs text-muted-foreground uppercase tracking-wide">
                {{ t('billing.subscription.nextRenewalAt') }}
              </p>
              <p class="font-medium">
                {{ formatDate(subscription.next_renewal_at) }}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card v-if="subscription.status === 'free'">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <ShieldCheck
              class="size-5 text-emerald-500"
              aria-hidden="true"
            />
            {{ t('billing.subscription.freeTierTitle') }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            {{ t('billing.subscription.freeTierHint') }}
          </p>
          <div class="mt-4">
            <Button as-child>
              <NuxtLink :to="{ name: 'billing-plans' }">
                {{ t('billing.payments.choosePlan') }}
              </NuxtLink>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card v-if="subscription.status === 'grace_period'">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <AlertTriangle
              class="size-5 text-amber-500"
              aria-hidden="true"
            />
            {{ t('billing.subscription.gracePeriodTitle') }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            {{ t('billing.subscription.gracePeriodHint') }}
          </p>
        </CardContent>
      </Card>
    </template>

    <div
      v-else
      class="rounded-md border p-6 text-sm text-muted-foreground"
    >
      {{ t('billing.subscription.empty') }}
    </div>
  </section>
</template>
