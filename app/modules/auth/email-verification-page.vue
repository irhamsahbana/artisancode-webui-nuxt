<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

defineOptions({ name: 'EmailVerificationPage' })

const route = useRoute()
const { verifyEmail } = useAuth()
const { t } = useLocale()
const localePath = useLocalePath()
const isLoading = ref(true)
const successMessage = ref('')
const errorMessage = ref('')

const token = computed(() => (
  typeof route.query.token === 'string' ? route.query.token : ''
))

onMounted(async () => {
  if (!token.value) {
    errorMessage.value = t('auth.emailVerificationFailed')
    isLoading.value = false
    return
  }

  const response = await verifyEmail(token.value)
  if (response.success) {
    successMessage.value = response.message
  } else {
    errorMessage.value = response.message || t('auth.emailVerificationFailed')
  }
  isLoading.value = false
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-10">
    <Card class="w-full max-w-md shadow-lg">
      <CardHeader class="space-y-1 text-center">
        <CardTitle class="text-2xl">
          {{ t('auth.checkEmail') }}
        </CardTitle>
        <p class="text-sm text-muted-foreground">
          {{ isLoading ? t('auth.verifyingEmail') : t('auth.checkEmailDescription') }}
        </p>
      </CardHeader>
      <CardContent class="space-y-4">
        <div
          v-if="successMessage"
          class="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary"
        >
          {{ successMessage }}
        </div>
        <div
          v-if="errorMessage"
          class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {{ errorMessage }}
        </div>
      </CardContent>
      <CardFooter class="flex-col gap-4">
        <NuxtLink
          :to="localePath('/login')"
          class="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {{ t('auth.backToLogin') }}
        </NuxtLink>
      </CardFooter>
    </Card>
  </div>
</template>
