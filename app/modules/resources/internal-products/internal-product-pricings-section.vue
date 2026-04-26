<script setup lang="ts">
import { computed } from 'vue'
import type { InternalProductPricing, InternalProductPricingForm } from './types'

defineOptions({ name: 'InternalProductPricingsSection' })

const model = defineModel<InternalProductPricingForm>({ required: true })

const props = defineProps<{
  enabled: boolean
  items: InternalProductPricing[]
  loading: boolean
  saving: boolean
  deletingId: string
  formMode: 'create' | 'edit'
  selectedPricingId: string
  statusOptions: Array<{ value: string, label: string }>
}>()

const emit = defineEmits<{
  delete: [pricing: InternalProductPricing]
  select: [pricingId: string]
  startCreate: []
  startEdit: [pricing: InternalProductPricing]
  submit: []
}>()

const { t } = useLocale()

const formTitle = computed(() => (
  props.formMode === 'edit'
    ? t('ui.editPricing')
    : t('ui.addPricing')
))

const formDescription = computed(() => (
  props.formMode === 'edit'
    ? t('ui.changesAreAppliedToTheSelectedPricingPackage')
    : t('ui.createANewPricingPackageForThisProduct')
))

const resetLabel = computed(() => (
  props.formMode === 'edit'
    ? t('ui.createNewPricing')
    : t('ui.clearForm')
))

const submitLabel = computed(() => (
  props.saving
    ? t('ui.saving')
    : formTitle.value
))

const selectedPricing = computed(() => (
  props.items.find((item) => item.id === props.selectedPricingId) ?? null
))

const isSelectedPricing = (pricingId: string) => pricingId === props.selectedPricingId

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'active':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'inactive':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'archived':
      return 'border-slate-200 bg-slate-100 text-slate-700'
    default:
      return 'border-border/70 bg-muted/40 text-foreground'
  }
}
</script>

<template>
  <Card class="border-border/70 shadow-none">
    <div class="flex items-start justify-between gap-3 border-b border-border/70 px-5 py-4">
      <div class="text-base font-semibold">
        {{ t('ui.pricings') }}
      </div>

      <Button
        size="sm"
        variant="outline"
        class="rounded-xl"
        :disabled="!enabled"
        @click="emit('startCreate')"
      >
        {{ t('ui.newPricing') }}
      </Button>
    </div>

    <div class="space-y-5 p-5">
      <div
        v-if="!enabled"
        class="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground"
      >
        {{ t('ui.saveProductFirstToContinue') }}
      </div>

      <template v-else>
        <div class="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div class="space-y-4">
            <div class="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              {{ t('ui.chooseAPricingPackageFromTheListItsDetailsWillOpenInTheEditorOnTheRight') }}
            </div>

            <div
              v-if="loading"
              class="text-sm text-muted-foreground"
            >
              {{ t('ui.loadingPricings') }}
            </div>

            <div
              v-else-if="items.length === 0"
              class="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground"
            >
              <div>{{ t('ui.noPricingYetForThisProduct') }}</div>
              <Button
                size="sm"
                variant="outline"
                class="mt-4 rounded-xl"
                @click="emit('startCreate')"
              >
                {{ t('ui.createFirstPricing') }}
              </Button>
            </div>

            <div
              v-else
              class="space-y-3"
            >
              <button
                v-for="pricing in items"
                :key="pricing.id"
                type="button"
                class="w-full rounded-2xl border px-4 py-4 text-left transition-colors"
                :class="isSelectedPricing(pricing.id)
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border/70 bg-background hover:border-primary/40 hover:bg-muted/20'"
                @click="emit('select', pricing.id)"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0 space-y-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="font-semibold">
                        {{ pricing.code }}
                      </span>
                      <Badge
                        v-if="isSelectedPricing(pricing.id)"
                        variant="secondary"
                      >
                        {{ t('ui.editing') }}
                      </Badge>
                    </div>
                    <div class="text-sm text-foreground">
                      {{ pricing.name }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{
                        isSelectedPricing(pricing.id)
                          ? t('ui.thisPackageIsCurrentlyOpenInTheEditor')
                          : t('ui.clickToEditThisPricingPackage')
                      }}
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <Badge :class="statusBadgeClass(pricing.status)">
                      {{ pricing.status }}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      class="rounded-xl"
                      :disabled="deletingId === pricing.id"
                      @click.stop="emit('delete', pricing)"
                    >
                      {{ deletingId === pricing.id ? t('ui.deleting') : t('ui.delete') }}
                    </Button>
                  </div>
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
                v-if="selectedPricing && formMode === 'edit'"
                class="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3"
              >
                <div class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {{ t('ui.selectedPricingPackage') }}
                </div>
                <div class="mt-1 text-sm font-semibold">
                  {{ selectedPricing.name }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ selectedPricing.code }}
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <Label for="internal-pricing-code">{{ t('ui.code') }}</Label>
                  <Input
                    id="internal-pricing-code"
                    v-model="model.code"
                    placeholder="MONTHLY"
                  />
                </div>

                <div class="space-y-2">
                  <Label for="internal-pricing-status">{{ t('ui.status') }}</Label>
                  <SearchableSelect
                    id="internal-pricing-status"
                    v-model="model.status"
                    :options="statusOptions"
                    :placeholder="t('ui.selectStatus')"
                    :search-placeholder="t('ui.searchStatus')"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <Label for="internal-pricing-name">{{ t('ui.name') }}</Label>
                <Input
                  id="internal-pricing-name"
                  v-model="model.name"
                  :placeholder="t('ui.pricingPlanName')"
                />
              </div>

              <div class="space-y-2">
                <Label for="internal-pricing-description">{{ t('ui.description') }}</Label>
                <textarea
                  id="internal-pricing-description"
                  v-model="model.description"
                  class="flex min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  :placeholder="t('ui.describeThePricingPlan')"
                  rows="4"
                />
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
