import {
  Building2,
  CreditCard,
  FileText,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  MoonStar,
  SunMedium,
} from 'lucide-vue-next'
import type { Product } from '~/utils/product-mode'
import { isProductRouteAllowed } from '~/utils/product-mode'

type LayoutLocale = 'id' | 'en'

type LayoutNavItem = {
  label: string
  to: string
  icon: Component
}

type LayoutNavGroup = {
  title: string
  items: LayoutNavItem[]
}

type ProductOption = {
  value: Product
  label: string
}

const AUTH_SHELL_PATHS = [
  '/login',
  '/register',
  '/auth/check-email',
  '/auth/email-verification',
  '/auth/tenant-setup',
  '/auth/forgot-password',
  '/auth/invitation',
  '/auth/reset-password',
  '/app/internal/login',
]

const stripLocalePrefix = (path: string) => path.replace(/^\/en(?=\/|$)/, '') || '/'

const localeBadge = (value: LayoutLocale) =>
  value === 'id' ? 'Indonesia' : 'English'

export const useDefaultLayout = () => {
  const route = useRoute()
  const runtimeConfig = useRuntimeConfig()
  const { user, token, logout } = useAuth()
  const { user: internalUser, token: internalToken, logout: internalLogout } = useInternalAuth()
  const { navGroups: productNavGroups, productAppName } = useProductConfig()
  const { activeProduct, productOptions, setActiveProduct, showProductSwitcher } = useActiveProduct()
  const { locale, setLocale, t } = useLocale()
  const { visible, message, variant, hide } = useBanner()
  const colorMode = useColorMode()

  const normalizedPath = computed(() => stripLocalePrefix(route.path))
  const isInternalRoute = computed(() =>
    normalizedPath.value === '/app/internal' || normalizedPath.value.startsWith('/app/internal/'),
  )
  const isAuthPage = computed(() => AUTH_SHELL_PATHS.includes(stripLocalePrefix(route.path)))

  const mobileNavOpen = ref(false)
  const desktopAccountMenuOpen = ref(false)
  const mobileAccountMenuOpen = ref(false)
  const isSwitchingLocale = ref(false)

  const appName = computed(() => {
    if (isInternalRoute.value) {
      return runtimeConfig.public.appName || 'ArtisanCode'
    }

    return productAppName.value
  })

  const navGroups = computed<LayoutNavGroup[]>(() => {
    if (isInternalRoute.value) {
      return [
        {
          title: t('ui.internal'),
          items: [
            { label: t('ui.clients'), to: '/app/internal/clients', icon: Building2 },
            { label: t('ui.users'), to: '/app/internal/users', icon: ShieldCheck },
            { label: t('ui.products'), to: '/app/internal/products', icon: Building2 },
            { label: t('billingSettings.currencies.nav'), to: '/app/internal/currencies', icon: CreditCard },
          ],
        },
        {
          title: t('ui.commerce'),
          items: [
            { label: t('ui.quotations'), to: '/app/internal/quotations', icon: FileText },
            { label: t('ui.orders'), to: '/app/internal/orders', icon: ShoppingCart },
            { label: t('ui.invoices'), to: '/app/internal/invoices', icon: ReceiptText },
          ],
        },
      ]
    }

    return productNavGroups.value
  })

  const isActive = (path: string) => {
    const currentPath = stripLocalePrefix(route.path)
    return currentPath === path || currentPath.startsWith(`${path}/`)
  }

  const isNavItemActive = (path: string) =>
    isActive(path) && (path !== '/app' || normalizedPath.value === '/app')

  const isDarkTheme = computed(() => colorMode.value === 'dark')
  const currentThemeIcon = computed(() => (isDarkTheme.value ? MoonStar : SunMedium))

  const currentPageTitle = computed(() => {
    if (normalizedPath.value === '/app/settings/tenant') {
      return t('settings.tenant.title')
    }

    for (const group of navGroups.value) {
      const activeItem = group.items.find((item) => isNavItemActive(item.to))
      if (activeItem) {
        return activeItem.label
      }
    }

    return appName.value
  })

  const currentPageGroup = computed(() => {
    if (normalizedPath.value === '/app/settings/tenant') {
      return t('layout.preferences')
    }

    for (const group of navGroups.value) {
      const activeItem = group.items.find((item) => isNavItemActive(item.to))
      if (activeItem) {
        return group.title
      }
    }

    return t('layout.main')
  })

  const documentTitle = computed(() => {
    if (isAuthPage.value) {
      return appName.value
    }

    return `${appName.value} - ${currentPageGroup.value} - ${currentPageTitle.value}`
  })

  useHead(() => ({
    title: documentTitle.value,
    link: [
      { rel: 'icon', type: 'image/png', href: '/favicon.png' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ],
  }))

  const nextLocale = computed<LayoutLocale>(() => (locale.value === 'id' ? 'en' : 'id'))
  const currentLocaleBadge = computed(() => localeBadge(locale.value))
  const activeSessionToken = computed(() => (isInternalRoute.value ? internalToken.value : token.value))
  const activeUser = computed(() => (isInternalRoute.value ? internalUser.value : user.value))
  const userDisplayName = computed(() => activeUser.value?.name || activeUser.value?.username || appName.value)
  const userTenantName = computed(() =>
    isInternalRoute.value ? t('ui.internal') : user.value?.tenant_name || t('layout.adminConsole'),
  )
  const currentThemeLabel = computed(() =>
    colorMode.value === 'dark' ? t('layout.themeDark') : t('layout.themeLight'),
  )

  const toggleTheme = () => {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }

  const handleLogout = async () => {
    if (isInternalRoute.value) {
      await internalLogout()
      return
    }

    await logout()
  }

  const switchLocale = async (value: LayoutLocale = nextLocale.value) => {
    if (isSwitchingLocale.value || locale.value === value) {
      return
    }

    isSwitchingLocale.value = true

    try {
      await setLocale(value)
    } finally {
      isSwitchingLocale.value = false
    }
  }

  const toggleDesktopAccountMenu = () => {
    desktopAccountMenuOpen.value = !desktopAccountMenuOpen.value
  }

  const toggleMobileAccountMenu = () => {
    mobileAccountMenuOpen.value = !mobileAccountMenuOpen.value
  }

  const switchProduct = async (value: Product) => {
    if (isInternalRoute.value || activeProduct.value === value) {
      return
    }

    setActiveProduct(value)

    if (!isProductRouteAllowed([value], normalizedPath.value)) {
      const target = locale.value === 'en' ? '/en/app' : '/app'
      await navigateTo(target)
    }
  }

  watch(
    () => route.fullPath,
    () => {
      mobileNavOpen.value = false
      desktopAccountMenuOpen.value = false
      mobileAccountMenuOpen.value = false
    },
  )

  return {
    activeSessionToken,
    appName,
    currentLocaleBadge,
    currentPageGroup,
    currentPageTitle,
    currentThemeIcon,
    currentThemeLabel,
    desktopAccountMenuOpen,
    handleLogout,
    hide,
    isAuthPage,
    isDarkTheme,
    isInternalRoute,
    isNavItemActive,
    isSwitchingLocale,
    message,
    mobileAccountMenuOpen,
    mobileNavOpen,
    navGroups,
    activeProduct,
    productOptions: productOptions as ComputedRef<ProductOption[]>,
    showProductSwitcher,
    switchLocale,
    switchProduct,
    t,
    toggleDesktopAccountMenu,
    toggleMobileAccountMenu,
    toggleTheme,
    userDisplayName,
    userTenantName,
    variant,
    visible,
  }
}
