import { onBeforeUnmount, ref, watch } from 'vue'

export const useDebouncedQuery = (delayMs: number) => {
  const input = ref('')
  const query = ref('')
  let timer: ReturnType<typeof setTimeout> | null = null

  watch(
    () => input.value,
    (value) => {
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => {
        query.value = value.trim()
      }, delayMs)
    },
  )

  const reset = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    input.value = ''
    query.value = ''
  }

  onBeforeUnmount(() => {
    if (timer) {
      clearTimeout(timer)
    }
  })

  return {
    input,
    query,
    reset,
  }
}
