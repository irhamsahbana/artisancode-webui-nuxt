import { ref, type Ref } from 'vue'

type UseAttendanceLogOverlaysOptions = {
  exportMenuOpen: Ref<boolean>
}

export const useAttendanceLogOverlays = ({
  exportMenuOpen,
}: UseAttendanceLogOverlaysOptions) => {
  const filterPanelOpen = ref(false)

  const toggleFilterPanel = () => {
    filterPanelOpen.value = !filterPanelOpen.value
    if (filterPanelOpen.value) {
      exportMenuOpen.value = false
    }
  }

  const closeFilterPanel = () => {
    filterPanelOpen.value = false
  }

  const toggleExportMenu = () => {
    exportMenuOpen.value = !exportMenuOpen.value
    if (exportMenuOpen.value) {
      filterPanelOpen.value = false
    }
  }

  const closeExportMenu = () => {
    exportMenuOpen.value = false
  }

  return {
    filterPanelOpen,
    toggleFilterPanel,
    closeFilterPanel,
    toggleExportMenu,
    closeExportMenu,
  }
}
