import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { mountComposable } from '~/testing/component-test-utils'
import { useAttendanceLogOverlays } from './use-attendance-log-overlays'

describe('useAttendanceLogOverlays', () => {
  it('coordinates filter panel and export menu visibility', async () => {
    const exportMenuOpen = ref(false)
    const overlays = mountComposable(() => useAttendanceLogOverlays({
      exportMenuOpen,
    }))

    overlays.toggleExportMenu()
    await flushPromises()
    expect(exportMenuOpen.value).toBe(true)
    expect(overlays.filterPanelOpen.value).toBe(false)

    overlays.toggleFilterPanel()
    await flushPromises()
    expect(overlays.filterPanelOpen.value).toBe(true)
    expect(exportMenuOpen.value).toBe(false)

    overlays.closeFilterPanel()
    overlays.toggleExportMenu()
    expect(exportMenuOpen.value).toBe(true)
    overlays.closeExportMenu()
    expect(exportMenuOpen.value).toBe(false)
  })
})
