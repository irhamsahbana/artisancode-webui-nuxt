<script setup lang="ts">
defineOptions({ name: 'TenantBillingCheckout' })
const { t } = useLocale()
</script>

<template>
  <section class="space-y-6">
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold tracking-tight">
        {{ t('billing.checkout.title') }}
      </h1>
      <p class="text-sm text-muted-foreground">
        {{ t('billing.checkout.description') }}
      </p>
    </div>
    <div class="rounded-md border p-6 text-sm text-muted-foreground">
      {{ t('billing.checkout.empty') }}
    </div>
  </section>
</template>
