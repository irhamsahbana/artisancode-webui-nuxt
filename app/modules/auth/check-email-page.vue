<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { navigateTo } from '#app'
import { useAuth } from '~/composables/useAuth'

defineOptions({ name: 'CheckEmailPage' })

const route = useRoute()
const { resendVerificationEmail } = useAuth()
const { t, format } = useLocale()
const localePath = useLocalePath()

const isResending = ref(false)
const infoMessage = ref('')
const errorMessage = ref('')
const resendCountdown = ref(0)
let resendCountdownTimer: ReturnType<typeof setInterval> | null = null

const email = computed(() => (
  typeof route.query.email === 'string' ? route.query.email : ''
))
const tenantCode = computed(() => (
  typeof route.query.tenant_code === 'string' ? route.query.tenant_code : ''
))

const resendDisabled = computed(() => (
  isResending.value
  || !email.value
  || !tenantCode.value
  || resendCountdown.value > 0
))
const resendLabel = computed(() => {
  if (isResending.value) {
    return t('auth.resendingVerificationEmail')
  }

  if (resendCountdown.value > 0) {
    return format('auth.resendInCountdown', { seconds: String(resendCountdown.value) })
  }

  return t('auth.resendVerificationEmail')
})
const mailtoHref = computed(() => (
  email.value ? `mailto:${email.value}` : 'mailto:'
))

const clearCountdownTimer = () => {
  if (resendCountdownTimer) {
    clearInterval(resendCountdownTimer)
    resendCountdownTimer = null
  }
}

const startCountdown = (seconds: number) => {
  clearCountdownTimer()
  resendCountdown.value = Math.max(0, Math.floor(seconds))

  if (resendCountdown.value <= 0) {
    return
  }

  resendCountdownTimer = setInterval(() => {
    if (resendCountdown.value <= 1) {
      resendCountdown.value = 0
      clearCountdownTimer()
      return
    }

    resendCountdown.value -= 1
  }, 1000)
}

const resend = async () => {
  if (!email.value) {
    return
  }

  errorMessage.value = ''
  isResending.value = true

  try {
    const response = await resendVerificationEmail({
      email: email.value,
      tenant_code: tenantCode.value,
    })
    if (!response.success) {
      errorMessage.value = response.message
      if (response.meta?.retryAfterSeconds) {
        startCountdown(response.meta.retryAfterSeconds)
      }
      return
    }

    infoMessage.value = response.message
    startCountdown(60)
  } finally {
    isResending.value = false
  }
}

const goToLogin = async () => {
  await navigateTo(localePath({
    path: '/login',
    query: {
      email: email.value || undefined,
      tenant_code: tenantCode.value || undefined,
    },
  }))
}

onBeforeUnmount(() => {
  clearCountdownTimer()
})
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-10 text-slate-50">
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.16),_transparent_26%)]" />
      <div class="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px]" />
    </div>

    <Card class="relative w-full max-w-3xl border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur">
      <CardContent class="grid gap-8 p-8 md:grid-cols-[1.2fr_0.8fr] md:p-10">
        <div class="space-y-6">
          <div class="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">
            {{ t('auth.checkEmailBadge') }}
          </div>

          <div class="space-y-3">
            <h1 class="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              {{ t('auth.checkEmailHero') }}
            </h1>
            <p class="max-w-xl text-sm leading-6 text-slate-300 md:text-base">
              {{ t('auth.checkEmailHelp') }}
            </p>
          </div>

          <div class="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              {{ t('auth.emailSentTo') }}
            </p>
            <p class="mt-2 break-all text-lg font-semibold text-white">
              {{ email || t('auth.emailUnavailable') }}
            </p>
          </div>

          <div class="grid gap-3 md:grid-cols-3">
            <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p class="text-sm font-medium text-white">
                1. {{ t('auth.checkInboxStep') }}
              </p>
              <p class="mt-2 text-sm leading-6 text-slate-400">
                {{ t('auth.checkInboxHint') }}
              </p>
            </div>
            <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p class="text-sm font-medium text-white">
                2. {{ t('auth.openVerificationLinkStep') }}
              </p>
              <p class="mt-2 text-sm leading-6 text-slate-400">
                {{ t('auth.openVerificationLinkHint') }}
              </p>
            </div>
            <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p class="text-sm font-medium text-white">
                3. {{ t('auth.returnToSignInStep') }}
              </p>
              <p class="mt-2 text-sm leading-6 text-slate-400">
                {{ t('auth.returnToSignInHint') }}
              </p>
            </div>
          </div>

          <div
            v-if="infoMessage"
            class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
          >
            {{ infoMessage }}
          </div>
          <div
            v-if="errorMessage"
            class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
          >
            {{ errorMessage }}
          </div>
        </div>

        <div class="space-y-4 rounded-3xl border border-slate-800 bg-white/5 p-5">
          <div class="space-y-2">
            <p class="text-lg font-semibold text-white">
              {{ t('auth.didNotReceiveEmail') }}
            </p>
            <p class="text-sm leading-6 text-slate-300">
              {{ t('auth.didNotReceiveEmailHint') }}
            </p>
          </div>

          <Button
            class="w-full bg-white text-slate-950 hover:bg-slate-100"
            :disabled="resendDisabled"
            @click="resend"
          >
            {{ resendLabel }}
          </Button>

          <Button
            as-child
            variant="outline"
            class="w-full border-slate-700 bg-transparent text-white hover:bg-slate-800"
          >
            <a :href="mailtoHref">
              {{ t('auth.openEmailApp') }}
            </a>
          </Button>

          <Button
            variant="ghost"
            class="w-full text-slate-300 hover:bg-slate-800 hover:text-white"
            @click="goToLogin"
          >
            {{ t('auth.backToLogin') }}
          </Button>

          <p class="text-xs leading-5 text-slate-500">
            {{ t('auth.spamFolderHint') }}
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
