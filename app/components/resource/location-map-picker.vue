<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

defineOptions({ name: 'LocationMapPicker' })

const { t } = useLocale()

const props = withDefaults(
  defineProps<{
    latitude?: number | null
    longitude?: number | null
    address?: string | null
    radiusMeters?: number | null
  }>(),
  {
    latitude: null,
    longitude: null,
    address: null,
    radiusMeters: null,
  },
)

const emit = defineEmits<{
  (event: 'update:latitude', value: number | null): void
  (event: 'update:longitude', value: number | null): void
  (event: 'update:address', value: string | null): void
  (event: 'update:radiusMeters', value: number | null): void
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
const searchQuery = ref('')
const searchResults = ref<Array<{ display_name: string; lat: string; lon: string }>>([])
const searchLoading = ref(false)
const searchOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const geoLoading = ref(false)
const geoError = ref('')

// Leaflet instances (not reactive)
let map: any = null
let marker: any = null
let radiusCircle: any = null
let L: any = null

const DEFAULT_LAT = -6.2088
const DEFAULT_LON = 106.8456
const DEFAULT_ZOOM = 12

// Initialize map
const initMap = async () => {
  if (!import.meta.client || !mapContainer.value) return

  L = (await import('leaflet')).default

  // Import leaflet CSS
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
  document.head.appendChild(link)

  const lat = props.latitude ?? DEFAULT_LAT
  const lon = props.longitude ?? DEFAULT_LON

  map = L.map(mapContainer.value).setView([lat, lon], DEFAULT_ZOOM)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)

  // Add marker if initial position exists
  if (props.latitude != null && props.longitude != null) {
    addMarker(props.latitude, props.longitude)
    addRadiusCircle(props.latitude, props.longitude, props.radiusMeters)
  }

  // Click to place marker
  map.on('click', async (e: any) => {
    const { lat, lng } = e.latlng
    addMarker(lat, lng)
    addRadiusCircle(lat, lng, props.radiusMeters)
    emit('update:latitude', parseFloat(lat.toFixed(6)))
    emit('update:longitude', parseFloat(lng.toFixed(6)))

    // Reverse geocode
    await reverseGeocode(lat, lng)
  })

  // Invalidate size after DOM update
  await nextTick()
  map.invalidateSize()
}

const addMarker = (lat: number, lon: number) => {
  if (!L || !map) return
  if (marker) {
    marker.setLatLng([lat, lon])
  } else {
    marker = L.marker([lat, lon], { draggable: true }).addTo(map)
    marker.on('dragend', async () => {
      const pos = marker.getLatLng()
      emit('update:latitude', parseFloat(pos.lat.toFixed(6)))
      emit('update:longitude', parseFloat(pos.lng.toFixed(6)))
      addRadiusCircle(pos.lat, pos.lng, props.radiusMeters)
      await reverseGeocode(pos.lat, pos.lng)
    })
  }
}

const addRadiusCircle = (lat: number, lon: number, radius: number | null) => {
  if (!L || !map) return
  if (radiusCircle) {
    map.removeLayer(radiusCircle)
  }
  if (radius && radius > 0) {
    radiusCircle = L.circle([lat, lon], {
      radius,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
      weight: 2,
    }).addTo(map)
  }
}

// Nominatim search
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

const searchLocation = async () => {
  const q = searchQuery.value.trim()
  if (q.length < 3) return

  searchLoading.value = true
  try {
    const resp = await fetch(
      `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=id`,
    )
    searchResults.value = await resp.json()
    searchOpen.value = true
  } catch {
    searchResults.value = []
  }
  searchLoading.value = false
}

const selectSearchResult = (result: { display_name: string; lat: string; lon: string }) => {
  const lat = parseFloat(result.lat)
  const lon = parseFloat(result.lon)

  searchQuery.value = result.display_name
  searchOpen.value = false
  searchResults.value = []

  map.setView([lat, lon], 16)
  addMarker(lat, lon)
  addRadiusCircle(lat, lon, props.radiusMeters)
  emit('update:latitude', parseFloat(lat.toFixed(6)))
  emit('update:longitude', parseFloat(lon.toFixed(6)))
  emit('update:address', result.display_name)
}

// Reverse geocode
const reverseGeocode = async (lat: number, lon: number) => {
  try {
    const resp = await fetch(
      `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18`,
    )
    const data = await resp.json()
    if (data.display_name) {
      emit('update:address', data.display_name)
      searchQuery.value = data.display_name
    }
  } catch {
    // Silent fail - address is optional
  }
}

// Find my location using browser geolocation
const findMyLocation = () => {
  if (!navigator.geolocation) {
    geoError.value = t('resource.geolocationUnsupported')
    return
  }

  geoError.value = ''
  geoLoading.value = true

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude
      const lon = position.coords.longitude

      geoLoading.value = false
      map.setView([lat, lon], 16)
      addMarker(lat, lon)
      addRadiusCircle(lat, lon, props.radiusMeters)
      emit('update:latitude', parseFloat(lat.toFixed(6)))
      emit('update:longitude', parseFloat(lon.toFixed(6)))

      await reverseGeocode(lat, lon)
    },
    (error) => {
      geoLoading.value = false
      switch (error.code) {
        case error.PERMISSION_DENIED:
          geoError.value = t('resource.geolocationDenied')
          break
        case error.POSITION_UNAVAILABLE:
          geoError.value = t('resource.geolocationUnavailable')
          break
        case error.TIMEOUT:
          geoError.value = t('resource.geolocationTimeout')
          break
        default:
          geoError.value = t('resource.geolocationUnknown')
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    },
  )
}

// Watch for external radius changes
watch(
  () => props.radiusMeters,
  (newRadius) => {
    if (marker && props.latitude != null && props.longitude != null) {
      const pos = marker.getLatLng()
      addRadiusCircle(pos.lat, pos.lng, newRadius)
    }
  },
)

// Click outside search results
const handleClickOutside = (e: MouseEvent) => {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    searchOpen.value = false
  }
}

onMounted(async () => {
  document.addEventListener('mousedown', handleClickOutside)
  searchQuery.value = props.address ?? ''
  await nextTick()
  await initMap()
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  if (map) {
    map.remove()
    map = null
    marker = null
    radiusCircle = null
    L = null
  }
})
</script>

<template>
  <div
    ref="rootRef"
    class="space-y-2"
  >
    <!-- Search box -->
    <div class="relative">
      <div class="flex gap-2">
        <input
          v-model="searchQuery"
          name="map_location_search"
          type="text"
          autocomplete="off"
          :placeholder="t('resource.searchLocation')"
          :aria-label="t('resource.searchLocation')"
          class="h-9 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          @keydown.enter.prevent="searchLocation"
        >
        <Button
          type="button"
          variant="outline"
          size="sm"
          :disabled="searchLoading"
          @click="searchLocation"
        >
          {{ searchLoading ? '…' : t('common.search') }}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          :disabled="geoLoading"
          @click="findMyLocation"
        >
          {{ geoLoading ? '…' : `📍 ${t('common.myLocation')}` }}
        </Button>
      </div>

      <!-- Geolocation error -->
      <p
        v-if="geoError"
        class="mt-1 text-xs text-destructive"
      >
        {{ geoError }}
      </p>

      <!-- Search results dropdown -->
      <div
        v-if="searchOpen && searchResults.length > 0"
        class="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md"
      >
        <div class="max-h-48 overflow-auto p-1">
          <button
            v-for="(result, index) in searchResults"
            :key="index"
            type="button"
            class="w-full rounded px-3 py-2 text-left text-xs hover:bg-accent"
            @click="selectSearchResult(result)"
          >
            {{ result.display_name }}
          </button>
        </div>
      </div>
    </div>

    <!-- Map container -->
    <div
      ref="mapContainer"
      class="h-64 w-full rounded-md border"
    />

    <!-- Read-only lat/lon display -->
    <div
      v-if="latitude != null && longitude != null"
      class="grid grid-cols-2 gap-2"
    >
      <div class="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-xs">
        <span class="text-muted-foreground">{{ t('common.latitude') }}:</span>
        <span class="font-mono">{{ latitude }}</span>
      </div>
      <div class="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-xs">
        <span class="text-muted-foreground">{{ t('common.longitude') }}:</span>
        <span class="font-mono">{{ longitude }}</span>
      </div>
    </div>

    <p class="text-xs text-muted-foreground">
      {{ t('resource.mapPickerHint') }}
    </p>
  </div>
</template>
