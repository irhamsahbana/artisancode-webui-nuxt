<script setup lang="ts">
import '~/assets/css/main.css'
import { computed, reactive } from 'vue'
import Badge from './badge.vue'
import Table from './table.vue'
import TableBody from './table-body.vue'
import TableCaption from './table-caption.vue'
import TableCell from './table-cell.vue'
import TableFooter from './table-footer.vue'
import TableHead from './table-head.vue'
import TableHeader from './table-header.vue'
import TableRow from './table-row.vue'

defineOptions({ name: 'UiTableStory' })

const state = reactive({
  compact: false,
  showFooter: true,
  showCaption: true,
  theme: 'light' as 'light' | 'dark',
})

const rows = computed(() => [
  { name: 'Jakarta HQ', active: 184, late: 12, status: 'Stable' },
  { name: 'Bandung Branch', active: 73, late: 8, status: 'Review' },
  { name: 'Makassar Site', active: 52, late: 3, status: 'Healthy' },
])

const cellClass = computed(() => state.compact ? 'px-3 py-2 text-xs' : '')
</script>

<template>
  <Story
    title="UI/Table"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="Resource summary">
      <div
        class="rounded-3xl p-6 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-950 text-slate-50' : 'bg-slate-100'"
      >
        <div class="overflow-hidden rounded-2xl border bg-background shadow-sm">
          <Table>
            <TableCaption v-if="state.showCaption">
              Attendance summary for active branches this week.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead :class="cellClass">
                  Branch
                </TableHead>
                <TableHead :class="cellClass">
                  Active
                </TableHead>
                <TableHead :class="cellClass">
                  Late
                </TableHead>
                <TableHead :class="cellClass">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="row in rows"
                :key="row.name"
              >
                <TableCell :class="cellClass">
                  <div class="font-medium">
                    {{ row.name }}
                  </div>
                </TableCell>
                <TableCell :class="cellClass">
                  {{ row.active }}
                </TableCell>
                <TableCell :class="cellClass">
                  {{ row.late }}
                </TableCell>
                <TableCell :class="cellClass">
                  <Badge
                    :class="row.status === 'Review' ? 'border-amber-300 bg-amber-100 text-amber-900' : 'border-emerald-300 bg-emerald-100 text-emerald-900'"
                  >
                    {{ row.status }}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
            <TableFooter v-if="state.showFooter">
              <TableRow>
                <TableCell
                  :class="cellClass"
                  colspan="3"
                >
                  Total active employees
                </TableCell>
                <TableCell :class="cellClass">
                  309
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>

      <template #controls>
        <HstSelect
          v-model="state.theme"
          title="Theme"
          :options="[
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ]"
        />
        <HstCheckbox
          v-model="state.compact"
          title="Compact cells"
        />
        <HstCheckbox
          v-model="state.showCaption"
          title="Show caption"
        />
        <HstCheckbox
          v-model="state.showFooter"
          title="Show footer"
        />
      </template>
    </Variant>
  </Story>
</template>
