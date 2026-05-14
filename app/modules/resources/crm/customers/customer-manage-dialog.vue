<script setup lang="ts">
import type { CustomerFormState } from './customer-form'
import type { SearchableCreatableOption } from '~/components/ui/searchable-creatable-select.vue'

defineOptions({ name: 'CustomerManageDialog' })

type SearchableCreatableFetchResult = SearchableCreatableOption[] | {
  options: SearchableCreatableOption[]
}

const props = withDefaults(defineProps<{
  open: boolean
  mode: 'create' | 'edit'
  loading?: boolean
  saving?: boolean
  entityTypeOptions: Array<{ value: string; label: string }>
  customerTypeOptions: Array<{ value: string; label: string }>
  segmentOptions: Array<{ value: string; label: string }>
  areaOptions: Array<{ value: string; label: string }>
  customerStatusOptions: Array<{ value: string; label: string }>
  levelOptions: Array<{ value: string; label: string }>
  relationshipStatusOptions: Array<{ value: string; label: string }>
  fetchCompanyNameOptions: (query: string, page: number) => Promise<SearchableCreatableFetchResult>
  createCompanyNameOption: (query: string) => Promise<SearchableCreatableOption | null>
}>(), {
  loading: false,
  saving: false,
})

const emit = defineEmits<{
  close: []
  submit: []
}>()

const { t } = useLocale()
const form = defineModel<CustomerFormState>('form', { required: true })
const formId = 'customer-manage-form'
</script>

<template>
  <FormDialogShell
    v-if="props.open"
    max-width-class="max-w-4xl"
    :title="props.mode === 'create' ? t('ui.addCustomer') : t('ui.editCustomer')"
    :description="t('ui.manageCustomerProfileAndContractSummaryInOnePlace')"
    @close="emit('close')"
  >
    <div
      v-if="props.loading"
      class="text-sm text-muted-foreground"
    >
      {{ t('ui.loading2') }}
    </div>

    <form
      v-else
      :id="formId"
      class="space-y-5"
      @submit.prevent="emit('submit')"
    >
      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-2">
          <Label>{{ t('ui.customerEntityType') }} *</Label>
          <SearchableSelect
            v-model="form.customer_entity_type"
            :options="props.entityTypeOptions"
            :placeholder="t('ui.selectCustomerEntityType')"
            :search-placeholder="t('common.search')"
          />
        </div>

        <div class="space-y-2">
          <Label for="customer-display-name">{{ t('ui.displayName') }} *</Label>
          <Input
            id="customer-display-name"
            v-model="form.display_name"
            :placeholder="t('ui.displayName')"
          />
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-2">
          <Label for="customer-company-name">{{ t('company.companyName') }}</Label>
          <SearchableCreatableSelect
            id="customer-company-name"
            v-model="form.company_name"
            model-key="label"
            :fetch-options="props.fetchCompanyNameOptions"
            :create-option="props.createCompanyNameOption"
            :allow-create="true"
            :placeholder="t('company.companyName')"
            :search-placeholder="t('ui.searchCategories')"
          />
        </div>

        <div class="space-y-2">
          <Label for="customer-individual-name">{{ t('ui.individualName') }}</Label>
          <Input
            id="customer-individual-name"
            v-model="form.individual_name"
            :placeholder="t('ui.individualName')"
          />
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-2">
          <Label>{{ t('ui.customerTypes') }}</Label>
          <SearchableSelect
            v-model="form.customer_type_id"
            :options="props.customerTypeOptions"
            :placeholder="t('ui.selectCustomerType')"
            :search-placeholder="t('common.search')"
          />
        </div>

        <div class="space-y-2">
          <Label>{{ t('ui.segments') }}</Label>
          <SearchableSelect
            v-model="form.segment_id"
            :options="props.segmentOptions"
            :placeholder="t('ui.selectSegment')"
            :search-placeholder="t('common.search')"
          />
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-2">
          <Label for="customer-business-field">{{ t('ui.businessField') }}</Label>
          <Input
            id="customer-business-field"
            v-model="form.business_field"
            :placeholder="t('ui.businessField')"
          />
        </div>

        <div class="space-y-2">
          <Label for="customer-profession">{{ t('ui.profession') }}</Label>
          <Input
            id="customer-profession"
            v-model="form.profession"
            :placeholder="t('ui.profession')"
          />
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <div class="space-y-2 md:col-span-3">
          <Label for="customer-address">{{ t('ui.address') }}</Label>
          <textarea
            id="customer-address"
            v-model="form.address"
            class="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div class="space-y-2">
          <Label for="customer-city">{{ t('ui.city') }}</Label>
          <Input
            id="customer-city"
            v-model="form.city"
            :placeholder="t('ui.city')"
          />
        </div>

        <div class="space-y-2">
          <Label for="customer-province">{{ t('ui.province') }}</Label>
          <Input
            id="customer-province"
            v-model="form.province"
            :placeholder="t('ui.province')"
          />
        </div>

        <div class="space-y-2">
          <Label>{{ t('ui.areas') }}</Label>
          <SearchableSelect
            v-model="form.area_id"
            :options="props.areaOptions"
            :placeholder="t('ui.selectArea')"
            :search-placeholder="t('common.search')"
          />
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <div class="space-y-2">
          <Label for="customer-phone">{{ t('ui.phone') }}</Label>
          <Input
            id="customer-phone"
            v-model="form.phone"
            :placeholder="t('ui.phone')"
          />
        </div>

        <div class="space-y-2">
          <Label for="customer-whatsapp">{{ t('ui.whatsappNumber') }}</Label>
          <Input
            id="customer-whatsapp"
            v-model="form.whatsapp_number"
            :placeholder="t('ui.whatsappNumber')"
          />
        </div>

        <div class="space-y-2">
          <Label for="customer-email">{{ t('ui.email') }}</Label>
          <Input
            id="customer-email"
            v-model="form.email"
            type="email"
            :placeholder="t('ui.email')"
          />
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-4">
        <div class="space-y-2">
          <Label>{{ t('ui.customerStatus') }} *</Label>
          <SearchableSelect
            v-model="form.customer_status"
            :options="props.customerStatusOptions"
            :placeholder="t('ui.selectCustomerStatus')"
            :search-placeholder="t('common.search')"
          />
        </div>

        <div class="space-y-2">
          <Label>{{ t('ui.potentialLevel') }} *</Label>
          <SearchableSelect
            v-model="form.potential_level"
            :options="props.levelOptions"
            :placeholder="t('ui.selectPotentialLevel')"
            :search-placeholder="t('common.search')"
          />
        </div>

        <div class="space-y-2">
          <Label>{{ t('ui.followUpPriority') }} *</Label>
          <SearchableSelect
            v-model="form.follow_up_priority"
            :options="props.levelOptions"
            :placeholder="t('ui.selectFollowUpPriority')"
            :search-placeholder="t('common.search')"
          />
        </div>

        <div class="space-y-2">
          <Label>{{ t('ui.relationshipStatuses') }}</Label>
          <SearchableSelect
            v-model="form.relationship_status_id"
            :options="props.relationshipStatusOptions"
            :placeholder="t('ui.selectRelationshipStatus')"
            :search-placeholder="t('common.search')"
          />
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-2">
          <Label for="customer-primary-contact-name">{{ t('ui.primaryContactName') }}</Label>
          <Input
            id="customer-primary-contact-name"
            v-model="form.primary_contact_name"
            :placeholder="t('ui.primaryContactName')"
          />
        </div>

        <div class="space-y-2">
          <Label for="customer-primary-contact-role">{{ t('ui.primaryContactRole') }}</Label>
          <Input
            id="customer-primary-contact-role"
            v-model="form.primary_contact_role"
            :placeholder="t('ui.primaryContactRole')"
          />
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <label class="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
          <input
            v-model="form.has_contract_before"
            type="checkbox"
            class="h-4 w-4"
          >
          <span>{{ t('ui.hasContractBefore') }}</span>
        </label>

        <div class="space-y-2">
          <Label for="customer-last-contract-value">{{ t('ui.lastContractValue') }}</Label>
          <Input
            id="customer-last-contract-value"
            v-model="form.last_contract_value"
            type="number"
            min="0"
            step="0.01"
            :placeholder="t('ui.lastContractValue')"
          />
        </div>

        <div class="space-y-2">
          <Label for="customer-last-contract-year">{{ t('ui.lastContractYear') }}</Label>
          <Input
            id="customer-last-contract-year"
            v-model="form.last_contract_year"
            type="number"
            min="1900"
            max="2100"
            :placeholder="t('ui.lastContractYear')"
          />
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-2">
          <Label for="customer-contract-notes">{{ t('ui.contractNotes') }}</Label>
          <textarea
            id="customer-contract-notes"
            v-model="form.contract_notes"
            class="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div class="space-y-2">
          <Label for="customer-general-notes">{{ t('ui.generalNotes') }}</Label>
          <textarea
            id="customer-general-notes"
            v-model="form.general_notes"
            class="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          class="rounded-xl"
          :disabled="props.loading || props.saving"
          @click="emit('close')"
        >
          {{ t('ui.cancel') }}
        </Button>
        <Button
          size="sm"
          class="rounded-xl"
          :disabled="props.loading || props.saving"
          :form="formId"
          type="submit"
        >
          {{ props.saving ? t('ui.saving') : (props.mode === 'create' ? t('ui.create') : t('ui.update')) }}
        </Button>
      </div>
    </template>
  </FormDialogShell>
</template>
