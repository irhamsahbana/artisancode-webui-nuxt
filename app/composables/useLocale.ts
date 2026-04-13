import { computed } from 'vue'
import { useCookie, useState } from '#app'

export type AppLocale = 'id' | 'en'

type LocaleMessageKey =
  | 'common.language'
  | 'common.indonesian'
  | 'common.english'
  | 'common.code'
  | 'common.name'
  | 'common.back'
  | 'common.loading'
  | 'common.selectLanguage'
  | 'common.requiredField'
  | 'auth.welcomeBack'
  | 'auth.signInDescription'
  | 'auth.email'
  | 'auth.password'
  | 'auth.tenantCode'
  | 'auth.tenantCodeHint'
  | 'auth.signIn'
  | 'auth.signingIn'
  | 'auth.noAccount'
  | 'auth.createOne'
  | 'auth.loginFailed'
  | 'auth.createAccount'
  | 'auth.registerDescription'
  | 'auth.organization'
  | 'auth.tenantName'
  | 'auth.fullName'
  | 'auth.username'
  | 'auth.businessEmail'
  | 'auth.businessEmailHint'
  | 'auth.passwordWeak'
  | 'auth.passwordFair'
  | 'auth.passwordGood'
  | 'auth.passwordStrong'
  | 'auth.passwordMin'
  | 'auth.passwordUpper'
  | 'auth.passwordLower'
  | 'auth.passwordNumber'
  | 'auth.creatingAccount'
  | 'auth.alreadyHaveAccount'
  | 'auth.registrationFailed'
  | 'layout.close'
  | 'layout.dashboard'
  | 'layout.resources'
  | 'layout.users'
  | 'layout.companies'
  | 'layout.employees'
  | 'layout.attendanceLogs'
  | 'layout.jobPositions'
  | 'layout.workLocations'
  | 'layout.workShifts'
  | 'layout.rolesPermissions'
  | 'layout.signedIn'
  | 'layout.themeLight'
  | 'layout.themeDark'
  | 'api.requestFailed'
  | 'api.networkError'
  | 'api.sessionExpired'
  | 'api.backendUnavailable'
  | 'api.backendUnexpected'
  | 'company.languageSection'
  | 'company.preferredLanguage'
  | 'company.supportedLanguages'
  | 'company.languageHint'
  | 'company.deleteOrgUnitConfirm'
  | 'company.orgUnitDeleted'
  | 'company.orgUnitCreated'
  | 'company.orgUnitUpdated'
  | 'company.supportedLanguagesMustIncludePreferred'
  | 'company.configurationUpdated'
  | 'company.updated'
  | 'company.company'
  | 'company.backToList'
  | 'company.loading'
  | 'company.manageDescription'
  | 'company.companyDetails'
  | 'company.organizationStructure'
  | 'company.configuration'
  | 'company.editCompany'

const localeMessages: Record<AppLocale, Record<LocaleMessageKey, string>> = {
  id: {
    'common.language': 'Bahasa',
    'common.indonesian': 'Indonesia',
    'common.english': 'Inggris',
    'common.code': 'Kode',
    'common.name': 'Nama',
    'common.back': 'Kembali',
    'common.loading': 'Memuat...',
    'common.selectLanguage': 'Pilih bahasa',
    'common.requiredField': '{field} wajib diisi',
    'auth.welcomeBack': 'Selamat datang kembali',
    'auth.signInDescription': 'Masuk ke akun ArtisanCode Anda',
    'auth.email': 'Email',
    'auth.password': 'Kata sandi',
    'auth.tenantCode': 'Kode Tenant',
    'auth.tenantCodeHint': 'Maksimal 5 karakter, tidak sensitif huruf besar kecil',
    'auth.signIn': 'Masuk',
    'auth.signingIn': 'Sedang masuk...',
    'auth.noAccount': 'Belum punya akun?',
    'auth.createOne': 'Buat akun',
    'auth.loginFailed': 'Login gagal',
    'auth.createAccount': 'Buat akun Anda',
    'auth.registerDescription': 'Siapkan organisasi Anda di ArtisanCode',
    'auth.organization': 'Organisasi',
    'auth.tenantName': 'Nama Tenant',
    'auth.fullName': 'Nama Lengkap',
    'auth.username': 'Username',
    'auth.businessEmail': 'Email Bisnis',
    'auth.businessEmailHint': 'Penyedia email gratis seperti Gmail atau Yahoo tidak diperbolehkan.',
    'auth.passwordWeak': 'Lemah',
    'auth.passwordFair': 'Cukup',
    'auth.passwordGood': 'Baik',
    'auth.passwordStrong': 'Kuat',
    'auth.passwordMin': 'Minimal 8 karakter',
    'auth.passwordUpper': 'Huruf besar',
    'auth.passwordLower': 'Huruf kecil',
    'auth.passwordNumber': 'Angka',
    'auth.creatingAccount': 'Sedang membuat akun...',
    'auth.alreadyHaveAccount': 'Sudah punya akun?',
    'auth.registrationFailed': 'Pendaftaran gagal',
    'layout.close': 'Tutup',
    'layout.dashboard': 'Dashboard',
    'layout.resources': 'Resource',
    'layout.users': 'Pengguna',
    'layout.companies': 'Perusahaan',
    'layout.employees': 'Karyawan',
    'layout.attendanceLogs': 'Log Kehadiran',
    'layout.jobPositions': 'Jabatan',
    'layout.workLocations': 'Lokasi Kerja',
    'layout.workShifts': 'Shift Kerja',
    'layout.rolesPermissions': 'Peran & Izin',
    'layout.signedIn': 'Masuk sebagai',
    'layout.themeLight': 'Terang',
    'layout.themeDark': 'Gelap',
    'api.requestFailed': 'Permintaan gagal',
    'api.networkError': 'Terjadi gangguan jaringan',
    'api.sessionExpired': 'Sesi berakhir. Silakan masuk kembali.',
    'api.backendUnavailable': 'Layanan backend tidak tersedia. Silakan coba lagi nanti.',
    'api.backendUnexpected': 'Terjadi kesalahan saat menghubungi layanan backend.',
    'company.languageSection': 'Bahasa',
    'company.preferredLanguage': 'Bahasa Default',
    'company.supportedLanguages': 'Bahasa yang Didukung',
    'company.languageHint': 'Bahasa default tenant disimpan di backend config dan bisa dipakai web maupun mobile.',
    'company.deleteOrgUnitConfirm': 'Hapus "{name}"? Tindakan ini tidak bisa dibatalkan.',
    'company.orgUnitDeleted': 'Unit organisasi berhasil dihapus.',
    'company.orgUnitCreated': 'Unit organisasi berhasil dibuat.',
    'company.orgUnitUpdated': 'Unit organisasi berhasil diperbarui.',
    'company.supportedLanguagesMustIncludePreferred': 'Bahasa default harus termasuk dalam daftar bahasa yang didukung.',
    'company.configurationUpdated': 'Konfigurasi perusahaan berhasil diperbarui.',
    'company.updated': 'Perusahaan berhasil diperbarui.',
    'company.company': 'Perusahaan',
    'company.backToList': 'Kembali',
    'company.loading': 'Memuat data perusahaan...',
    'company.manageDescription': 'Kelola detail perusahaan dan struktur organisasi.',
    'company.companyDetails': 'Detail Perusahaan',
    'company.organizationStructure': 'Struktur Organisasi',
    'company.configuration': 'Konfigurasi',
    'company.editCompany': 'Edit Perusahaan',
  },
  en: {
    'common.language': 'Language',
    'common.indonesian': 'Indonesian',
    'common.english': 'English',
    'common.code': 'Code',
    'common.name': 'Name',
    'common.back': 'Back',
    'common.loading': 'Loading...',
    'common.selectLanguage': 'Select language',
    'common.requiredField': '{field} is required',
    'auth.welcomeBack': 'Welcome back',
    'auth.signInDescription': 'Sign in to your ArtisanCode account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.tenantCode': 'Tenant Code',
    'auth.tenantCodeHint': 'Maximum 5 characters, case insensitive',
    'auth.signIn': 'Sign in',
    'auth.signingIn': 'Signing in...',
    'auth.noAccount': 'Don\'t have an account?',
    'auth.createOne': 'Create one',
    'auth.loginFailed': 'Login failed',
    'auth.createAccount': 'Create your account',
    'auth.registerDescription': 'Set up your organization on ArtisanCode',
    'auth.organization': 'Organization',
    'auth.tenantName': 'Tenant Name',
    'auth.fullName': 'Full Name',
    'auth.username': 'Username',
    'auth.businessEmail': 'Business Email',
    'auth.businessEmailHint': 'Free email providers such as Gmail or Yahoo are not allowed.',
    'auth.passwordWeak': 'Weak',
    'auth.passwordFair': 'Fair',
    'auth.passwordGood': 'Good',
    'auth.passwordStrong': 'Strong',
    'auth.passwordMin': 'Min 8 characters',
    'auth.passwordUpper': 'Uppercase letter',
    'auth.passwordLower': 'Lowercase letter',
    'auth.passwordNumber': 'Number',
    'auth.creatingAccount': 'Creating account...',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.registrationFailed': 'Registration failed',
    'layout.close': 'Close',
    'layout.dashboard': 'Dashboard',
    'layout.resources': 'Resources',
    'layout.users': 'Users',
    'layout.companies': 'Companies',
    'layout.employees': 'Employees',
    'layout.attendanceLogs': 'Attendance Logs',
    'layout.jobPositions': 'Job Positions',
    'layout.workLocations': 'Work Locations',
    'layout.workShifts': 'Work Shifts',
    'layout.rolesPermissions': 'Roles & Permissions',
    'layout.signedIn': 'Signed in',
    'layout.themeLight': 'Light',
    'layout.themeDark': 'Dark',
    'api.requestFailed': 'Request failed',
    'api.networkError': 'Network error',
    'api.sessionExpired': 'Session expired. Please sign in again.',
    'api.backendUnavailable': 'Backend service is unavailable. Please try again later.',
    'api.backendUnexpected': 'An unexpected error occurred while contacting the backend service.',
    'company.languageSection': 'Language',
    'company.preferredLanguage': 'Default Language',
    'company.supportedLanguages': 'Supported Languages',
    'company.languageHint': 'The tenant default language is stored in backend config and can be used by web and mobile clients.',
    'company.deleteOrgUnitConfirm': 'Delete "{name}"? This cannot be undone.',
    'company.orgUnitDeleted': 'Organization unit deleted.',
    'company.orgUnitCreated': 'Organization unit created.',
    'company.orgUnitUpdated': 'Organization unit updated.',
    'company.supportedLanguagesMustIncludePreferred': 'Preferred language must be included in supported languages.',
    'company.configurationUpdated': 'Company configuration updated.',
    'company.updated': 'Company updated.',
    'company.company': 'Company',
    'company.backToList': 'Back',
    'company.loading': 'Loading company data...',
    'company.manageDescription': 'Manage company details and organization structure.',
    'company.companyDetails': 'Company Details',
    'company.organizationStructure': 'Organization Structure',
    'company.configuration': 'Configuration',
    'company.editCompany': 'Edit Company',
  },
}

const localeOptions = [
  { value: 'id' as AppLocale, labelKey: 'common.indonesian' as const },
  { value: 'en' as AppLocale, labelKey: 'common.english' as const },
]

const isSupportedLocale = (value: string | null | undefined): value is AppLocale =>
  value === 'id' || value === 'en'

export const useLocale = () => {
  const localeCookie = useCookie<AppLocale>('ac_locale', {
    default: () => 'id',
  })
  const locale = useState<AppLocale>('app_locale', () => (
    isSupportedLocale(localeCookie.value) ? localeCookie.value : 'id'
  ))

  if (isSupportedLocale(localeCookie.value) && locale.value !== localeCookie.value) {
    locale.value = localeCookie.value
  }

  const setLocale = (value: AppLocale) => {
    locale.value = value
    localeCookie.value = value
  }

  const t = (key: LocaleMessageKey) => localeMessages[locale.value][key] ?? localeMessages.id[key] ?? key

  const format = (key: LocaleMessageKey, params: Record<string, string>) => {
    const template = t(key)
    return Object.entries(params).reduce(
      (message, [name, value]) => message.replaceAll(`{${name}}`, value),
      template,
    )
  }

  const options = computed(() => localeOptions.map((item) => ({
    value: item.value,
    label: t(item.labelKey),
  })))

  return {
    locale,
    options,
    setLocale,
    t,
    format,
  }
}
