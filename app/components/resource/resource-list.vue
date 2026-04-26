<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, useSlots, watch } from "vue";
import { useAsyncData, useRoute, useRouter } from "#app";
import { ChevronDown } from "lucide-vue-next";

import type { ApiResponse, ListResponse } from "~/types/api";
import { useApi } from "~/composables/useApi";
import { useBanner } from "~/composables/useBanner";
import { formatIsoDateValue, resolveDateLocale } from "~/utils/date-time";

type Column = {
  key: string;
  label: string;
  format?: (
    value: unknown,
    row: Record<string, unknown>
  ) => string | { label: string; class?: string };
};

const DEFAULT_SEARCH_DEBOUNCE_MS = 600;

const props = withDefaults(
  defineProps<{
    title: string;
    endpoint: string;
    columns: Column[];
    extraQuery?: Record<string, unknown>;
    searchKey?: string | null;
    searchPlaceholder?: string | null;
    searchDebounceMs?: number;
    loadingVariant?: "text" | "skeleton";
    emptyText?: string;
    canViewDetail?: boolean;
    canDelete?: boolean;
    authMode?: "user" | "internal" | "none";
    deleteLabelKey?: string | null;
    deleteLabelFormatter?: (row: Record<string, unknown>) => string;
    showSearchFilterTrigger?: boolean;
    searchFilterOpen?: boolean;
    refreshToken?: number;
  }>(),
  {
    extraQuery: undefined,
    searchKey: "q",
    searchPlaceholder: null,
    searchDebounceMs: DEFAULT_SEARCH_DEBOUNCE_MS,
    loadingVariant: "text",
    emptyText: undefined,
    canViewDetail: true,
    canDelete: true,
    authMode: "user",
    deleteLabelKey: "name",
    deleteLabelFormatter: () => "",
    showSearchFilterTrigger: false,
    searchFilterOpen: false,
    refreshToken: 0,
  }
);

const emit = defineEmits<{
  searchFilterTrigger: [];
}>();

const query = reactive({
  q: "",
  page: 1,
  limit: 15,
});

const { apiFetch } = useApi();
const { show } = useBanner();
const route = useRoute();
const router = useRouter();
const localePath = useLocalePath();
const { locale, t, format } = useLocale();
const intlLocale = computed(() => resolveDateLocale(locale.value));
const detailOpen = ref(false);
const detailRow = ref<Record<string, unknown> | null>(null);
const detailLoading = ref(false);
const detailId = ref<string | null>(null);
const listRequestController = ref<AbortController | null>(null);
const detailRequestController = ref<AbortController | null>(null);
const deleteOpen = ref(false);
const deleteRowTarget = ref<Record<string, unknown> | null>(null);
const deleteLoading = ref(false);

const buildQuery = () => {
  const base: Record<string, unknown> = {
    page: query.page,
    limit: query.limit,
    paginate: query.limit,
  };

  if (props.extraQuery) {
    for (const [key, value] of Object.entries(props.extraQuery)) {
      if (value !== "" && value !== null && value !== undefined) {
        base[key] = value;
      }
    }
  }

  if (props.searchKey && query.q) {
    base[props.searchKey] = query.q;
  }

  return base;
};

const getStringQueryValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : "";
  }

  return typeof value === "string" ? value : "";
};

const getPositiveNumberQueryValue = (value: unknown, fallback: number) => {
  const rawValue = getStringQueryValue(value);
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const applyRouteQueryToListQuery = () => {
  if (props.searchKey) {
    query.q = getStringQueryValue(route.query.q);
  }
  query.page = getPositiveNumberQueryValue(route.query.page, 1);
  query.limit = getPositiveNumberQueryValue(route.query.limit, 15);
};

applyRouteQueryToListQuery();

const asyncKey = `resource-list:${props.endpoint}`;

const { data, pending, refresh, error } = useAsyncData(
  asyncKey,
  () => {
    listRequestController.value?.abort();
    listRequestController.value = import.meta.client ? new AbortController() : null;
    return apiFetch<ListResponse<Record<string, unknown>>>(props.endpoint, {
      query: buildQuery(),
      signal: listRequestController.value?.signal,
      authMode: props.authMode,
    });
  },
  { server: false }
);

watch(
  () => [query.page, query.limit],
  () => refresh()
);

watch(
  () => [query.q, query.page, query.limit],
  async () => {
    const nextQuery = { ...route.query };

    if (props.searchKey && query.q) {
      nextQuery.q = query.q;
    } else {
      delete nextQuery.q;
    }

    if (query.page > 1) {
      nextQuery.page = String(query.page);
    } else {
      delete nextQuery.page;
    }

    if (query.limit !== 15) {
      nextQuery.limit = String(query.limit);
    } else {
      delete nextQuery.limit;
    }

    const queryChanged =
      getStringQueryValue(route.query.q) !== (props.searchKey ? query.q : "") ||
      getStringQueryValue(route.query.page) !== (query.page > 1 ? String(query.page) : "") ||
      getStringQueryValue(route.query.limit) !== (query.limit !== 15 ? String(query.limit) : "");

    if (queryChanged) {
      await router.replace({ query: nextQuery });
    }
  }
);

watch(
  () => route.query,
  () => {
    applyRouteQueryToListQuery();
  }
);

watch(
  () => JSON.stringify(props.extraQuery ?? {}),
  () => {
    query.page = 1;
    refresh();
  }
);

watch(
  () => props.refreshToken,
  () => {
    refresh();
  }
);

watch(
  () => query.limit,
  (value, previous) => {
    if (value !== previous) {
      query.page = 1;
    }
  }
);

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => query.q,
  () => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    const delay = props.searchDebounceMs ?? 0;
    if (delay > 0) {
      searchDebounceTimer = setTimeout(() => {
        refresh();
      }, delay);
      return;
    }
    refresh();
  }
);

onBeforeUnmount(() => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  listRequestController.value?.abort();
  detailRequestController.value?.abort();
});

const lastSuccessfulResponse = ref<
  ApiResponse<ListResponse<Record<string, unknown>>> | undefined
>(undefined);
const response = computed(
  () =>
    data.value as ApiResponse<ListResponse<Record<string, unknown>>> | undefined
);
const resolvedResponse = computed(() =>
  response.value?.success ? response.value : lastSuccessfulResponse.value,
);
watch(
  () => response.value,
  (value) => {
    if (value?.success) {
      lastSuccessfulResponse.value = value;
    }
  },
  { immediate: true },
);
const rows = computed(() => resolvedResponse.value?.data?.items ?? []);
const showInitialSkeleton = computed(() => pending.value && rows.value.length === 0);
const showRefreshingState = computed(() => pending.value && rows.value.length > 0);
const pagination = computed(() => {
  const data = resolvedResponse.value?.data as
    | (ListResponse<Record<string, unknown>> & {
      meta?: {
        page?: number;
        paginate?: number;
        total_data?: number;
        total_page?: number;
      };
    })
    | undefined;

  if (data?.pagination) {
    return data.pagination;
  }

  if (data?.meta) {
    return {
      page: data.meta.page ?? query.page,
      per_page: data.meta.paginate ?? query.limit,
      total: data.meta.total_data ?? rows.value.length,
      last_page: data.meta.total_page ?? 1,
    };
  }

  return undefined;
});
const currentPage = computed(() => pagination.value?.page ?? query.page ?? 1);
const lastPage = computed(() => pagination.value?.last_page ?? 1);
const skeletonRows = computed(() => Math.max(1, Number(query.limit ?? 1)));
const slots = useSlots();
const hasDetailSlot = computed(() => Boolean(slots.detail));
const hasHeaderActions = computed(() => Boolean(slots["header-actions"]));
const hasRowActions = computed(() => Boolean(slots["row-actions"]));
const resolvedSearchPlaceholder = computed(() => {
  if (props.searchPlaceholder) {
    return props.searchPlaceholder;
  }

  return `${t("common.search")}…`;
});
const localizedTitle = computed(() =>
  props.title
);
const localizedEmptyText = computed(() => {
  if (props.emptyText) {
    return props.emptyText;
  }

  return t("common.noData");
});

const detailEntries = computed(() => {
  if (!detailRow.value) {
    return [];
  }
  return Object.entries(detailRow.value);
});

const formatValue = (value: unknown) => {
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

const getRowId = (row: Record<string, unknown>) => {
  const id = row.id ?? row.uuid ?? row.code;
  if (typeof id === "string" || typeof id === "number") {
    return id;
  }
  return null;
};

const closeDetail = () => {
  detailOpen.value = false;
  detailRow.value = null;
  detailLoading.value = false;
  detailId.value = null;
};

const getRouteId = () => {
  const idParam = route.params.id;
  if (typeof idParam === "string" && idParam.length > 0) {
    return idParam;
  }
  return null;
};

const getBasePath = () => {
  const normalizedPath = route.path.replace(/^\/en(?=\/|$)/, "") || "/";
  const idParam = getRouteId();
  if (idParam && normalizedPath.endsWith(`/${idParam}`)) {
    return normalizedPath.slice(0, -`/${idParam}`.length);
  }
  return normalizedPath;
};

const openDetailById = async (id: string) => {
  if (!props.canViewDetail) {
    return;
  }
  detailId.value = id;
  detailOpen.value = true;
  detailLoading.value = true;
  detailRow.value = null;
  detailRequestController.value?.abort();
  detailRequestController.value = import.meta.client ? new AbortController() : null;
  const response = await apiFetch<Record<string, unknown>>(
    `${props.endpoint}/${id}`,
    {
      signal: detailRequestController.value?.signal,
      authMode: props.authMode,
    }
  );
  if (response.success && response.data) {
    detailRow.value = response.data;
  }
  detailLoading.value = false;
};

const openDetail = async (row: Record<string, unknown>) => {
  if (!props.canViewDetail) {
    return;
  }
  const id = getRowId(row);
  if (id === null) {
    show(t("resource.detailNotAvailable"), "error");
    return;
  }
  const idString = String(id);
  const basePath = getBasePath();

  // When no detail slot is provided, always navigate to a separate page
  // (page-based navigation). Never open a modal.
  if (!hasDetailSlot.value) {
    await router.push(localePath(`${basePath}/${idString}`));
    return;
  }

  // When a detail slot is provided, use the modal pattern:
  // push route if not already there, then load data into the modal.
  if (getRouteId() !== idString) {
    await router.push(localePath(`${basePath}/${idString}`));
    return;
  }
  await openDetailById(idString);
};

const closeDetailWithRoute = async () => {
  closeDetail();
  const basePath = getBasePath();
  const normalizedPath = route.path.replace(/^\/en(?=\/|$)/, "") || "/";
  if (normalizedPath !== basePath) {
    await router.push(localePath(basePath));
  }
};

const requestDelete = (row: Record<string, unknown>) => {
  if (!props.canDelete) {
    return;
  }
  deleteRowTarget.value = row;
  deleteOpen.value = true;
};

const cancelDelete = () => {
  deleteOpen.value = false;
  deleteRowTarget.value = null;
  deleteLoading.value = false;
};

const confirmDelete = async () => {
  if (!props.canDelete || !deleteRowTarget.value) {
    cancelDelete();
    return;
  }
  const id = getRowId(deleteRowTarget.value);
  if (id === null) {
    show(t("resource.deleteFailedMissingId"), "error");
    cancelDelete();
    return;
  }
  deleteLoading.value = true;
  const response = await apiFetch(`${props.endpoint}/${id}`, {
    method: "DELETE",
    authMode: props.authMode,
  });
  deleteLoading.value = false;
  if (response.success) {
    await refresh();
    cancelDelete();
  }
};

const deleteLabel = computed(() => {
  if (!deleteRowTarget.value) {
    return "-";
  }
  if (props.deleteLabelFormatter) {
    const formatted = props.deleteLabelFormatter(deleteRowTarget.value);
    if (typeof formatted === "string" && formatted.length > 0) {
      return formatted;
    }
  }
  if (props.deleteLabelKey) {
    const value = deleteRowTarget.value[props.deleteLabelKey];
    if (value !== undefined) {
      return formatValue(value);
    }
  }
  return formatValue(getRowId(deleteRowTarget.value));
});

const nextPage = () => {
  if (pagination.value && query.page < pagination.value.last_page) {
    query.page += 1;
  }
};

const prevPage = () => {
  if (query.page > 1) {
    query.page -= 1;
  }
};

watch(
  () => route.params.id,
  (value) => {
    if (!import.meta.client) {
      return;
    }

    // When no detail slot is provided, skip modal handling entirely.
    // Navigation to detail pages is handled by openDetail() directly.
    if (!hasDetailSlot.value) {
      return;
    }

    const idParam = typeof value === "string" ? value : null;
    if (idParam) {
      if (detailId.value !== idParam) {
        openDetailById(idParam);
      }
      return;
    }
    if (detailOpen.value) {
      closeDetail();
    }
  },
  { immediate: true }
);
</script>

<template>
  <Card
    :class="[
      'rounded-[28px] border-border/80 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.82)]',
      props.showSearchFilterTrigger ? 'overflow-visible' : 'overflow-hidden',
    ]"
  >
    <CardHeader class="border-b border-border/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.82),rgba(255,255,255,0.98))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.96))]">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="space-y-1">
          <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {{ t("layout.resources") }}
          </div>
          <CardTitle class="text-xl">
            {{ localizedTitle }}
          </CardTitle>
        </div>
      </div>
      <div class="mt-5 flex flex-col items-stretch gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="relative flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div
            v-if="props.searchKey"
            class="relative w-full min-w-0 sm:mx-auto sm:max-w-sm"
          >
            <Input
              v-model="query.q"
              name="resource-search"
              autocomplete="off"
              :aria-label="resolvedSearchPlaceholder"
              :placeholder="resolvedSearchPlaceholder"
              :class="[
                'h-11 w-full min-w-0 rounded-2xl border-border/80 bg-background/90 shadow-sm',
                props.showSearchFilterTrigger ? 'pr-12' : '',
              ]"
            />
            <button
              v-if="props.showSearchFilterTrigger"
              type="button"
              :class="[
                'absolute inset-y-1 right-1 flex w-10 items-center justify-center rounded-xl border-l border-border hover:bg-accent hover:text-foreground',
                props.searchFilterOpen ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'text-muted-foreground',
              ]"
              :aria-label="t('ui.openFilters')"
              @click="emit('searchFilterTrigger')"
            >
              <ChevronDown class="h-4 w-4" />
            </button>
          </div>
          <div
            v-if="props.searchKey && query.q"
            class="flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-muted/45 px-3 py-2 text-xs text-muted-foreground"
          >
            <span>{{ t("common.search") }}: {{ query.q }}</span>
            <Button
              variant="ghost"
              size="sm"
              class="h-6 rounded-full px-2"
              @click="query.q = ''"
            >
              {{ t("common.clear") }}
            </Button>
          </div>
          <slot name="filters" />
        </div>
        <div class="flex w-full items-center gap-2 lg:w-auto lg:justify-end">
          <slot
            v-if="hasHeaderActions"
            name="header-actions"
          />
        </div>
      </div>
    </CardHeader>
    <ClientOnly>
      <CardContent class="pt-5">
        <div
          v-if="error"
          class="rounded-2xl border border-destructive/20 bg-destructive/5 p-4"
        >
          <div class="text-sm font-medium text-destructive">
            {{ t("resource.failedLoadData") }}
          </div>
          <div class="mt-1 text-sm text-muted-foreground">
            {{ localizedTitle }}
          </div>
          <div class="mt-3">
            <Button
              variant="outline"
              size="sm"
              type="button"
              @click="refresh"
            >
              {{ t("common.retry") }}
            </Button>
          </div>
        </div>
        <div v-else>
          <div
            v-if="showRefreshingState"
            class="mb-4 rounded-2xl border border-border/70 bg-muted/35 px-4 py-3 text-sm text-muted-foreground"
          >
            {{ t("common.loading") }}
          </div>
          <div v-if="showInitialSkeleton">
            <Table v-if="props.loadingVariant === 'skeleton'">
              <TableHeader>
                <TableRow>
                  <TableHead
                    v-for="column in columns"
                    :key="column.key"
                  >
                    {{ column.label }}
                  </TableHead>
                  <TableHead
                    v-if="props.canViewDetail || props.canDelete"
                    class="w-10 text-right"
                  >
                    {{ t("common.actions") }}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="index in skeletonRows"
                  :key="`resource-skeleton-${index}`"
                >
                  <TableCell
                    v-for="column in columns"
                    :key="`resource-skeleton-cell-${column.key}-${index}`"
                  >
                    <div
                      class="h-4 rounded bg-muted animate-pulse"
                      :class="column.key === 'description' ? 'w-48' : 'w-32'"
                    />
                  </TableCell>
                  <TableCell v-if="props.canViewDetail || props.canDelete">
                    <div
                      class="ml-auto h-4 w-8 rounded bg-muted animate-pulse"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div
              v-else
              class="text-sm text-muted-foreground"
            >
              {{ t("common.loading") }}
            </div>
          </div>
          <ResourceTable
            v-else
            :columns="columns"
            :rows="rows"
            :empty-text="localizedEmptyText"
            :can-view-detail="props.canViewDetail"
            :can-delete="props.canDelete"
            @view="openDetail"
            @delete="requestDelete"
          >
            <template
              v-for="(_, name) in $slots"
              #[name]="slotProps"
            >
              <slot
                :name="name"
                v-bind="slotProps"
              />
            </template>
          </ResourceTable>
        </div>
      </CardContent>
      <CardFooter
        class="flex flex-col items-stretch gap-3 border-t border-border/70 bg-muted/10 px-4 py-4 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6"
      >
        <div class="text-muted-foreground">
          {{ t("common.page") }} {{ currentPage }} {{ t("common.of") }}
          {{ lastPage }}
        </div>
        <div class="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            class="min-w-[120px] rounded-xl"
            :disabled="query.page === 1"
            @click="prevPage"
          >
            {{ t("common.previous") }}
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="min-w-[120px] rounded-xl"
            :disabled="query.page >= lastPage"
            @click="nextPage"
          >
            {{ t("common.next") }}
          </Button>
        </div>
      </CardFooter>
      <template #fallback>
        <CardContent>
          <div class="text-sm text-muted-foreground">
            {{ t("common.loading") }}
          </div>
        </CardContent>
      </template>
    </ClientOnly>
  </Card>
  <slot
    v-if="detailOpen && hasDetailSlot"
    name="detail"
    :open="detailOpen"
    :row="detailRow"
    :loading="detailLoading"
    :entries="detailEntries"
    :format-value="formatValue"
    :close="closeDetailWithRoute"
    :refresh="refresh"
  />
  <div
    v-else-if="detailOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6 py-8"
    role="presentation"
    @click.self="closeDetailWithRoute"
  >
    <div
      class="w-full max-w-4xl rounded-lg border bg-card p-6 shadow-lg"
      role="dialog"
      aria-modal="true"
      :aria-label="t('common.detail')"
    >
      <div class="flex items-center justify-between">
        <div class="text-lg font-semibold">
          {{ t("common.detail") }}
        </div>
        <Button
          variant="outline"
          size="sm"
          @click="closeDetailWithRoute"
        >
          {{ t("common.close") }}
        </Button>
      </div>
      <div class="mt-4 max-h-[70vh] overflow-auto text-sm">
        <div class="grid gap-2">
          <div
            v-if="detailLoading"
            class="text-muted-foreground"
          >
            {{ t("common.loading") }}
          </div>
          <div
            v-else-if="detailEntries.length === 0"
            class="text-muted-foreground"
          >
            {{ t("resource.detailEmpty") }}
          </div>
          <div v-else>
            <div
              v-for="[key, value] in detailEntries"
              :key="String(key)"
              class="grid grid-cols-3 gap-4"
            >
              <div class="text-muted-foreground">
                {{ key }}
              </div>
              <div class="col-span-2 break-words">
                {{ formatValue(value) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div
    v-if="deleteOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
    role="presentation"
  >
    <div
      class="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg"
      role="dialog"
      aria-modal="true"
      :aria-label="t('resource.confirmDelete')"
    >
      <div class="text-lg font-semibold">
        {{ t("resource.confirmDelete") }}
      </div>
      <div class="mt-2 text-sm text-muted-foreground">
        {{
          format("resource.deleteConfirmDescription", { label: deleteLabel })
        }}
      </div>
      <div class="mt-6 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="deleteLoading"
          @click="cancelDelete"
        >
          {{ t("common.cancel") }}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          :disabled="deleteLoading"
          @click="confirmDelete"
        >
          {{ deleteLoading ? t("common.deleting") : t("common.delete") }}
        </Button>
      </div>
    </div>
  </div>
</template>
