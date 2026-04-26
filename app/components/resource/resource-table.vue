<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useSlots,
  watch,
  type ComponentPublicInstance,
} from "vue";
import { formatIsoDateValue, resolveDateLocale } from "~/utils/date-time";

type Column = {
  key: string;
  label: string;
  format?: (
    value: unknown,
    row: Record<string, unknown>
  ) => string | { label: string; class?: string };
};

const props = withDefaults(
  defineProps<{
    columns: Column[];
    rows: Record<string, unknown>[];
    emptyText?: string;
    canViewDetail?: boolean;
    canDelete?: boolean;
    selectable?: boolean;
  }>(),
  {
    canViewDetail: true,
    canDelete: true,
    emptyText: undefined,
    selectable: true,
  }
);

const { locale, t } = useLocale();
const intlLocale = computed(() => resolveDateLocale(locale.value));

const emit = defineEmits<{
  (event: "delete", row: Record<string, unknown>): void;
  (event: "view", row: Record<string, unknown>): void;
  (event: "selection-change", keys: Array<string | number>): void;
}>();

const resolvedRows = computed(() => props.rows ?? []);
const slots = useSlots();
const hasCustomActions = computed(() => Boolean(slots["row-actions"]));
const openMenuKey = ref<string | number | null>(null);
const menuPosition = ref<{ top: number; left: number } | null>(null);
const menuRefs = ref<Record<string, HTMLElement | null>>({});
const menuAnchorRefs = ref<Record<string, HTMLElement | null>>({});
const hasActions = computed(
  () => props.canViewDetail || props.canDelete || hasCustomActions.value
);
const selectedKeys = ref<Set<string | number>>(new Set());
const rowKeys = computed(() =>
  resolvedRows.value.map((row, index) => getRowKey(row, index))
);
const localizedColumns = computed(() =>
  props.columns.map((column) => ({
    ...column,
    label: column.label,
  }))
);
const allSelected = computed(
  () =>
    rowKeys.value.length > 0 &&
    rowKeys.value.every((key) => selectedKeys.value.has(key))
);
const primaryColumn = computed(() => localizedColumns.value[0] ?? null);
const getSelectionLabel = (row: Record<string, unknown>, index: number) => {
  if (!primaryColumn.value) {
    return `${t("common.select")} ${index + 1}`;
  }

  return `${t("common.select")} ${renderFormattedCell(primaryColumn.value, row).value}`;
};

const formatCellValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "string") {
    const formatted = formatIsoDateValue(value, intlLocale.value, {
      dateOnly: {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
      dateTime: {
        dateStyle: "medium",
        timeStyle: "short",
      },
    });

    if (formatted) {
      return formatted;
    }

    return value;
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

const renderFormattedCell = (
  column: Column,
  row: Record<string, unknown>
) => {
  const rawValue = row[column.key];
  if (!column.format) {
    return {
      kind: "text" as const,
      value: formatCellValue(rawValue),
      class: "",
    };
  }

  const formatted = column.format(rawValue, row);
  if (
    formatted &&
    typeof formatted === "object" &&
    "label" in formatted &&
    typeof formatted.label === "string"
  ) {
    return {
      kind: "badge" as const,
      value: formatted.label,
      class:
        formatted.class ??
        "border-border/70 bg-muted/40 text-foreground",
    };
  }

  return {
    kind: "text" as const,
    value: typeof formatted === "string" ? formatted : formatCellValue(rawValue),
    class: "",
  };
};

const getRowKey = (row: Record<string, unknown>, index: number) => {
  const id = row.id ?? row.uuid ?? row.code;
  if (typeof id === "string" || typeof id === "number") {
    return id;
  }
  return index;
};

const syncSelection = () => {
  const nextKeys = new Set(
    rowKeys.value.filter((key) => selectedKeys.value.has(key))
  );
  selectedKeys.value = nextKeys;
  emit("selection-change", Array.from(nextKeys));
};

const toggleAll = () => {
  const nextKeys = new Set<string | number>();
  if (!allSelected.value) {
    rowKeys.value.forEach((key) => nextKeys.add(key));
  }
  selectedKeys.value = nextKeys;
  emit("selection-change", Array.from(nextKeys));
};

const toggleRow = (key: string | number) => {
  const nextKeys = new Set(selectedKeys.value);
  if (nextKeys.has(key)) {
    nextKeys.delete(key);
  } else {
    nextKeys.add(key);
  }
  selectedKeys.value = nextKeys;
  emit("selection-change", Array.from(nextKeys));
};

const closeMenu = () => {
  openMenuKey.value = null;
  menuPosition.value = null;
};

const resolveElement = (element: Element | ComponentPublicInstance | null) => {
  if (element instanceof HTMLElement) {
    return element;
  }
  if (element && "$el" in element && element.$el instanceof HTMLElement) {
    return element.$el;
  }
  return null;
};

const setMenuRef = (
  key: string | number,
  element: Element | ComponentPublicInstance | null
) => {
  menuRefs.value[String(key)] = resolveElement(element);
};

const setMenuAnchorRef = (
  key: string | number,
  element: Element | ComponentPublicInstance | null
) => {
  menuAnchorRefs.value[String(key)] = resolveElement(element);
};

const toggleMenu = (key: string | number, event: MouseEvent) => {
  if (openMenuKey.value === key) {
    closeMenu();
    return;
  }
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement) || !import.meta.client) {
    openMenuKey.value = key;
    menuPosition.value = null;
    setMenuAnchorRef(key, null);
    return;
  }
  setMenuAnchorRef(key, target);
  const rect = target.getBoundingClientRect();
  const optionCount =
    (props.canViewDetail ? 1 : 0) +
    (props.canDelete ? 1 : 0) +
    (hasCustomActions.value ? 1 : 0);
  const estimatedHeight = optionCount * 40 + 16;
  const menuWidth = 160;
  const padding = 8;
  const spaceBelow = window.innerHeight - rect.bottom;
  const top =
    spaceBelow < estimatedHeight
      ? Math.max(padding, rect.top - estimatedHeight - 4)
      : rect.bottom + 4;
  let left = rect.right - menuWidth;
  if (left < padding) {
    left = padding;
  }
  if (left + menuWidth > window.innerWidth - padding) {
    left = window.innerWidth - menuWidth - padding;
  }
  openMenuKey.value = key;
  menuPosition.value = { top, left };
};

const viewDetail = (row: Record<string, unknown>) => {
  closeMenu();
  emit("view", row);
};

const confirmDelete = (row: Record<string, unknown>) => {
  closeMenu();
  emit("delete", row);
};

const handleClickOutside = (event: MouseEvent) => {
  if (!openMenuKey.value) {
    return;
  }
  const target = event.target as Node;
  const activeKey = String(openMenuKey.value);
  const menuEl = menuRefs.value[activeKey];
  if (menuEl && menuEl.contains(target)) {
    return;
  }
  const buttonEl = menuAnchorRefs.value[activeKey];
  if (buttonEl && buttonEl.contains(target)) {
    return;
  }
  closeMenu();
};

const handleScroll = () => {
  if (openMenuKey.value) {
    closeMenu();
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    closeMenu();
  }
};

const closeInlineActions = () => {
  closeMenu();
};

onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside);
  document.addEventListener("keydown", handleKeydown);
  window.addEventListener("scroll", handleScroll, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleClickOutside);
  document.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("scroll", handleScroll, true);
});

watch(
  () => rowKeys.value,
  () => syncSelection()
);
</script>

<template>
  <div class="overflow-hidden rounded-[24px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(248,250,252,0.46))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.56),rgba(2,6,23,0.24))]">
    <div class="grid gap-3 p-3 md:hidden">
      <div
        v-if="props.selectable && resolvedRows.length > 0"
        class="flex items-center justify-between rounded-2xl border border-border/70 bg-background/75 px-4 py-3"
      >
        <div class="text-sm font-medium">
          {{ t("common.selectAll") }}
        </div>
        <input
          type="checkbox"
          role="checkbox"
          :aria-label="t('common.selectAll')"
          class="h-5 w-5 rounded border-input bg-background text-primary"
          :checked="allSelected"
          @change="toggleAll"
        >
      </div>
      <div
        v-for="(row, index) in resolvedRows"
        :key="`mobile-${getRowKey(row, index)}`"
        class="rounded-[22px] border border-border/70 bg-background/85 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.75)]"
      >
        <div class="flex items-start gap-3">
          <input
            v-if="props.selectable"
            type="checkbox"
            role="checkbox"
            :aria-label="getSelectionLabel(row, index)"
            class="mt-1 h-5 w-5 shrink-0 rounded border-input bg-background text-primary"
            :checked="selectedKeys.has(getRowKey(row, index))"
            @change="toggleRow(getRowKey(row, index))"
          >
          <div class="min-w-0 flex-1">
            <div
              v-if="primaryColumn"
              class="space-y-1"
            >
              <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {{ primaryColumn.label }}
              </div>
              <div class="break-words text-base font-semibold text-foreground">
                <template
                  v-if="renderFormattedCell(primaryColumn, row).kind === 'badge'"
                >
                  <span
                    class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium"
                    :class="renderFormattedCell(primaryColumn, row).class"
                  >
                    {{ renderFormattedCell(primaryColumn, row).value }}
                  </span>
                </template>
                <template v-else>
                  {{ renderFormattedCell(primaryColumn, row).value }}
                </template>
              </div>
            </div>
            <dl class="mt-4 space-y-3">
              <div
                v-for="column in localizedColumns.slice(primaryColumn ? 1 : 0)"
                :key="`mobile-${getRowKey(row, index)}-${column.key}`"
                class="grid gap-1"
              >
                <dt class="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {{ column.label }}
                </dt>
                <dd class="break-words text-sm text-foreground">
                  <template
                    v-if="renderFormattedCell(column, row).kind === 'badge'"
                  >
                    <span
                      class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium"
                      :class="renderFormattedCell(column, row).class"
                    >
                      {{ renderFormattedCell(column, row).value }}
                    </span>
                  </template>
                  <template v-else>
                    {{ renderFormattedCell(column, row).value }}
                  </template>
                </dd>
              </div>
            </dl>
            <div
              v-if="hasActions"
              class="mt-4 grid gap-2 border-t border-border/70 pt-3"
            >
              <Button
                v-if="props.canViewDetail"
                variant="outline"
                size="sm"
                class="h-10 rounded-xl justify-start"
                @click="viewDetail(row)"
              >
                {{ t("common.detail") }}
              </Button>
              <slot
                name="row-actions"
                :row="row"
                :close="closeInlineActions"
              />
              <Button
                v-if="props.canDelete"
                variant="destructive"
                size="sm"
                class="h-10 rounded-xl justify-start"
                @click="confirmDelete(row)"
              >
                {{ t("common.delete") }}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="resolvedRows.length === 0"
        class="rounded-[22px] border border-dashed border-border/70 bg-background/60 px-4 py-10 text-center text-sm text-muted-foreground"
      >
        {{ emptyText ?? t("common.noData") }}
      </div>
    </div>
    <div class="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              v-if="props.selectable"
              class="w-12"
            >
              <input
                type="checkbox"
                role="checkbox"
                :aria-label="t('common.selectAll')"
                class="h-5 w-5 rounded border-input bg-background text-primary"
                :checked="allSelected"
                @change="toggleAll"
              >
            </TableHead>
            <TableHead
              v-for="column in localizedColumns"
              :key="column.key"
            >
              {{ column.label }}
            </TableHead>
            <TableHead
              v-if="hasActions"
              class="w-10 text-right"
            >
              {{ t("common.actions") }}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="(row, index) in resolvedRows"
            :key="getRowKey(row, index)"
            class="transition hover:bg-muted/30"
          >
            <TableCell
              v-if="props.selectable"
              class="w-12 align-top"
            >
              <input
                type="checkbox"
                role="checkbox"
                :aria-label="`${t('common.select')} ${index + 1}`"
                class="mt-1 h-5 w-5 rounded border-input bg-background text-primary"
                :checked="selectedKeys.has(getRowKey(row, index))"
                @change="toggleRow(getRowKey(row, index))"
              >
            </TableCell>
            <TableCell
              v-for="column in localizedColumns"
              :key="column.key"
            >
              <template
                v-if="renderFormattedCell(column, row).kind === 'badge'"
              >
                <span
                  class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium"
                  :class="renderFormattedCell(column, row).class"
                >
                  {{ renderFormattedCell(column, row).value }}
                </span>
              </template>
              <template v-else>
                {{ renderFormattedCell(column, row).value }}
              </template>
            </TableCell>
            <TableCell
              v-if="hasActions"
              class="relative align-top text-right"
            >
              <Button
                :ref="(el) => setMenuAnchorRef(getRowKey(row, index), el)"
                variant="ghost"
                size="icon"
                class="rounded-xl"
                :aria-label="`${t('common.actions')} ${index + 1}`"
                @click="toggleMenu(getRowKey(row, index), $event)"
              >
                <span class="text-lg leading-none">⋯</span>
              </Button>
              <Teleport to="body">
                <div
                  v-if="openMenuKey === getRowKey(row, index) && menuPosition"
                  :ref="(el) => setMenuRef(getRowKey(row, index), el)"
                  class="fixed z-50 w-40 rounded-2xl border bg-popover p-1.5 text-sm shadow-xl"
                  role="menu"
                  :style="{
                    top: `${menuPosition.top}px`,
                    left: `${menuPosition.left}px`,
                  }"
                >
                  <button
                    v-if="props.canViewDetail"
                    class="w-full rounded px-3 py-2 text-left hover:bg-accent"
                    role="menuitem"
                    @click="viewDetail(row)"
                  >
                    {{ t("common.detail") }}
                  </button>
                  <slot
                    name="row-actions"
                    :row="row"
                    :close="closeMenu"
                  />
                  <button
                    v-if="props.canDelete"
                    class="w-full rounded px-3 py-2 text-left text-destructive hover:bg-accent"
                    role="menuitem"
                    @click="confirmDelete(row)"
                  >
                    {{ t("common.delete") }}
                  </button>
                </div>
              </Teleport>
            </TableCell>
          </TableRow>
          <TableRow v-if="resolvedRows.length === 0">
            <TableCell
              :colspan="
                columns.length + (hasActions ? 1 : 0) + (props.selectable ? 1 : 0)
              "
              class="py-10 text-center text-muted-foreground"
            >
              {{ emptyText ?? t("common.noData") }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
