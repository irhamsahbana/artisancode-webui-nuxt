<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { formatDateOnlyValue, parseIsoDateOnlyLocal, resolveDateLocale } from '~/utils/date-time'

defineOptions({ name: 'UiDateRangePicker' })

type CalendarCell = {
  iso: string
  label: number
  inMonth: boolean
}

const props = withDefaults(
  defineProps<{
    from?: string
    to?: string
    placeholder?: string
  }>(),
  {
    from: '',
    to: '',
    placeholder: 'Select date range',
  },
)

const emit = defineEmits<{
  'update:from': [value: string]
  'update:to': [value: string]
}>()

const { locale, t } = useLocale()

const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const popoverPosition = ref({
  top: 0,
  left: 0,
  width: 704,
})

const toLocalIso = (date: Date) => {
  const timezoneOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

const parseIsoDate = (value: string) => {
  return parseIsoDateOnlyLocal(value)
}

const getTodayIso = () => toLocalIso(new Date())

const createMonthDate = (value?: string | null) => {
  const parsed = value ? parseIsoDate(value) : null
  const base = parsed ?? parseIsoDate(getTodayIso()) ?? new Date()
  return new Date(base.getFullYear(), base.getMonth(), 1)
}

const displayMonth = ref(createMonthDate(props.from || props.to))

watch(
  () => [props.from, props.to],
  ([from, to]) => {
    if (!open.value) {
      displayMonth.value = createMonthDate(from || to)
    }
  },
)

const monthLabel = (date: Date) =>
  date.toLocaleDateString(resolveDateLocale(locale.value), {
    month: 'long',
    year: 'numeric',
  })

const formatTriggerLabel = (from: string, to: string) => {
  const format = (value: string) => (
    formatDateOnlyValue(value, resolveDateLocale(locale.value), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) ?? value
  )

  if (from && to) {
    return from === to ? format(from) : `${format(from)} - ${format(to)}`
  }

  return format(from || to)
}

const localizedPlaceholder = computed(() => props.placeholder)
const triggerLabel = computed(() => {
  if (!props.from && !props.to) {
    return localizedPlaceholder.value
  }

  return formatTriggerLabel(props.from, props.to)
})
const dayLabels = computed(() => (
  locale.value === 'en'
    ? ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
    : ['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg']
))

const buildMonthCells = (monthDate: Date): CalendarCell[] => {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - startOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(gridStart)
    cellDate.setDate(gridStart.getDate() + index)

    return {
      iso: toLocalIso(cellDate),
      label: cellDate.getDate(),
      inMonth: cellDate.getMonth() === monthDate.getMonth(),
    }
  })
}

const currentMonthCells = computed(() => buildMonthCells(displayMonth.value))
const nextMonthDate = computed(() => new Date(displayMonth.value.getFullYear(), displayMonth.value.getMonth() + 1, 1))
const nextMonthCells = computed(() => buildMonthCells(nextMonthDate.value))

const startValue = computed(() => props.from || '')
const endValue = computed(() => props.to || '')

const isSameDay = (left: string, right: string) => left === right
const isInRange = (value: string) => {
  if (!startValue.value || !endValue.value) {
    return false
  }

  return value > startValue.value && value < endValue.value
}

const selectDate = (value: string) => {
  if (!props.from || (props.from && props.to)) {
    emit('update:from', value)
    emit('update:to', '')
    return
  }

  if (value < props.from) {
    emit('update:from', value)
    emit('update:to', props.from)
    open.value = false
    return
  }

  emit('update:to', value)
  open.value = false
}

const shiftMonth = (step: number) => {
  displayMonth.value = new Date(displayMonth.value.getFullYear(), displayMonth.value.getMonth() + step, 1)
}

const clearRange = () => {
  emit('update:from', '')
  emit('update:to', '')
}

const updatePopoverPosition = () => {
  if (!import.meta.client || !triggerRef.value) {
    return
  }

  const rect = triggerRef.value.getBoundingClientRect()
  const padding = 16
  const width = Math.min(704, window.innerWidth - (padding * 2))
  const left = Math.min(
    Math.max(padding, rect.left),
    Math.max(padding, window.innerWidth - width - padding),
  )

  popoverPosition.value = {
    top: rect.bottom + 8,
    left,
    width,
  }
}

const toggleOpen = () => {
  if (!open.value) {
    updatePopoverPosition()
  }
  open.value = !open.value
}

const popoverStyle = computed(() => ({
  top: `${popoverPosition.value.top}px`,
  left: `${popoverPosition.value.left}px`,
  width: `${popoverPosition.value.width}px`,
}))
</script>

<template>
  <div
    ref="triggerRef"
    class="relative"
  >
    <Button
      variant="outline"
      class="h-9 w-full justify-start text-left font-normal"
      @click="toggleOpen"
    >
      <CalendarDays class="h-4 w-4 shrink-0" />
      <span :class="(props.from || props.to) ? 'text-foreground' : 'text-muted-foreground'">
        {{ triggerLabel }}
      </span>
    </Button>

    <Teleport to="body">
      <button
        v-if="open"
        type="button"
        class="fixed inset-0 z-40 bg-transparent"
        :aria-label="t('ui.close')"
        @click="open = false"
      />

      <div
        v-if="open"
        class="fixed z-50 max-w-[calc(100vw-2rem)] rounded-xl border bg-background p-4 shadow-2xl"
        :style="popoverStyle"
      >
        <div class="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <div>
            <div class="text-sm font-medium">
              {{ t('ui.selectDateRange') }}
            </div>
            <div class="text-xs text-muted-foreground">
              {{ t('ui.pickAStartDateThenAnEndDate') }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              @click="clearRange"
            >
              {{ t('ui.clear') }}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              @click="open = false"
            >
              {{ t('ui.close') }}
            </Button>
          </div>
        </div>

        <div class="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <div class="mb-3 flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                @click="shiftMonth(-1)"
              >
                <ChevronLeft class="h-4 w-4" />
              </Button>
              <div class="text-sm font-medium">
                {{ monthLabel(displayMonth) }}
              </div>
              <div class="w-8" />
            </div>

            <div class="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              <div
                v-for="day in dayLabels"
                :key="day"
                class="py-1"
              >
                {{ day }}
              </div>
            </div>
            <div class="grid grid-cols-7 gap-1">
              <button
                v-for="cell in currentMonthCells"
                :key="cell.iso"
                type="button"
                :class="[
                  'h-10 rounded-md text-sm transition-colors',
                  cell.inMonth ? 'text-foreground' : 'text-muted-foreground/50',
                  isSameDay(cell.iso, startValue) || isSameDay(cell.iso, endValue)
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : isInRange(cell.iso)
                      ? 'bg-primary/10 text-foreground hover:bg-primary/15'
                      : 'hover:bg-accent',
                ]"
                @click="selectDate(cell.iso)"
              >
                {{ cell.label }}
              </button>
            </div>
          </div>

          <div>
            <div class="mb-3 flex items-center justify-between">
              <div class="w-8" />
              <div class="text-sm font-medium">
                {{ monthLabel(nextMonthDate) }}
              </div>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                @click="shiftMonth(1)"
              >
                <ChevronRight class="h-4 w-4" />
              </Button>
            </div>

            <div class="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              <div
                v-for="day in dayLabels"
                :key="day"
                class="py-1"
              >
                {{ day }}
              </div>
            </div>
            <div class="grid grid-cols-7 gap-1">
              <button
                v-for="cell in nextMonthCells"
                :key="cell.iso"
                type="button"
                :class="[
                  'h-10 rounded-md text-sm transition-colors',
                  cell.inMonth ? 'text-foreground' : 'text-muted-foreground/50',
                  isSameDay(cell.iso, startValue) || isSameDay(cell.iso, endValue)
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : isInRange(cell.iso)
                      ? 'bg-primary/10 text-foreground hover:bg-primary/15'
                      : 'hover:bg-accent',
                ]"
                @click="selectDate(cell.iso)"
              >
                {{ cell.label }}
              </button>
            </div>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
          <span class="rounded-full border px-2 py-1">
            {{ t('ui.start') }}: {{ props.from || '-' }}
          </span>
          <span class="rounded-full border px-2 py-1">
            {{ t('ui.end') }}: {{ props.to || '-' }}
          </span>
        </div>
      </div>
    </Teleport>
  </div>
</template>
