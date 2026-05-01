<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'

defineOptions({ name: 'AuthGoogleIdentityButton' })

type GoogleButtonMode = 'login' | 'register'

type GoogleCredentialResponse = {
  credential?: string
}

type GoogleButtonConfig = {
  theme: 'outline'
  size: 'large'
  type: 'standard'
  shape: 'rectangular'
  text: 'signin_with' | 'signup_with'
  width: number
}

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    cancel_on_tap_outside?: boolean
  }) => void
  renderButton: (parent: HTMLElement, options: GoogleButtonConfig) => void
  cancel: () => void
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId
      }
    }
  }
}

let googleScriptPromise: Promise<void> | null = null

const loadGoogleScript = () => {
  if (!import.meta.client) {
    return Promise.reject(new Error('client-only'))
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve()
  }

  if (googleScriptPromise) {
    return googleScriptPromise
  }

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('google-sdk-load-failed')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('google-sdk-load-failed')), { once: true })
    document.head.appendChild(script)
  })

  return googleScriptPromise
}

const props = defineProps<{
  mode: GoogleButtonMode
  busy?: boolean
}>()

const emit = defineEmits<{
  credential: [idToken: string]
  error: []
}>()

const runtimeConfig = useRuntimeConfig()
const { t } = useLocale()
const buttonContainer = useTemplateRef<HTMLElement>('buttonContainer')
const sdkReady = shallowRef(false)
const sdkFailed = shallowRef(false)
const isRendering = shallowRef(false)

const googleClientId = computed(() => String(runtimeConfig.public.googleClientId || '').trim())
const isUnavailable = computed(() => !googleClientId.value || sdkFailed.value)
const fallbackLabel = computed(() => {
  if (props.busy) {
    return props.mode === 'login' ? t('auth.googleSigningIn') : t('auth.googleSigningUp')
  }

  if (isUnavailable.value) {
    return t('auth.googleUnavailable')
  }

  return props.mode === 'login' ? t('auth.signInWithGoogle') : t('auth.signUpWithGoogle')
})

const renderGoogleButton = async () => {
  if (!import.meta.client || props.busy || !googleClientId.value || !sdkReady.value) {
    return
  }

  await nextTick()
  const container = buttonContainer.value
  const googleId = window.google?.accounts?.id
  if (!container || !googleId) {
    return
  }

  isRendering.value = true
  container.innerHTML = ''
  googleId.initialize({
    client_id: googleClientId.value,
    cancel_on_tap_outside: true,
    callback: (response) => {
      if (!response.credential) {
        emit('error')
        return
      }

      emit('credential', response.credential)
    },
  })
  googleId.renderButton(container, {
    theme: 'outline',
    size: 'large',
    type: 'standard',
    shape: 'rectangular',
    text: props.mode === 'login' ? 'signin_with' : 'signup_with',
    width: Math.min(container.clientWidth || 360, 400),
  })
  isRendering.value = false
}

onMounted(async () => {
  if (!googleClientId.value) {
    return
  }

  try {
    await loadGoogleScript()
    sdkReady.value = true
    await renderGoogleButton()
  } catch {
    sdkFailed.value = true
  }
})

onBeforeUnmount(() => {
  window.google?.accounts?.id?.cancel()
})

watch([googleClientId, sdkReady, () => props.busy], () => {
  if (props.busy) {
    return
  }

  void renderGoogleButton()
})
</script>

<template>
  <div class="w-full">
    <div
      v-show="sdkReady && !isUnavailable && !busy"
      ref="buttonContainer"
      class="flex min-h-10 w-full justify-center [&>div]:mx-auto"
    />
    <Button
      v-if="!sdkReady || isUnavailable || busy"
      variant="outline"
      class="w-full"
      :disabled="busy || isUnavailable || isRendering"
      @click="isUnavailable ? emit('error') : undefined"
    >
      <span
        v-if="busy"
        class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
      <span
        v-else
        class="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-foreground"
        aria-hidden="true"
      >
        G
      </span>
      {{ fallbackLabel }}
    </Button>
  </div>
</template>
