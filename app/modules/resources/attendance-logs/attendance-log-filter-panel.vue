<script setup lang="ts">
import { computed } from 'vue'
import type { AttendanceLogFilters, DatePreset, SelectOption } from './types'

defineOptions({ name: 'AttendanceLogFilterPanel' })

type AttendanceLogFilterPanelOptions = {
  employeeOptions: SelectOption[]
  statusOptions: SelectOption[]
  typeOptions: SelectOption[]
  sourceOptions: SelectOption[]
  selfieOptions: SelectOption[]
  orgUnitOptions: SelectOption[]
  branchOptions: SelectOption[]
  workLocationOptions: SelectOption[]
  exceptionOptions: SelectOption[]
}

const props = defineProps<{
  open: boolean
  filters: AttendanceLogFilters
  options?: AttendanceLogFilterPanelOptions
  employeeOptions?: SelectOption[]
  statusOptions?: SelectOption[]
  typeOptions?: SelectOption[]
  sourceOptions?: SelectOption[]
  selfieOptions?: SelectOption[]
  orgUnitOptions?: SelectOption[]
  branchOptions?: SelectOption[]
  workLocationOptions?: SelectOption[]
  exceptionOptions?: SelectOption[]
  isDatePresetActive: (preset: DatePreset) => boolean
}>()

const emit = defineEmits<{
  close: []
  clear: []
  applyDatePreset: [preset: DatePreset]
  updateFilter: [key: keyof AttendanceLogFilters, value: string]
}>()

const { t } = useLocale()

const datePresets: Array<{ value: DatePreset, labelKey: string }> = [
  { value: 'today', labelKey: 'ui.today' },
  { value: 'yesterday', labelKey: 'ui.yesterday' },
  { value: 'this_week', labelKey: 'ui.thisWeek' },
  { value: 'this_month', labelKey: 'ui.thisMonth' },
]

const updateFilter = (key: keyof AttendanceLogFilters, value: string) => {
  emit('updateFilter', key, value)
}

const updateSelectFilter = (key: keyof AttendanceLogFilters, value: string | number | null) => {
  emit('updateFilter', key, value === null ? '' : String(value))
}

const resolvedOptions = computed<AttendanceLogFilterPanelOptions>(() => ({
  employeeOptions: props.options?.employeeOptions ?? props.employeeOptions ?? [],
  statusOptions: props.options?.statusOptions ?? props.statusOptions ?? [],
  typeOptions: props.options?.typeOptions ?? props.typeOptions ?? [],
  sourceOptions: props.options?.sourceOptions ?? props.sourceOptions ?? [],
  selfieOptions: props.options?.selfieOptions ?? props.selfieOptions ?? [],
  orgUnitOptions: props.options?.orgUnitOptions ?? props.orgUnitOptions ?? [],
  branchOptions: props.options?.branchOptions ?? props.branchOptions ?? [],
  workLocationOptions: props.options?.workLocationOptions ?? props.workLocationOptions ?? [],
  exceptionOptions: props.options?.exceptionOptions ?? props.exceptionOptions ?? [],
}))
</script>

<template>
  <FloatingFilterPanel
    :open="props.open"
    :close-label="t('ui.closeFilters')"
    @close="emit('close')"
  >
    <div class="grid border-b border-border text-xs font-semibold text-foreground md:grid-cols-[280px_repeat(3,minmax(0,1fr))]">
      <div class="border-b border-border px-4 py-3 md:border-b-0 md:border-r">
        {{ t('ui.filterByDate') }}
      </div>
      <div class="border-b border-border px-4 py-3 md:border-b-0 md:border-r">
        {{ t('ui.employee') }}
      </div>
      <div class="border-b border-border px-4 py-3 md:border-b-0 md:border-r">
        {{ t('ui.status') }}
      </div>
      <div class="px-4 py-3">
        {{ t('ui.moreFilters') }}
      </div>
    </div>

    <div class="grid max-h-[62vh] overflow-auto md:grid-cols-[280px_repeat(3,minmax(0,1fr))]">
      <div class="border-b border-border p-4 md:border-b-0 md:border-r">
        <div class="space-y-2">
          <button
            v-for="preset in datePresets"
            :key="preset.value"
            type="button"
            class="flex w-full items-center justify-between gap-3 py-1.5 text-left text-sm hover:text-primary"
            @click="emit('applyDatePreset', preset.value)"
          >
            <span>{{ t(preset.labelKey) }}</span>
            <span
              class="h-3.5 w-3.5 rounded-full border"
              :class="props.isDatePresetActive(preset.value) ? 'border-primary bg-primary' : 'border-border'"
            />
          </button>
          <DateRangePicker
            :from="props.filters.date_from"
            :to="props.filters.date_to"
            :placeholder="t('ui.customDateRange')"
            @update:from="updateFilter('date_from', $event)"
            @update:to="updateFilter('date_to', $event)"
          />
        </div>
      </div>

      <div class="border-b border-border p-4 md:border-b-0 md:border-r">
        <SearchableSelect
          :model-value="props.filters.employee_id"
          :options="resolvedOptions.employeeOptions"
          :placeholder="t('ui.employee')"
          :search-placeholder="t('ui.searchEmployees')"
          class="w-full"
          @update:model-value="updateSelectFilter('employee_id', $event)"
        />
      </div>

      <div class="border-b border-border p-4 md:border-b-0 md:border-r">
        <div class="space-y-2">
          <button
            v-for="option in resolvedOptions.statusOptions"
            :key="option.value"
            type="button"
            class="flex w-full items-center justify-between gap-3 py-1.5 text-left text-sm hover:text-primary"
            @click="updateFilter('status', option.value)"
          >
            <span>{{ option.label }}</span>
            <span
              class="h-3.5 w-3.5 rounded-full border"
              :class="props.filters.status === option.value ? 'border-primary bg-primary' : 'border-border'"
            />
          </button>
        </div>
      </div>

      <div class="space-y-3 p-4">
        <SearchableSelect
          :model-value="props.filters.type"
          :options="resolvedOptions.typeOptions"
          :placeholder="t('ui.allTypes')"
          :search-placeholder="t('ui.searchType')"
          class="w-full"
          @update:model-value="updateSelectFilter('type', $event)"
        />
        <SearchableSelect
          :model-value="props.filters.source"
          :options="resolvedOptions.sourceOptions"
          :placeholder="t('ui.allSources')"
          :search-placeholder="t('ui.searchSource')"
          class="w-full"
          @update:model-value="updateSelectFilter('source', $event)"
        />
        <SearchableSelect
          :model-value="props.filters.selfie_status"
          :options="resolvedOptions.selfieOptions"
          :placeholder="t('ui.allPhotoStates')"
          :search-placeholder="t('ui.searchPhotoState')"
          class="w-full"
          @update:model-value="updateSelectFilter('selfie_status', $event)"
        />
        <SearchableSelect
          :model-value="props.filters.org_unit_id"
          :options="resolvedOptions.orgUnitOptions"
          :placeholder="t('ui.allOrgUnits')"
          :search-placeholder="t('ui.searchOrgUnit')"
          class="w-full"
          @update:model-value="updateSelectFilter('org_unit_id', $event)"
        />
        <SearchableSelect
          :model-value="props.filters.branch_id"
          :options="resolvedOptions.branchOptions"
          :placeholder="t('ui.allBranches')"
          :search-placeholder="t('ui.searchBranch')"
          class="w-full"
          @update:model-value="updateSelectFilter('branch_id', $event)"
        />
        <SearchableSelect
          :model-value="props.filters.work_location_id"
          :options="resolvedOptions.workLocationOptions"
          :placeholder="t('ui.allWorkLocations')"
          :search-placeholder="t('ui.searchWorkLocation')"
          class="w-full"
          @update:model-value="updateSelectFilter('work_location_id', $event)"
        />
        <SearchableSelect
          :model-value="props.filters.exception_type"
          :options="resolvedOptions.exceptionOptions"
          :placeholder="t('ui.allExceptions')"
          :search-placeholder="t('ui.searchException')"
          class="w-full"
          @update:model-value="updateSelectFilter('exception_type', $event)"
        />
      </div>
    </div>

    <div class="flex items-center justify-end gap-4 border-t border-border bg-background px-4 py-3 dark:bg-slate-950">
      <Button
        variant="ghost"
        size="sm"
        class="text-destructive hover:text-destructive"
        @click="emit('clear')"
      >
        {{ t('ui.clearFilter') }}
      </Button>
      <Button
        size="sm"
        @click="emit('close')"
      >
        {{ t('ui.submit') }}
      </Button>
    </div>
  </FloatingFilterPanel>
</template>
