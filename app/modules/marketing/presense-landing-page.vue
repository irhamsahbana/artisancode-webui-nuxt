<script setup lang="ts">
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Globe2,
  LayoutDashboard,
  ShieldCheck,
  Smartphone,
} from 'lucide-vue-next'

defineOptions({ name: 'PresenseLandingPage' })

const localePath = useLocalePath()
const { locale, setLocale, t } = useLocale()

const motionReady = shallowRef(false)
const adminLoginPath = computed(() => localePath('/login'))
const primaryCtaHref = '#request-demo'
const flowHref = '#how-it-works'
const nextLocale = computed(() => (locale.value === 'id' ? 'en' : 'id'))
const currentLocaleLabel = computed(() => (locale.value === 'id' ? 'ID' : 'EN'))

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const scrollToSection = (id: string) => {
  const target = document.getElementById(id)

  if (!target) {
    return
  }

  target.classList.add('is-visible')
  window.history.replaceState(window.history.state, '', `#${id}`)
  window.scrollTo({
    top: target.getBoundingClientRect().top + window.scrollY,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  })
}

const switchLanguage = async () => {
  const scrollY = window.scrollY
  const currentPathWithoutHash = `${window.location.pathname}${window.location.search}`

  window.history.replaceState(window.history.state, '', currentPathWithoutHash)
  await setLocale(nextLocale.value)
  await nextTick()

  window.requestAnimationFrame(() => {
    window.scrollTo({ top: scrollY, behavior: 'auto' })
  })
}

const metricCards = computed(() => [
  {
    label: t('marketing.presense.mock.metric.activeEmployees'),
    value: '128',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  },
  {
    label: t('marketing.presense.mock.metric.checkedIn'),
    value: '96',
    tone: 'border-teal-200 bg-teal-50 text-teal-950',
  },
  {
    label: t('marketing.presense.mock.metric.checkedOut'),
    value: '21',
    tone: 'border-sky-200 bg-sky-50 text-sky-950',
  },
  {
    label: t('marketing.presense.mock.metric.pendingIn'),
    value: '12',
    tone: 'border-amber-200 bg-amber-50 text-amber-950',
  },
  {
    label: t('marketing.presense.mock.metric.pendingOut'),
    value: '19',
    tone: 'border-orange-200 bg-orange-50 text-orange-950',
  },
  {
    label: t('marketing.presense.mock.metric.lateCheckIn'),
    value: '7',
    tone: 'border-rose-200 bg-rose-50 text-rose-950',
  },
])

const painPoints = computed(() => [
  t('marketing.presense.pain.point1'),
  t('marketing.presense.pain.point2'),
  t('marketing.presense.pain.point3'),
  t('marketing.presense.pain.point4'),
])

const capabilities = computed(() => [
  {
    title: t('marketing.presense.capability.mobile.title'),
    description: t('marketing.presense.capability.mobile.description'),
    icon: Smartphone,
  },
  {
    title: t('marketing.presense.capability.dashboard.title'),
    description: t('marketing.presense.capability.dashboard.description'),
    icon: LayoutDashboard,
  },
  {
    title: t('marketing.presense.capability.policy.title'),
    description: t('marketing.presense.capability.policy.description'),
    icon: CalendarClock,
  },
  {
    title: t('marketing.presense.capability.audit.title'),
    description: t('marketing.presense.capability.audit.description'),
    icon: ClipboardList,
  },
])

const workflowSteps = computed(() => [
  {
    title: t('marketing.presense.workflow.step1.title'),
    description: t('marketing.presense.workflow.step1.description'),
  },
  {
    title: t('marketing.presense.workflow.step2.title'),
    description: t('marketing.presense.workflow.step2.description'),
  },
  {
    title: t('marketing.presense.workflow.step3.title'),
    description: t('marketing.presense.workflow.step3.description'),
  },
  {
    title: t('marketing.presense.workflow.step4.title'),
    description: t('marketing.presense.workflow.step4.description'),
  },
])

const adminFeatures = computed(() => [
  t('marketing.presense.platform.admin.feature1'),
  t('marketing.presense.platform.admin.feature2'),
  t('marketing.presense.platform.admin.feature3'),
  t('marketing.presense.platform.admin.feature4'),
  t('marketing.presense.platform.admin.feature5'),
])

const mobileFeatures = computed(() => [
  t('marketing.presense.platform.mobile.feature1'),
  t('marketing.presense.platform.mobile.feature2'),
  t('marketing.presense.platform.mobile.feature3'),
  t('marketing.presense.platform.mobile.feature4'),
  t('marketing.presense.platform.mobile.feature5'),
])

onMounted(async () => {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('.presense-reveal'))
  const revealVisibleSections = () => {
    const viewportHeight = window.innerHeight

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect()

      if (rect.top < viewportHeight * 0.9 && rect.bottom > 0) {
        section.classList.add('is-visible')
      }
    })
  }

  if (!('IntersectionObserver' in window)) {
    sections.forEach(section => section.classList.add('is-visible'))
    return
  }

  motionReady.value = true
  await nextTick()
  revealVisibleSections()
  window.setTimeout(revealVisibleSections, 80)

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.14 },
  )

  sections.forEach(section => observer.observe(section))
})

useHead(() => ({
  title: t('marketing.presense.seo.title'),
  meta: [
    {
      name: 'description',
      content: t('marketing.presense.seo.description'),
    },
  ],
}))
</script>

<template>
  <main
    class="presense-page min-h-dvh overflow-x-hidden bg-[#f6fbf8] text-[#10231d] [&_*]:min-w-0"
    :class="{ 'is-motion-ready': motionReady }"
  >
    <section class="relative overflow-hidden border-b border-emerald-950/10 bg-[#f6fbf8]">
      <div class="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-5 py-5 sm:px-8 lg:px-10">
        <a
          href="#top"
          class="flex min-h-11 min-w-0 items-center gap-3 rounded-md text-[#10231d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e56] focus-visible:ring-offset-2"
          :aria-label="t('marketing.presense.logoAlt')"
          @click.prevent="scrollToSection('top')"
        >
          <span class="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#0f6e56] shadow-sm">
            <img
              src="/brand/presense-app-icon.svg"
              :alt="t('marketing.presense.logoAlt')"
              class="size-full object-cover"
            >
          </span>
          <span class="min-w-0 leading-tight">
            <span class="block text-lg font-semibold">Presense</span>
            <span class="hidden text-xs font-medium uppercase tracking-[0.16em] text-[#0f6e56] sm:block">by ArtisanCode</span>
          </span>
        </a>

        <nav
          class="hidden items-center gap-6 text-sm font-medium text-[#31443d] md:flex"
          :aria-label="t('marketing.presense.nav.label')"
        >
          <a
            class="rounded-md px-1 py-3 transition hover:text-[#0f6e56] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e56] focus-visible:ring-offset-2"
            href="#capabilities"
            @click.prevent="scrollToSection('capabilities')"
          >
            {{ t('marketing.presense.nav.features') }}
          </a>
          <a
            class="rounded-md px-1 py-3 transition hover:text-[#0f6e56] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e56] focus-visible:ring-offset-2"
            href="#how-it-works"
            @click.prevent="scrollToSection('how-it-works')"
          >
            {{ t('marketing.presense.nav.flow') }}
          </a>
          <a
            class="rounded-md px-1 py-3 transition hover:text-[#0f6e56] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e56] focus-visible:ring-offset-2"
            href="#platform"
            @click.prevent="scrollToSection('platform')"
          >
            {{ t('marketing.presense.nav.platform') }}
          </a>
        </nav>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#0f6e56]/25 bg-white px-3 text-sm font-semibold text-[#0f6e56] shadow-sm transition hover:bg-[#e1f5ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e56] focus-visible:ring-offset-2"
            :aria-label="t('marketing.presense.languageSwitch')"
            @click="switchLanguage"
          >
            <Globe2 class="size-4" />
            {{ currentLocaleLabel }}
          </button>
          <NuxtLink
            :to="adminLoginPath"
            class="hidden min-h-11 items-center rounded-md px-4 text-sm font-semibold text-[#10231d] transition hover:bg-[#e1f5ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e56] focus-visible:ring-offset-2 sm:inline-flex"
          >
            {{ t('marketing.presense.cta.adminLogin') }}
          </NuxtLink>
          <a
            :href="primaryCtaHref"
            class="hidden min-h-11 shrink-0 items-center gap-2 rounded-md bg-[#0f6e56] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#085041] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e56] focus-visible:ring-offset-2 sm:inline-flex"
            @click.prevent="scrollToSection('request-demo')"
          >
            {{ t('marketing.presense.cta.demo') }}
            <ArrowRight class="size-4" />
          </a>
        </div>
      </div>
    </section>

    <section
      id="top"
      class="relative overflow-hidden bg-[#f6fbf8]"
    >
      <div class="mx-auto grid w-full max-w-7xl gap-10 px-5 pb-12 pt-10 sm:px-8 lg:min-h-[calc(100dvh-85px)] lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-10 lg:py-12">
        <div class="w-full max-w-[22rem] sm:max-w-3xl">
          <div class="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#9fe1cb] bg-white px-3 text-sm font-semibold text-[#0f6e56] shadow-sm">
            <ShieldCheck class="size-4" />
            {{ t('marketing.presense.hero.badge') }}
          </div>
          <h1 class="mt-6 max-w-4xl text-3xl font-semibold leading-tight tracking-normal text-[#10231d] sm:text-5xl lg:text-6xl">
            {{ t('marketing.presense.hero.title') }}
          </h1>
          <p class="mt-5 max-w-2xl text-base leading-8 text-[#3f554d] sm:text-lg">
            {{ t('marketing.presense.hero.description') }}
          </p>
          <div class="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              :href="primaryCtaHref"
              class="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#0f6e56] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#085041] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e56] focus-visible:ring-offset-2"
              @click.prevent="scrollToSection('request-demo')"
            >
              {{ t('marketing.presense.cta.demo') }}
              <ArrowRight class="size-4" />
            </a>
            <a
              :href="flowHref"
              class="inline-flex min-h-12 items-center justify-center rounded-md border border-[#0f6e56]/30 bg-white px-5 text-sm font-semibold text-[#0f6e56] shadow-sm transition hover:bg-[#e1f5ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e56] focus-visible:ring-offset-2"
              @click.prevent="scrollToSection('how-it-works')"
            >
              {{ t('marketing.presense.cta.flow') }}
            </a>
          </div>
          <div class="mt-8 grid gap-3 text-sm text-[#3f554d] sm:grid-cols-3">
            <div class="flex items-start gap-2">
              <CheckCircle2 class="mt-0.5 size-4 shrink-0 text-[#0f6e56]" />
              {{ t('marketing.presense.hero.proof1') }}
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle2 class="mt-0.5 size-4 shrink-0 text-[#0f6e56]" />
              {{ t('marketing.presense.hero.proof2') }}
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle2 class="mt-0.5 size-4 shrink-0 text-[#0f6e56]" />
              {{ t('marketing.presense.hero.proof3') }}
            </div>
          </div>
        </div>

        <div
          class="relative w-full max-w-[22rem] sm:max-w-none"
          :aria-label="t('marketing.presense.mock.aria')"
        >
          <div class="rounded-lg border border-[#d8ebe4] bg-white p-4 shadow-[0_24px_80px_-48px_rgba(8,80,65,0.55)]">
            <div class="flex items-center justify-between border-b border-[#e7f2ee] pb-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[#0f6e56]">
                  {{ t('marketing.presense.mock.dashboardLabel') }}
                </p>
                <p class="mt-1 text-lg font-semibold text-[#10231d]">
                  {{ t('marketing.presense.mock.dashboardTitle') }}
                </p>
              </div>
              <div class="rounded-md bg-[#e1f5ee] px-3 py-2 text-sm font-semibold text-[#0f6e56]">
                {{ t('marketing.presense.mock.today') }}
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
              <div
                v-for="metric in metricCards"
                :key="metric.label"
                class="rounded-md border p-3"
                :class="metric.tone"
              >
                <p class="text-xs font-medium">
                  {{ metric.label }}
                </p>
                <p class="mt-2 text-2xl font-semibold">
                  {{ metric.value }}
                </p>
              </div>
            </div>

            <div class="mt-4 rounded-md border border-[#d8ebe4] bg-[#fbfefd] p-4">
              <div class="mb-3 flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-[#10231d]">
                  {{ t('marketing.presense.mock.exceptions') }}
                </p>
                <span class="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">{{ t('marketing.presense.mock.needsReview') }}</span>
              </div>
              <div class="space-y-2">
                <div class="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-[#e7f2ee] bg-white p-3 text-sm">
                  <div>
                    <p class="font-semibold text-[#10231d]">
                      Budi Santoso
                    </p>
                    <p class="text-[#60756d]">
                      EMP-001 - {{ t('marketing.presense.mock.checkIn') }} - Mobile
                    </p>
                  </div>
                  <span class="self-start rounded-md bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-900">{{ t('marketing.presense.mock.late') }}</span>
                </div>
                <div class="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-[#e7f2ee] bg-white p-3 text-sm">
                  <div>
                    <p class="font-semibold text-[#10231d]">
                      Siti Aminah
                    </p>
                    <p class="text-[#60756d]">
                      EMP-014 - {{ t('marketing.presense.mock.photoAvailable') }}
                    </p>
                  </div>
                  <span class="self-start rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900">{{ t('marketing.presense.mock.recorded') }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-5 rounded-lg border border-[#0f6e56]/20 bg-[#0d1f19] p-4 text-white shadow-[0_24px_70px_-48px_rgba(8,80,65,0.8)] lg:absolute lg:-bottom-8 lg:right-2 lg:w-80">
            <div class="flex items-start gap-3">
              <span class="flex size-11 items-center justify-center rounded-md bg-[#0f6e56]">
                <Smartphone class="size-5" />
              </span>
              <div>
                <p class="font-semibold">
                  {{ t('marketing.presense.mock.mobileTitle') }}
                </p>
                <p class="text-sm text-white/68">
                  {{ t('marketing.presense.mock.shift') }}
                </p>
              </div>
            </div>
            <div class="mt-4 rounded-md bg-white/8 p-3">
              <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[#9fe1cb]">
                {{ t('marketing.presense.mock.todayStatus') }}
              </p>
              <p class="mt-2 text-xl font-semibold">
                {{ t('marketing.presense.mock.readyCheckIn') }}
              </p>
              <p class="mt-1 text-sm text-white/68">
                {{ t('marketing.presense.mock.permissionHint') }}
              </p>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <div class="rounded-md bg-[#9fe1cb] px-3 py-3 text-center text-sm font-semibold text-[#10231d]">
                {{ t('marketing.presense.mock.checkIn') }}
              </div>
              <div class="rounded-md border border-white/18 px-3 py-3 text-center text-sm font-semibold text-white/58">
                {{ t('marketing.presense.mock.checkOut') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="presense-reveal bg-white py-16 sm:py-20">
      <div class="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div class="max-w-3xl">
          <p class="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f6e56]">
            {{ t('marketing.presense.pain.eyebrow') }}
          </p>
          <h2 class="mt-3 text-3xl font-semibold tracking-normal text-[#10231d] sm:text-4xl">
            {{ t('marketing.presense.pain.title') }}
          </h2>
        </div>
        <div class="mt-8 grid gap-3 md:grid-cols-2">
          <div
            v-for="point in painPoints"
            :key="point"
            class="flex items-start gap-3 rounded-md border border-[#d8ebe4] bg-[#f6fbf8] p-5"
          >
            <BadgeCheck class="mt-0.5 size-5 shrink-0 text-[#0f6e56]" />
            <p class="text-base leading-7 text-[#31443d]">
              {{ point }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section
      id="capabilities"
      class="presense-reveal bg-[#f6fbf8] py-16 sm:py-20"
    >
      <div class="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div class="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f6e56]">
              {{ t('marketing.presense.capability.eyebrow') }}
            </p>
            <h2 class="mt-3 text-3xl font-semibold tracking-normal text-[#10231d] sm:text-4xl">
              {{ t('marketing.presense.capability.title') }}
            </h2>
            <p class="mt-4 text-base leading-8 text-[#3f554d]">
              {{ t('marketing.presense.capability.description') }}
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <article
              v-for="capability in capabilities"
              :key="capability.title"
              class="rounded-md border border-[#d8ebe4] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_-35px_rgba(8,80,65,0.5)]"
            >
              <component
                :is="capability.icon"
                class="size-7 text-[#0f6e56]"
              />
              <h3 class="mt-4 text-lg font-semibold text-[#10231d]">
                {{ capability.title }}
              </h3>
              <p class="mt-2 text-sm leading-7 text-[#3f554d]">
                {{ capability.description }}
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section
      id="how-it-works"
      class="presense-reveal bg-white py-16 sm:py-20"
    >
      <div class="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div class="max-w-3xl">
          <p class="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f6e56]">
            {{ t('marketing.presense.workflow.eyebrow') }}
          </p>
          <h2 class="mt-3 text-3xl font-semibold tracking-normal text-[#10231d] sm:text-4xl">
            {{ t('marketing.presense.workflow.title') }}
          </h2>
        </div>
        <div class="mt-10 grid gap-4 md:grid-cols-4">
          <article
            v-for="(step, index) in workflowSteps"
            :key="step.title"
            class="rounded-md border border-[#d8ebe4] bg-[#fbfefd] p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_-35px_rgba(8,80,65,0.5)]"
          >
            <div class="flex size-10 items-center justify-center rounded-md bg-[#0f6e56] text-sm font-semibold text-white">
              {{ index + 1 }}
            </div>
            <h3 class="mt-5 text-lg font-semibold text-[#10231d]">
              {{ step.title }}
            </h3>
            <p class="mt-2 text-sm leading-7 text-[#3f554d]">
              {{ step.description }}
            </p>
          </article>
        </div>
      </div>
    </section>

    <section
      id="platform"
      class="presense-reveal bg-[#10231d] py-16 text-white sm:py-20"
    >
      <div class="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div class="max-w-3xl">
          <p class="text-sm font-semibold uppercase tracking-[0.14em] text-[#9fe1cb]">
            {{ t('marketing.presense.platform.eyebrow') }}
          </p>
          <h2 class="mt-3 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
            {{ t('marketing.presense.platform.title') }}
          </h2>
        </div>

        <div class="mt-8 grid gap-6 lg:grid-cols-2">
          <article class="rounded-lg border border-white/12 bg-white/6 p-6">
            <div class="flex items-center gap-3">
              <LayoutDashboard class="size-7 text-[#9fe1cb]" />
              <h3 class="text-2xl font-semibold">
                {{ t('marketing.presense.platform.admin.title') }}
              </h3>
            </div>
            <p class="mt-4 leading-8 text-white/72">
              {{ t('marketing.presense.platform.admin.description') }}
            </p>
            <ul class="mt-6 space-y-3">
              <li
                v-for="feature in adminFeatures"
                :key="feature"
                class="flex items-start gap-3 text-sm text-white/82"
              >
                <CheckCircle2 class="mt-0.5 size-4 shrink-0 text-[#9fe1cb]" />
                {{ feature }}
              </li>
            </ul>
          </article>

          <article class="rounded-lg border border-white/12 bg-white/6 p-6">
            <div class="flex items-center gap-3">
              <Smartphone class="size-7 text-[#9fe1cb]" />
              <h3 class="text-2xl font-semibold">
                {{ t('marketing.presense.platform.mobile.title') }}
              </h3>
            </div>
            <p class="mt-4 leading-8 text-white/72">
              {{ t('marketing.presense.platform.mobile.description') }}
            </p>
            <ul class="mt-6 space-y-3">
              <li
                v-for="feature in mobileFeatures"
                :key="feature"
                class="flex items-start gap-3 text-sm text-white/82"
              >
                <CheckCircle2 class="mt-0.5 size-4 shrink-0 text-[#9fe1cb]" />
                {{ feature }}
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <section
      id="request-demo"
      class="presense-reveal bg-[#f6fbf8] py-16 sm:py-20"
    >
      <div class="mx-auto max-w-4xl px-5 text-center sm:px-8">
        <div class="mx-auto flex size-12 items-center justify-center overflow-hidden rounded-md bg-[#0f6e56] text-white">
          <img
            src="/brand/presense-app-icon.svg"
            :alt="t('marketing.presense.logoAlt')"
            class="size-full object-cover"
          >
        </div>
        <h2 class="mt-6 text-3xl font-semibold tracking-normal text-[#10231d] sm:text-4xl">
          {{ t('marketing.presense.final.title') }}
        </h2>
        <p class="mx-auto mt-4 max-w-2xl text-base leading-8 text-[#3f554d]">
          {{ t('marketing.presense.final.description') }}
        </p>
        <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="mailto:support@artisanco.de?subject=Request%20Demo%20Presense"
            class="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#0f6e56] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#085041] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e56] focus-visible:ring-offset-2"
          >
            {{ t('marketing.presense.cta.demo') }}
            <ArrowRight class="size-4" />
          </a>
          <NuxtLink
            :to="adminLoginPath"
            class="inline-flex min-h-12 items-center justify-center rounded-md border border-[#0f6e56]/30 bg-white px-5 text-sm font-semibold text-[#0f6e56] shadow-sm transition hover:bg-[#e1f5ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e56] focus-visible:ring-offset-2"
          >
            {{ t('marketing.presense.cta.adminLogin') }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <footer class="border-t border-[#d8ebe4] bg-white px-5 py-8 sm:px-8">
      <div class="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[#3f554d] sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <span class="flex size-9 items-center justify-center overflow-hidden rounded-md bg-[#0f6e56] text-white">
            <img
              src="/brand/presense-app-icon.svg"
              :alt="t('marketing.presense.logoAlt')"
              class="size-full object-cover"
            >
          </span>
          <span>
            <span class="font-semibold text-[#10231d]">Presense</span>
            <span class="text-[#60756d]"> by ArtisanCode</span>
          </span>
        </div>
        <div class="flex items-center gap-4">
          <a
            class="inline-flex min-h-11 items-center rounded-md transition hover:text-[#0f6e56] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e56] focus-visible:ring-offset-2"
            href="#capabilities"
            @click.prevent="scrollToSection('capabilities')"
          >
            {{ t('marketing.presense.nav.features') }}
          </a>
          <a
            class="inline-flex min-h-11 items-center rounded-md transition hover:text-[#0f6e56] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e56] focus-visible:ring-offset-2"
            href="#request-demo"
            @click.prevent="scrollToSection('request-demo')"
          >
            {{ t('marketing.presense.cta.demo') }}
          </a>
        </div>
      </div>
    </footer>
  </main>
</template>

<style scoped>
:global(html) {
  scroll-behavior: smooth;
}

.presense-page {
  scroll-behavior: smooth;
}

.presense-reveal {
  opacity: 1;
  transform: none;
}

.presense-page.is-motion-ready .presense-reveal {
  opacity: 0;
  transform: translateY(22px);
  transition: opacity 420ms ease-out, transform 420ms ease-out;
}

.presense-page.is-motion-ready .presense-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  :global(html) {
    scroll-behavior: auto;
  }

  .presense-page {
    scroll-behavior: auto;
  }

  .presense-reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
