<script setup lang="ts">
defineOptions({ name: 'InternalCurrencyManageDialog' })

type CurrencyForm = {
  code: string
  name: string
  symbol: string
  decimal_places: number
  is_active: boolean
  is_default: boolean
}

const props = defineProps<{
  open: boolean
  mode: 'create' | 'edit'
  saving: boolean
  form: CurrencyForm
}>()

const emit = defineEmits<{
  close: []
  submit: []
  'update:form': [value: CurrencyForm]
}>()

const { t } = useLocale()

const updateField = <K extends keyof CurrencyForm>(key: K, value: CurrencyForm[K]) => {
  emit('update:form', { ...props.form, [key]: value })
}

const onDefaultChange = (checked: boolean) => {
  const updated = { ...props.form, is_default: checked }
  if (checked) {
    updated.is_active = true
  }
  emit('update:form', updated)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-2xl rounded-lg border bg-background p-5 shadow-lg">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold">
              {{ mode === 'create' ? t('billingSettings.currencies.add') : t('common.edit') }}
            </h2>
          </div>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="currency-code">{{ t('billingSettings.currencies.columns.code') }}</Label>
            <Input
              id="currency-code"
              :model-value="form.code"
              :disabled="mode === 'edit'"
              @update:model-value="updateField('code', $event)"
            />
          </div>
          <div class="space-y-2">
            <Label for="currency-name">{{ t('billingSettings.currencies.columns.name') }}</Label>
            <Input
              id="currency-name"
              :model-value="form.name"
              @update:model-value="updateField('name', $event)"
            />
          </div>
          <div class="space-y-2">
            <Label for="currency-symbol">{{ t('billingSettings.currencies.columns.symbol') }}</Label>
            <Input
              id="currency-symbol"
              :model-value="form.symbol"
              @update:model-value="updateField('symbol', $event)"
            />
          </div>
          <div class="space-y-2 md:col-span-2">
            <Label for="currency-decimals">{{ t('billingSettings.currencies.columns.decimalPlaces') }}</Label>
            <Input
              id="currency-decimals"
              :model-value="String(form.decimal_places)"
              type="number"
              min="0"
              max="6"
              @update:model-value="updateField('decimal_places', Number($event))"
            />
          </div>
          <div class="space-y-3 rounded-md border p-3">
            <label class="flex items-center gap-2 text-sm font-medium">
              <input
                :checked="form.is_active"
                type="checkbox"
                @change="updateField('is_active', ($event.target as HTMLInputElement).checked)"
              >
              {{ t('billingSettings.currencies.filters.active') }}
            </label>
            <label class="flex items-center gap-2 text-sm font-medium">
              <input
                :checked="form.is_default"
                type="checkbox"
                @change="onDefaultChange(($event.target as HTMLInputElement).checked)"
              >
              {{ t('billingSettings.currencies.defaultBadge') }}
            </label>
          </div>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <Button
            variant="outline"
            @click="emit('close')"
          >
            {{ t('common.cancel') }}
          </Button>
          <Button
            :disabled="saving"
            @click="emit('submit')"
          >
            {{ saving ? t('common.saving') : t('common.save') }}
          </Button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
