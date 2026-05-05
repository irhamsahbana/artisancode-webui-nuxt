import { ref } from 'vue'
import { useTimeoutFn, useToggle } from '@vueuse/core'

export const useBanner = () => {
  const [visible, toggleVisible] = useToggle(false)
  const message = ref('')
  const variant = ref<'error' | 'info' | 'success'>('error')
  const delay = ref(4000)

  const { start, stop } = useTimeoutFn(() => {
    visible.value = false
  }, delay, { immediate: false })

  const show = (msg: string, type: 'error' | 'info' | 'success' = 'error', ms = 4000) => {
    stop()
    message.value = msg
    variant.value = type
    visible.value = true
    delay.value = ms
    if (import.meta.client && ms > 0) {
      start()
    }
  }

  const hide = () => {
    stop()
    visible.value = false
  }

  return { visible, message, variant, show, hide }
}
