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

const { text: uiText } = useLocale()

const submitLabel = computed(() => (
  model.value.id
    ? uiText('Save Product')
    : uiText('Create Product')
))
</script>

<template>
  <Card class="border-border/70 shadow-none">
    <div class="border-b border-border/70 px-5 py-4">
      <div class="text-base font-semibold">
        {{ uiText('Product Details') }}
      </div>
    </div>

    <div class="p-5">
      <div
        v-if="loading"
        class="text-sm text-muted-foreground"
      >
        {{ uiText('Loading product data...') }}
      </div>

      <form
        v-else
        class="space-y-4"
        @submit.prevent="emit('submit')"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="internal-product-code">{{ uiText('Code') }}</Label>
            <Input
              id="internal-product-code"
              v-model="model.code"
              placeholder="PRODUCT_CODE"
            />
          </div>

          <div class="space-y-2">
            <Label for="internal-product-status">{{ uiText('Status') }}</Label>
            <SearchableSelect
              id="internal-product-status"
              v-model="model.status"
              :options="statusOptions"
              :placeholder="uiText('Select status')"
              :search-placeholder="uiText('Search status...')"
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="internal-product-name">{{ uiText('Name') }}</Label>
          <Input
            id="internal-product-name"
            v-model="model.name"
            :placeholder="uiText('Product name')"
          />
        </div>

        <div class="space-y-2">
          <Label for="internal-product-description">{{ uiText('Description') }}</Label>
          <textarea
            id="internal-product-description"
            v-model="model.description"
            class="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            :placeholder="uiText('Describe the product')"
            rows="4"
          />
        </div>

        <div class="flex justify-end">
          <Button
            type="submit"
            class="rounded-xl"
            :disabled="saving"
          >
            {{ saving ? uiText('Saving...') : submitLabel }}
          </Button>
        </div>
      </form>
    </div>
  </Card>
</template>
