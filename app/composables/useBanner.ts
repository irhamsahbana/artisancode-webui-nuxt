let hideTimer: ReturnType<typeof setTimeout> | null = null

export const useBanner = () => {
  const visible = useState('ui_banner_visible', () => false)
  const message = useState('ui_banner_message', () => '')
  const variant = useState<'error' | 'info' | 'success'>('ui_banner_variant', () => 'error')

  const show = (msg: string, type: 'error' | 'info' | 'success' = 'error', ms = 4000) => {
    message.value = msg
    variant.value = type
    visible.value = true
    if (import.meta.client && ms > 0) {
      if (hideTimer) {
        clearTimeout(hideTimer)
      }
      hideTimer = setTimeout(() => {
        visible.value = false
      }, ms)
    }
  }

  const hide = () => {
    visible.value = false
  }

  return { visible, message, variant, show, hide }
}
