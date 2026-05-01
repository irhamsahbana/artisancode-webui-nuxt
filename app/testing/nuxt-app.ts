import { ref, type Ref } from 'vue'

type AsyncDataResult<T> = {
  data: Ref<T | undefined>
  pending: Ref<boolean>
  error: Ref<unknown | null>
  refresh: () => Promise<void>
}

export const useAsyncData = <T>(
  _key: string,
  handler: () => Promise<T>,
): AsyncDataResult<T> => {
  const data = ref<T>()
  const pending = ref(false)
  const error = ref<unknown | null>(null)

  const refresh = async () => {
    pending.value = true

    try {
      data.value = await handler()
      error.value = null
    }
    catch (caughtError) {
      error.value = caughtError
    }
    finally {
      pending.value = false
    }
  }

  void refresh()

  return {
    data,
    pending,
    error,
    refresh,
  }
}
