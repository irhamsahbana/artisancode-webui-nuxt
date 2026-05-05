import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'

export const useDebouncedQuery = (delayMs: number) => {
  const input = ref('')
  const query = ref('')

  const debouncedUpdate = useDebounceFn((value: string) => {
    query.value = value.trim()
  }, delayMs)

  watch(() => input.value, (value) => {
    debouncedUpdate(value)
  })

  const reset = () => {
    input.value = ''
    query.value = ''
  }

  return {
    input,
    query,
    reset,
  }
}
