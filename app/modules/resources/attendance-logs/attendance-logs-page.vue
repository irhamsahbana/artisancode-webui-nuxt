<script setup lang="ts">
import AttendanceLogDetailDialog from './attendance-log-detail-dialog.vue'
import AttendanceLogExportsCard from './attendance-log-exports-card.vue'
import AttendanceLogFilterPanel from './attendance-log-filter-panel.vue'
import { hasSelfie } from './attendance-log-format'
import { useAttendanceLogsManager } from './use-attendance-logs-manager'

defineOptions({ name: 'AttendanceLogsPage' })
const { t } = useLocale()
const {
  columns,
  filterPanelOptions,
  filters,
  listQuery,
  filterPanelOpen,
  exportListLoading,
  exportItems,
  exportMenuOpen,
  completedExportCount,
  pendingExportCount,
  exportMenuItems,
  toggleFilterPanel,
  closeFilterPanel,
  toggleExportMenu,
  closeExportMenu,
  isDatePresetActive,
  clearFilters,
  applyDatePreset,
  updateFilter,
  openSelfie,
  formatTimestamp,
  loadExports,
  downloadExport,
  handleExportMenuSelect,
} = useAttendanceLogsManager()
</script>

<template>
  <div class="space-y-6">
    <ResourceList
      :title="t('ui.attendanceLogs')"
      endpoint="/attendance-logs"
      :extra-query="listQuery"
      :columns="columns"
      :show-search-filter-trigger="true"
      :search-filter-open="filterPanelOpen"
      loading-variant="skeleton"
      :can-delete="false"
      @search-filter-trigger="toggleFilterPanel"
    >
      <template #header-actions>
        <div class="flex w-full items-center justify-end gap-2">
          <ActionMenu
            :open="exportMenuOpen"
            :label="t('ui.export')"
            :items="exportMenuItems"
            @toggle="toggleExportMenu"
            @close="closeExportMenu"
            @select="handleExportMenuSelect"
          />
        </div>
      </template>

      <template #filters>
        <AttendanceLogFilterPanel
          :filters="filters"
          :open="filterPanelOpen"
          :options="filterPanelOptions"
          :is-date-preset-active="isDatePresetActive"
          @close="closeFilterPanel"
          @clear="clearFilters"
          @apply-date-preset="applyDatePreset"
          @update-filter="updateFilter"
        />
      </template>

      <template #row-actions="{ row, close }">
        <button
          v-if="hasSelfie(row)"
          class="w-full rounded px-3 py-2 text-left hover:bg-accent"
          @click="openSelfie(row); close()"
        >
          {{ t('ui.viewPhoto') }}
        </button>
      </template>

      <template #detail="{ row, loading, close }">
        <AttendanceLogDetailDialog
          :row="row"
          :loading="loading"
          @close="close"
          @open-selfie="openSelfie"
        />
      </template>
    </ResourceList>

    <AttendanceLogExportsCard
      :loading="exportListLoading"
      :items="exportItems"
      :completed-count="completedExportCount"
      :pending-count="pendingExportCount"
      :format-timestamp="formatTimestamp"
      @refresh="loadExports"
      @download="downloadExport"
    />
  </div>
</template>
