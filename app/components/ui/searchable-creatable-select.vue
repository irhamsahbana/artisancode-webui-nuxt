<script setup lang="ts">
import { Loader2, Plus } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import type { ListResponse, PaginationMeta } from '~/types/api'
import { cn } from '~/utils/utils'

defineOptions({ name: 'UiSearchableCreatableSelect' })

export type SearchableCreatableOption = {
  value: string | number
  label: string
}

type SearchableCreatableFetchResult = SearchableCreatableOption[] | {
  options: SearchableCreatableOption[]
  pagination?: Partial<PaginationMeta> | null
}

type ModelKey = 'value' | 'label'
type CreateMethod = 'POST' | 'PUT' | 'PATCH'

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    fetchEndpoint?: string
    createEndpoint?: string
    fetchOptions?: (query: string, page: number) => Promise<SearchableCreatableFetchResult>
    createOption?: (query: string) => Promise<SearchableCreatableOption | null>
    mapFetchOptions?: (data: unknown) => SearchableCreatableOption[]
    mapCreatedOption?: (data: unknown, query: string) => SearchableCreatableOption | null
    buildCreateBody?: (query: string) => Record<string, unknown>
    placeholder?: string
    searchPlaceholder?: string
    disabled?: boolean
    selectedLabelText?: string
    emptyLabelText?: string
    createLabelText?: string
    loadingLabelText?: string
    creatingLabelText?: string
    createSuccessMessage?: string
    teleportTo?: string | null
    searchParam?: string
    pageParam?: string
    limitParam?: string
    limit?: number
    additionalQuery?: Record<string, unknown>
    createAdditionalBody?: Record<string, unknown>
    createMethod?: CreateMethod
    modelKey?: ModelKey
    allowCreate?: boolean
    minQueryLength?: number
  }>(),
  {
    modelValue: null,
    fetchEndpoint: undefined,
    createEndpoint: undefined,
    fetchOptions: undefined,
    createOption: undefined,
    mapFetchOptions: undefined,
    mapCreatedOption: undefined,
    buildCreateBody: undefined,
    placeholder: 'Select option',
    searchPlaceholder: 'Search…',
    disabled: false,
    selectedLabelText: undefined,
    emptyLabelText: undefined,
    createLabelText: undefined,
    loadingLabelText: undefined,
    creatingLabelText: undefined,
    createSuccessMessage: undefined,
    teleportTo: 'body',
    searchParam: 'q',
    pageParam: 'page',
    limitParam: 'paginate',
    limit: 15,
    additionalQuery: () => ({}),
    createAdditionalBody: () => ({}),
    createMethod: 'POST',
    modelKey: 'value',
    allowCreate: false,
    minQueryLength: 0,
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | number | null): void
  (event: 'select-option', option: SearchableCreatableOption): void
  (event: 'create-option', option: SearchableCreatableOption): void
}>()

let localeText: ((key: string, params?: Record<string, string>) => string) | null = null

try {
  const { t } = useLocale()
  localeText = (key: string, params?: Record<string, string>) => String(t(key, params))
} catch {
  localeText = null
}

const { apiFetch } = useApi()
const { show } = useBanner()

const rootRef = ref<HTMLElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)
const optionsViewportRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const isLoading = ref(false)
const isCreating = ref(false)
const query = ref('')
const debouncedQuery = ref('')
const fetchedOptions = ref<SearchableCreatableOption[]>([])
const currentPage = ref(1)
const lastPage = ref(1)
const listboxId = useId()
const listRequestController = ref<AbortController | null>(null)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const popoverPosition = ref({
  top: 0,
  left: 0,
  width: 0,
})

const defaultMapFetchOptions = (data: unknown) => {
  const payload = data as ListResponse<Record<string, unknown>> | Record<string, unknown>[] | null
  const rawItems = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && 'items' in payload && Array.isArray(payload.items)
      ? payload.items as Array<Record<string, unknown>>
      : []

  return rawItems
    .map((item) => {
      const value = item.id ?? item.value ?? item.code
      const label = item.name ?? item.label ?? item.title ?? item.code
      if ((typeof value !== 'string' && typeof value !== 'number') || typeof label !== 'string') {
        return null
      }
      return { value, label }
    })
    .filter((item): item is SearchableCreatableOption => item !== null)
}

const isPaginationMeta = (value: unknown): value is Partial<PaginationMeta> => {
  return Boolean(value) && typeof value === 'object'
}

const isLegacyMeta = (value: unknown): value is {
  page?: number
  paginate?: number
  total_data?: number
  total_page?: number
} => {
  return Boolean(value) && typeof value === 'object'
}

const normalizePaginationMeta = (value: unknown, fallbackPage: number) => {
  if (!isPaginationMeta(value)) {
    return {
      page: fallbackPage,
      lastPage: fallbackPage,
    }
  }

  const page = typeof value.page === 'number' && Number.isFinite(value.page)
    ? value.page
    : fallbackPage
  const lastPageValue = typeof value.last_page === 'number' && Number.isFinite(value.last_page)
    ? value.last_page
    : page

  return {
    page,
    lastPage: Math.max(page, lastPageValue),
  }
}

const normalizeLegacyMeta = (value: unknown, fallbackPage: number) => {
  if (!isLegacyMeta(value)) {
    return {
      page: fallbackPage,
      lastPage: fallbackPage,
    }
  }

  const page = typeof value.page === 'number' && Number.isFinite(value.page)
    ? value.page
    : fallbackPage
  const lastPageValue = typeof value.total_page === 'number' && Number.isFinite(value.total_page)
    ? value.total_page
    : page

  return {
    page,
    lastPage: Math.max(page, lastPageValue),
  }
}

const normalizeFetchResult = (data: unknown, fallbackPage: number) => {
  if (Array.isArray(data)) {
    return {
      options: data,
      pagination: {
        page: fallbackPage,
        lastPage: fallbackPage,
      },
    }
  }

  if (data && typeof data === 'object' && 'options' in data && Array.isArray(data.options)) {
    return {
      options: data.options as SearchableCreatableOption[],
      pagination: normalizePaginationMeta(
        'pagination' in data ? data.pagination : null,
        fallbackPage,
      ),
    }
  }

  return {
    options: mapFetchOptions(data),
    pagination: data && typeof data === 'object' && 'pagination' in data
      ? normalizePaginationMeta(data.pagination, fallbackPage)
      : normalizeLegacyMeta(
          data && typeof data === 'object' && 'meta' in data ? data.meta : null,
          fallbackPage,
        ),
  }
}

const mergeOptions = (
  existingOptions: SearchableCreatableOption[],
  nextOptions: SearchableCreatableOption[],
) => {
  const mergedOptions = [...existingOptions]

  for (const nextOption of nextOptions) {
    if (!mergedOptions.some(option => option.value === nextOption.value && option.label === nextOption.label)) {
      mergedOptions.push(nextOption)
    }
  }

  return mergedOptions
}

const selectedOption = computed(() => {
  if (props.modelValue == null || props.modelValue === '') {
    return null
  }

  return fetchedOptions.value.find((option) => {
    return props.modelKey === 'label'
      ? option.label === props.modelValue
      : option.value === props.modelValue
  }) ?? null
})

const selectedLabel = computed(() => {
  if (selectedOption.value) {
    return selectedOption.value.label
  }
  if (props.modelKey === 'label' && typeof props.modelValue === 'string') {
    return props.modelValue
  }
  return ''
})

const hasFetchCapability = computed(() => Boolean(props.fetchOptions || props.fetchEndpoint))
const hasCreateCapability = computed(() => Boolean(props.allowCreate && (props.createOption || props.createEndpoint)))
const resolvedPlaceholder = computed(() => {
  if (isOpen.value) {
    return props.searchPlaceholder
  }
  if (selectedLabel.value) {
    return ''
  }
  return props.placeholder
})
const selectedBadgeLabel = computed(() => props.selectedLabelText ?? localeText?.('ui.selected') ?? 'Selected')
const emptyLabel = computed(() => props.emptyLabelText ?? localeText?.('ui.noOptions') ?? 'No options')
const loadingLabel = computed(() => props.loadingLabelText ?? localeText?.('ui.loading2') ?? 'Loading...')
const loadMoreLabel = computed(() => localeText?.('ui.loadMore') ?? 'Load more')
const creatingLabel = computed(() => props.creatingLabelText ?? localeText?.('ui.creating') ?? 'Creating...')
const createLabel = computed(() => props.createLabelText ?? localeText?.('ui.createOptionNamed', { name: query.value.trim() }) ?? `Create "${query.value.trim()}"`)
const useTeleportedPopover = computed(() => Boolean(props.teleportTo))
const popoverStyle = computed(() => ({
  top: `${popoverPosition.value.top}px`,
  left: `${popoverPosition.value.left}px`,
  width: `${popoverPosition.value.width}px`,
}))

const trimmedQuery = computed(() => debouncedQuery.value.trim())
const hasExactMatch = computed(() => {
  const normalizedQuery = trimmedQuery.value.toLowerCase()
  return fetchedOptions.value.some(option => option.label.trim().toLowerCase() === normalizedQuery)
})
const canShowCreate = computed(() => {
  return hasCreateCapability.value
    && trimmedQuery.value.length > 0
    && trimmedQuery.value.length >= props.minQueryLength
    && !hasExactMatch.value
    && !isLoading.value
})
const hasNextPage = computed(() => currentPage.value < lastPage.value)

const updatePopoverPosition = () => {
  if (!import.meta.client || !rootRef.value) {
    return
  }

  const rect = rootRef.value.getBoundingClientRect()
  const padding = 8
  const width = Math.max(160, rect.width)
  popoverPosition.value = {
    top: rect.bottom + 4,
    left: Math.min(
      Math.max(padding, rect.left),
      Math.max(padding, window.innerWidth - width - padding),
    ),
    width,
  }
}

const openList = async () => {
  if (props.disabled) {
    return
  }
  updatePopoverPosition()
  isOpen.value = true
  await loadOptions(query.value)
}

const closeList = () => {
  isOpen.value = false
  query.value = selectedLabel.value
  debouncedQuery.value = selectedLabel.value
}

const handleInputKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeList()
  }
}

const selectOption = (option: SearchableCreatableOption) => {
  emit('update:modelValue', props.modelKey === 'label' ? option.label : option.value)
  emit('select-option', option)
  isOpen.value = false
  query.value = option.label
  debouncedQuery.value = option.label
}

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  query.value = target.value
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = query.value
  }, 200)
  if (!isOpen.value) {
    updatePopoverPosition()
    isOpen.value = true
  }
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  if (rootRef.value?.contains(target) || popoverRef.value?.contains(target)) {
    return
  }
  if (rootRef.value) {
    closeList()
  }
}

const mapFetchOptions = (data: unknown) => {
  return props.mapFetchOptions ? props.mapFetchOptions(data) : defaultMapFetchOptions(data)
}

const loadOptions = async (searchTerm: string, page = 1) => {
  if (!hasFetchCapability.value) {
    fetchedOptions.value = []
    currentPage.value = 1
    lastPage.value = 1
    return
  }

  if (searchTerm.trim().length < props.minQueryLength) {
    fetchedOptions.value = []
    currentPage.value = 1
    lastPage.value = 1
    return
  }

  listRequestController.value?.abort()
  const controller = new AbortController()
  listRequestController.value = controller
  isLoading.value = true

  try {
    const normalizedSearchTerm = searchTerm.trim()

    if (props.fetchOptions) {
      const result = normalizeFetchResult(await props.fetchOptions(normalizedSearchTerm, page), page)
      fetchedOptions.value = page > 1
        ? mergeOptions(fetchedOptions.value, result.options)
        : result.options
      currentPage.value = result.pagination.page
      lastPage.value = result.pagination.lastPage
      return
    }

    const response = await apiFetch<unknown>(props.fetchEndpoint!, {
      query: {
        ...props.additionalQuery,
        [props.searchParam]: normalizedSearchTerm || undefined,
        [props.pageParam]: page,
        [props.limitParam]: props.limit,
      },
      signal: controller.signal,
    })

    if (response.success && response.data) {
      const result = normalizeFetchResult(response.data, page)
      fetchedOptions.value = page > 1
        ? mergeOptions(fetchedOptions.value, result.options)
        : result.options
      currentPage.value = result.pagination.page
      lastPage.value = result.pagination.lastPage
      return
    }

    if (page === 1) {
      fetchedOptions.value = []
    }
    currentPage.value = page
    lastPage.value = page
  }
  finally {
    if (listRequestController.value === controller) {
      listRequestController.value = null
      isLoading.value = false
    }
  }
}

const loadNextPage = async () => {
  if (!isOpen.value || isLoading.value || !hasNextPage.value) {
    return
  }

  await loadOptions(trimmedQuery.value, currentPage.value + 1)
}

const handleOptionsScroll = async (event: Event) => {
  const target = event.target as HTMLElement | null
  if (!target) {
    return
  }

  const remainingScroll = target.scrollHeight - target.scrollTop - target.clientHeight
  if (remainingScroll > 24) {
    return
  }

  await loadNextPage()
}

const createFallbackOption = async (searchTerm: string) => {
  await loadOptions(searchTerm)
  const exactMatch = fetchedOptions.value.find(option => option.label.trim().toLowerCase() === searchTerm.trim().toLowerCase())
  if (exactMatch) {
    return exactMatch
  }
  if (props.modelKey === 'label') {
    return {
      value: searchTerm,
      label: searchTerm,
    } satisfies SearchableCreatableOption
  }
  return null
}

const handleCreate = async () => {
  const searchTerm = trimmedQuery.value
  if (!canShowCreate.value || !searchTerm) {
    return
  }

  isCreating.value = true

  try {
    let createdOption: SearchableCreatableOption | null = null

    if (props.createOption) {
      createdOption = await props.createOption(searchTerm)
    }
    else if (props.createEndpoint) {
      const body = props.buildCreateBody
        ? props.buildCreateBody(searchTerm)
        : {
            name: searchTerm,
            ...props.createAdditionalBody,
          }

      const response = await apiFetch<unknown>(props.createEndpoint, {
        method: props.createMethod,
        body,
      })

      if (response.success) {
        if (props.createSuccessMessage) {
          show(props.createSuccessMessage, 'success')
        }

        createdOption = props.mapCreatedOption
          ? props.mapCreatedOption(response.data, searchTerm)
          : await createFallbackOption(searchTerm)
      }
    }

    if (!createdOption) {
      createdOption = await createFallbackOption(searchTerm)
    }

    if (createdOption) {
      if (!fetchedOptions.value.some(option => option.label === createdOption?.label && option.value === createdOption.value)) {
        fetchedOptions.value = [createdOption, ...fetchedOptions.value]
      }
      selectOption(createdOption)
      emit('create-option', createdOption)
    }
  }
  finally {
    isCreating.value = false
  }
}

watch(
  () => props.modelValue,
  () => {
    if (!isOpen.value) {
      query.value = selectedLabel.value
      debouncedQuery.value = selectedLabel.value
    }
  },
  { immediate: true },
)

watch(
  debouncedQuery,
  async (value) => {
    if (!isOpen.value) {
      return
    }
    await loadOptions(value)
  },
)

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  listRequestController.value?.abort()
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})
</script>

<template>
  <div
    ref="rootRef"
    class="relative"
  >
    <input
      v-bind="$attrs"
      :value="query"
      :disabled="disabled"
      :placeholder="selectedLabel ? '' : resolvedPlaceholder"
      autocomplete="off"
      autocapitalize="off"
      autocorrect="off"
      :aria-expanded="isOpen"
      :aria-controls="listboxId"
      aria-autocomplete="list"
      spellcheck="false"
      role="combobox"
      :class="cn('h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', $attrs.class as string)"
      @focus="openList"
      @input="onInput"
      @keydown="handleInputKeydown"
    >
    <component
      :is="useTeleportedPopover ? 'Teleport' : 'div'"
      v-bind="useTeleportedPopover ? { to: props.teleportTo } : {}"
    >
      <div
        v-if="isOpen"
        :id="listboxId"
        ref="popoverRef"
        :class="useTeleportedPopover ? 'fixed z-[70] rounded-md border bg-popover p-1 text-sm shadow-md' : 'absolute left-0 top-full z-[70] mt-1 w-full rounded-md border bg-popover p-1 text-sm shadow-md'"
        :style="useTeleportedPopover ? popoverStyle : undefined"
        role="listbox"
      >
        <div
          ref="optionsViewportRef"
          class="max-h-56 overflow-auto"
          @scroll.passive="handleOptionsScroll"
        >
          <div
            v-if="isLoading && fetchedOptions.length === 0"
            class="flex items-center gap-2 px-3 py-2 text-muted-foreground"
          >
            <Loader2 class="h-4 w-4 animate-spin" />
            <span>{{ loadingLabel }}</span>
          </div>

          <template v-else>
            <button
              v-for="option in fetchedOptions"
              :key="String(option.value)"
              type="button"
              class="flex w-full items-center justify-between rounded px-3 py-2 text-left hover:bg-accent"
              role="option"
              :aria-selected="(props.modelKey === 'label' ? option.label : option.value) === props.modelValue"
              @click="selectOption(option)"
            >
              <span>{{ option.label }}</span>
              <span
                v-if="(props.modelKey === 'label' ? option.label : option.value) === props.modelValue"
                class="text-xs text-muted-foreground"
              >
                {{ selectedBadgeLabel }}
              </span>
            </button>

            <button
              v-if="canShowCreate"
              type="button"
              class="flex w-full items-center gap-2 rounded px-3 py-2 text-left font-medium text-primary hover:bg-accent disabled:opacity-60"
              :disabled="isCreating"
              @click="handleCreate"
            >
              <Loader2
                v-if="isCreating"
                class="h-4 w-4 animate-spin"
              />
              <Plus
                v-else
                class="h-4 w-4"
              />
              <span>{{ isCreating ? creatingLabel : createLabel }}</span>
            </button>

            <button
              v-if="hasNextPage && !isLoading"
              type="button"
              class="flex w-full items-center justify-center rounded px-3 py-2 text-sm font-medium text-primary hover:bg-accent"
              @click="loadNextPage"
            >
              {{ loadMoreLabel }}
            </button>

            <div
              v-if="fetchedOptions.length === 0 && !canShowCreate"
              class="px-3 py-2 text-muted-foreground"
            >
              {{ emptyLabel }}
            </div>

            <div
              v-if="isLoading && fetchedOptions.length > 0"
              class="flex items-center gap-2 px-3 py-2 text-muted-foreground"
            >
              <Loader2 class="h-4 w-4 animate-spin" />
              <span>{{ loadingLabel }}</span>
            </div>
          </template>
        </div>
      </div>
    </component>
  </div>
</template>
