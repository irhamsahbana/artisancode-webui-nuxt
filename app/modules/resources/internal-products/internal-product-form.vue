<script setup lang="ts">
import { computed } from 'vue'
import type { InternalProductForm } from './types'

defineOptions({ name: 'InternalProductForm' })

const model = defineModel<InternalProductForm>({ required: true })

defineProps<{
  mode: 'create' | 'edit'
  loading: boolean
  saving: boolean
  statusOptions: Array<{ value: string, label: string }>
}>()

const emit = defineEmits<{
  submit: []
}>()

const { t } = useLocale()

const submitLabel = computed(() => (
  model.value.id
    ? t('ui.saveProduct')
    : t('ui.createProduct')
))
</script>

<template>
  <Card class="border-border/70 shadow-none">
    <div class="border-b border-border/70 px-5 py-4">
      <div class="text-base font-semibold">
        {{ t('ui.productDetails') }}
      </div>
    </div>

    <div class="p-5">
      <div
        v-if="loading"
        class="text-sm text-muted-foreground"
      >
        {{ t('ui.loadingProductData') }}
      </div>

      <form
        v-else
        class="space-y-4"
        @submit.prevent="emit('submit')"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="internal-product-code">{{ t('common.code') }}</Label>
            <Input
              id="internal-product-code"
              v-model="model.code"
              placeholder="PRODUCT_CODE"
            />
          </div>

          <div class="space-y-2">
            <Label for="internal-product-status">{{ t('ui.status') }}</Label>
            <SearchableSelect
              id="internal-product-status"
              v-model="model.status"
              :options="statusOptions"
              :placeholder="t('ui.selectStatus')"
              :search-placeholder="t('ui.searchStatus')"
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="internal-product-name">{{ t('common.name') }}</Label>
          <Input
            id="internal-product-name"
            v-model="model.name"
            :placeholder="t('ui.productName')"
          />
        </div>

        <div class="space-y-2">
          <Label for="internal-product-description">{{ t('ui.description') }}</Label>
          <textarea
            id="internal-product-description"
            v-model="model.description"
            class="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            :placeholder="t('ui.describeTheProduct')"
            rows="4"
          />
        </div>

        <div class="flex justify-end">
          <Button
            type="submit"
            class="rounded-xl"
            :disabled="saving"
          >
            {{ saving ? t('common.saving') : submitLabel }}
          </Button>
        </div>
      </form>
    </div>
  </Card>
</template>
