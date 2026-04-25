<script setup lang="ts">
import type { AttendanceLogFilters, DatePreset, SelectOption } from './types'

defineOptions({ name: 'AttendanceLogFilterPanel' })

const props = defineProps<{
  open: boolean
  filters: AttendanceLogFilters
  employeeOptions: SelectOption[]
  statusOptions: SelectOption[]
  typeOptions: SelectOption[]
  sourceOptions: SelectOption[]
  selfieOptions: SelectOption[]
  orgUnitOptions: SelectOption[]
  branchOptions: SelectOption[]
  workLocationOptions: SelectOption[]
  exceptionOptions: SelectOption[]
  isDatePresetActive: (preset: DatePreset) => boolean
}>()

const emit = defineEmits<{
  close: []
  clear: []
  applyDatePreset: [preset: DatePreset]
  updateFilter: [key: keyof AttendanceLogFilters, value: string]
}>()

const { text: uiText } = useLocale()

const datePresets: Array<{ value: DatePreset, label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
]

const updateFilter = (key: keyof AttendanceLogFilters, value: string) => {
  emit('updateFilter', key, value)
}

const updateSelectFilter = (key: keyof AttendanceLogFilters, value: string | number | null) => {
  emit('updateFilter', key, value === null ? '' : String(value))
}
</script>

<template>
  <FloatingFilterPanel
    :open="props.open"
    :close-label="uiText('Close filters')"
    @close="emit('close')"
  >
    <div class="grid border-b border-border text-xs font-semibold text-foreground md:grid-cols-[280px_repeat(3,minmax(0,1fr))]">
      <div class="border-b border-border px-4 py-3 md:border-b-0 md:border-r">
        {{ uiText('Filter by date') }}
      </div>
      <div class="border-b border-border px-4 py-3 md:border-b-0 md:border-r">
        {{ uiText('Employee') }}
      </div>
      <div class="border-b border-border px-4 py-3 md:border-b-0 md:border-r">
        {{ uiText('Status') }}
      </div>
      <div class="px-4 py-3">
        {{ uiText('More filters') }}
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
            <span>{{ uiText(preset.label) }}</span>
            <span
              class="h-3.5 w-3.5 rounded-full border"
              :class="props.isDatePresetActive(preset.value) ? 'border-primary bg-primary' : 'border-border'"
            />
          </button>
          <DateRangePicker
            :from="props.filters.date_from"
            :to="props.filters.date_to"
            :placeholder="uiText('Custom date range')"
            @update:from="updateFilter('date_from', $event)"
            @update:to="updateFilter('date_to', $event)"
          />
        </div>
      </div>

      <div class="border-b border-border p-4 md:border-b-0 md:border-r">
        <SearchableSelect
          :model-value="props.filters.employee_id"
          :options="props.employeeOptions"
          :placeholder="uiText('Employee')"
          :search-placeholder="uiText('Search employees...')"
          class="w-full"
          @update:model-value="updateSelectFilter('employee_id', $event)"
        />
      </div>

      <div class="border-b border-border p-4 md:border-b-0 md:border-r">
        <div class="space-y-2">
          <button
            v-for="option in props.statusOptions"
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
          :options="props.typeOptions"
          :placeholder="uiText('All types')"
          :search-placeholder="uiText('Search type...')"
          class="w-full"
          @update:model-value="updateSelectFilter('type', $event)"
        />
        <SearchableSelect
          :model-value="props.filters.source"
          :options="props.sourceOptions"
          :placeholder="uiText('All sources')"
          :search-placeholder="uiText('Search source...')"
          class="w-full"
          @update:model-value="updateSelectFilter('source', $event)"
        />
        <SearchableSelect
          :model-value="props.filters.selfie_status"
          :options="props.selfieOptions"
          :placeholder="uiText('All photo states')"
          :search-placeholder="uiText('Search photo state...')"
          class="w-full"
          @update:model-value="updateSelectFilter('selfie_status', $event)"
        />
        <SearchableSelect
          :model-value="props.filters.org_unit_id"
          :options="props.orgUnitOptions"
          :placeholder="uiText('All org units')"
          :search-placeholder="uiText('Search org unit...')"
          class="w-full"
          @update:model-value="updateSelectFilter('org_unit_id', $event)"
        />
        <SearchableSelect
          :model-value="props.filters.branch_id"
          :options="props.branchOptions"
          :placeholder="uiText('All branches')"
          :search-placeholder="uiText('Search branch...')"
          class="w-full"
          @update:model-value="updateSelectFilter('branch_id', $event)"
        />
        <SearchableSelect
          :model-value="props.filters.work_location_id"
          :options="props.workLocationOptions"
          :placeholder="uiText('All work locations')"
          :search-placeholder="uiText('Search work location...')"
          class="w-full"
          @update:model-value="updateSelectFilter('work_location_id', $event)"
        />
        <SearchableSelect
          :model-value="props.filters.exception_type"
          :options="props.exceptionOptions"
          :placeholder="uiText('All exceptions')"
          :search-placeholder="uiText('Search exception...')"
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
        {{ uiText('Clear Filter') }}
      </Button>
      <Button
        size="sm"
        @click="emit('close')"
      >
        {{ uiText('Submit') }}
      </Button>
    </div>
  </FloatingFilterPanel>
</template>
