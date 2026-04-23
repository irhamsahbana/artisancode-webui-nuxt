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

const { locale, text } = useLocale()

const open = ref(false)

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

const localizedPlaceholder = computed(() => text(props.placeholder))
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
</script>

<template>
  <div class="relative">
    <Button
      variant="outline"
      class="h-9 w-full justify-start text-left font-normal"
      @click="open = !open"
    >
      <CalendarDays class="h-4 w-4 shrink-0" />
      <span :class="(props.from || props.to) ? 'text-foreground' : 'text-muted-foreground'">
        {{ triggerLabel }}
      </span>
    </Button>

    <div v-if="open">
      <button
        type="button"
        class="fixed inset-0 z-40 bg-transparent"
        :aria-label="text('Close')"
        @click="open = false"
      />

      <div class="absolute left-0 top-full z-50 mt-2 w-[min(44rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-xl border bg-background p-4 shadow-2xl">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <div>
            <div class="text-sm font-medium">
              {{ text('Select date range') }}
            </div>
            <div class="text-xs text-muted-foreground">
              {{ text('Pick a start date, then an end date.') }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              @click="clearRange"
            >
              {{ text('Clear') }}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              @click="open = false"
            >
              {{ text('Close') }}
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
            {{ text('Start') }}: {{ props.from || '-' }}
          </span>
          <span class="rounded-full border px-2 py-1">
            {{ text('End') }}: {{ props.to || '-' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
