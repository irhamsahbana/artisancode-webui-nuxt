import { computed } from 'vue'
import { useCookie, useState } from '#app'

export type AppLocale = 'id' | 'en'

type LocaleMessageKey =
  | 'common.language'
  | 'common.indonesian'
  | 'common.english'
  | 'common.code'
  | 'common.name'
  | 'common.category'
  | 'common.back'
  | 'common.close'
  | 'common.cancel'
  | 'common.create'
  | 'common.delete'
  | 'common.deleting'
  | 'common.save'
  | 'common.saveChanges'
  | 'common.saveConfiguration'
  | 'common.saving'
  | 'common.loading'
  | 'common.noData'
  | 'common.selectLanguage'
  | 'common.selectCategory'
  | 'common.requiredField'
  | 'common.edit'
  | 'common.actions'
  | 'common.detail'
  | 'common.filter'
  | 'common.clear'
  | 'common.search'
  | 'common.previous'
  | 'common.next'
  | 'common.page'
  | 'common.of'
  | 'common.rowsPerPage'
  | 'common.limit'
  | 'common.select'
  | 'common.selectAll'
  | 'common.update'
  | 'common.location'
  | 'common.latitude'
  | 'common.longitude'
  | 'common.myLocation'
  | 'layout.main'
  | 'layout.adminConsole'
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
  | 'auth.forgotPassword'
  | 'auth.forgotPasswordDescription'
  | 'auth.sendResetLink'
  | 'auth.sendingResetLink'
  | 'auth.resetPassword'
  | 'auth.resetPasswordDescription'
  | 'auth.resetPasswordAction'
  | 'auth.resettingPassword'
  | 'auth.confirmPassword'
  | 'auth.passwordMismatch'
  | 'auth.backToLogin'
  | 'auth.checkEmail'
  | 'auth.checkEmailDescription'
  | 'auth.verifyingEmail'
  | 'auth.emailVerificationFailed'
  | 'auth.resendVerificationEmail'
  | 'auth.resendingVerificationEmail'
  | 'auth.verificationRequiredNotice'
  | 'auth.passwordResetFailed'
  | 'auth.checkEmailBadge'
  | 'auth.checkEmailHero'
  | 'auth.checkEmailHelp'
  | 'auth.emailSentTo'
  | 'auth.emailUnavailable'
  | 'auth.checkInboxStep'
  | 'auth.checkInboxHint'
  | 'auth.openVerificationLinkStep'
  | 'auth.openVerificationLinkHint'
  | 'auth.returnToSignInStep'
  | 'auth.returnToSignInHint'
  | 'auth.didNotReceiveEmail'
  | 'auth.didNotReceiveEmailHint'
  | 'auth.openEmailApp'
  | 'auth.spamFolderHint'
  | 'auth.resendInCountdown'
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
  | 'company.companyCode'
  | 'company.companyName'
  | 'company.companyConfiguration'
  | 'company.attendance'
  | 'company.attendanceRadius'
  | 'company.leaveAllowance'
  | 'company.checkInStart'
  | 'company.checkInEnd'
  | 'company.checkOutStart'
  | 'company.checkOutEnd'
  | 'company.overtime'
  | 'company.overtimeRateMultiplier'
  | 'company.locale'
  | 'company.timezone'
  | 'company.dateFormat'
  | 'company.timeFormat'
  | 'company.organizationStructureLoading'
  | 'company.organizationStructureEmpty'
  | 'company.createOrganizationUnit'
  | 'company.editOrganizationUnit'
  | 'company.organizationUnitCode'
  | 'company.organizationUnitName'
  | 'company.organizationUnitCategory'
  | 'company.organizationUnitCodePlaceholder'
  | 'company.organizationUnitNamePlaceholder'
  | 'company.parentLabel'
  | 'company.workLocation'
  | 'company.workLocations'
  | 'company.addWorkLocation'
  | 'company.editWorkLocation'
  | 'company.workLocationCreated'
  | 'company.workLocationUpdated'
  | 'company.organizationUnit'
  | 'company.selectOrganizationUnit'
  | 'company.address'
  | 'company.radiusMeters'
  | 'company.locationAndAddress'
  | 'resource.detailEmpty'
  | 'resource.confirmDelete'
  | 'resource.deleteConfirmDescription'
  | 'resource.failedLoadData'
  | 'resource.detailNotAvailable'
  | 'resource.deleteFailedMissingId'
  | 'resource.selectedRows'
  | 'resource.searchLocation'
  | 'resource.mapPickerHint'
  | 'resource.geolocationUnsupported'
  | 'resource.geolocationDenied'
  | 'resource.geolocationUnavailable'
  | 'resource.geolocationTimeout'
  | 'resource.geolocationUnknown'
  | 'resource.noOrganizationUnits'

const localeMessages: Record<AppLocale, Record<LocaleMessageKey, string>> = {
  id: {
    'common.language': 'Bahasa',
    'common.indonesian': 'Indonesia',
    'common.english': 'Inggris',
    'common.code': 'Kode',
    'common.name': 'Nama',
    'common.category': 'Kategori',
    'common.back': 'Kembali',
    'common.close': 'Tutup',
    'common.cancel': 'Batal',
    'common.create': 'Buat',
    'common.delete': 'Hapus',
    'common.deleting': 'Menghapus...',
    'common.save': 'Simpan',
    'common.saveChanges': 'Simpan perubahan',
    'common.saveConfiguration': 'Simpan konfigurasi',
    'common.saving': 'Menyimpan...',
    'common.loading': 'Memuat...',
    'common.noData': 'Belum ada data.',
    'common.selectLanguage': 'Pilih bahasa',
    'common.selectCategory': 'Pilih kategori',
    'common.requiredField': '{field} wajib diisi',
    'common.edit': 'Edit',
    'common.actions': 'Aksi',
    'common.detail': 'Detail',
    'common.filter': 'Filter',
    'common.clear': 'Hapus',
    'common.search': 'Cari',
    'common.previous': 'Sebelumnya',
    'common.next': 'Berikutnya',
    'common.page': 'Halaman',
    'common.of': 'dari',
    'common.rowsPerPage': 'Baris per halaman',
    'common.limit': 'Batas',
    'common.select': 'Pilih',
    'common.selectAll': 'Pilih semua',
    'common.update': 'Perbarui',
    'common.location': 'Lokasi',
    'common.latitude': 'Lintang',
    'common.longitude': 'Bujur',
    'common.myLocation': 'Lokasi Saya',
    'layout.main': 'Utama',
    'layout.adminConsole': 'Konsol Admin',
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
    'auth.forgotPassword': 'Lupa kata sandi?',
    'auth.forgotPasswordDescription': 'Masukkan email Anda dan kami akan mengirim tautan reset password.',
    'auth.sendResetLink': 'Kirim tautan reset',
    'auth.sendingResetLink': 'Mengirim tautan reset...',
    'auth.resetPassword': 'Reset kata sandi',
    'auth.resetPasswordDescription': 'Masukkan kata sandi baru untuk akun Anda.',
    'auth.resetPasswordAction': 'Reset kata sandi',
    'auth.resettingPassword': 'Mereset kata sandi...',
    'auth.confirmPassword': 'Konfirmasi kata sandi',
    'auth.passwordMismatch': 'Konfirmasi kata sandi tidak cocok',
    'auth.backToLogin': 'Kembali ke login',
    'auth.checkEmail': 'Verifikasi email',
    'auth.checkEmailDescription': 'Selesaikan langkah verifikasi atau kembali ke login.',
    'auth.verifyingEmail': 'Sedang memverifikasi email Anda...',
    'auth.emailVerificationFailed': 'Verifikasi email gagal',
    'auth.resendVerificationEmail': 'Kirim ulang email verifikasi',
    'auth.resendingVerificationEmail': 'Mengirim ulang email verifikasi...',
    'auth.verificationRequiredNotice': 'Pendaftaran berhasil. Silakan cek email Anda untuk verifikasi akun.',
    'auth.passwordResetFailed': 'Reset kata sandi gagal',
    'auth.checkEmailBadge': 'Langkah terakhir',
    'auth.checkEmailHero': 'Cek email Anda untuk mengaktifkan akun',
    'auth.checkEmailHelp': 'Kami sudah mengirim tautan verifikasi ke inbox Anda. Buka email tersebut, klik tautannya, lalu kembali masuk ke ArtisanCode.',
    'auth.emailSentTo': 'Email dikirim ke',
    'auth.emailUnavailable': 'Email tidak tersedia',
    'auth.checkInboxStep': 'Buka inbox',
    'auth.checkInboxHint': 'Cari email verifikasi dari ArtisanCode di inbox utama atau folder promosi.',
    'auth.openVerificationLinkStep': 'Klik tautan verifikasi',
    'auth.openVerificationLinkHint': 'Tautan verifikasi akan mengaktifkan akun Anda dan mengonfirmasi alamat email tersebut.',
    'auth.returnToSignInStep': 'Masuk kembali',
    'auth.returnToSignInHint': 'Setelah verifikasi selesai, kembali ke halaman login dan masuk seperti biasa.',
    'auth.didNotReceiveEmail': 'Belum menerima email?',
    'auth.didNotReceiveEmailHint': 'Anda bisa kirim ulang email verifikasi atau langsung buka aplikasi email Anda.',
    'auth.openEmailApp': 'Buka aplikasi email',
    'auth.spamFolderHint': 'Tip: periksa folder spam, update, atau promotion jika email belum terlihat dalam beberapa menit.',
    'auth.resendInCountdown': 'Kirim ulang dalam {seconds} detik',
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
    'company.companyCode': 'Kode Perusahaan',
    'company.companyName': 'Nama Perusahaan',
    'company.companyConfiguration': 'Konfigurasi Perusahaan',
    'company.attendance': 'Kehadiran',
    'company.attendanceRadius': 'Radius Kehadiran (meter)',
    'company.leaveAllowance': 'Jatah Cuti (hari/tahun)',
    'company.checkInStart': 'Mulai Check-in',
    'company.checkInEnd': 'Akhir Check-in',
    'company.checkOutStart': 'Mulai Check-out',
    'company.checkOutEnd': 'Akhir Check-out',
    'company.overtime': 'Lembur',
    'company.overtimeRateMultiplier': 'Pengali Tarif Lembur',
    'company.locale': 'Lokal',
    'company.timezone': 'Zona Waktu',
    'company.dateFormat': 'Format Tanggal',
    'company.timeFormat': 'Format Waktu',
    'company.organizationStructureLoading': 'Memuat struktur organisasi...',
    'company.organizationStructureEmpty': 'Belum ada unit organisasi untuk perusahaan ini.',
    'company.createOrganizationUnit': 'Buat Unit Organisasi',
    'company.editOrganizationUnit': 'Edit Unit Organisasi',
    'company.organizationUnitCode': 'Kode Unit Organisasi',
    'company.organizationUnitName': 'Nama Unit Organisasi',
    'company.organizationUnitCategory': 'Kategori',
    'company.organizationUnitCodePlaceholder': 'Kode unit organisasi',
    'company.organizationUnitNamePlaceholder': 'Nama unit organisasi',
    'company.parentLabel': 'Induk: {name} ({category})',
    'company.workLocation': 'Lokasi Kerja',
    'company.workLocations': 'Lokasi Kerja',
    'company.addWorkLocation': 'Tambah Lokasi Kerja',
    'company.editWorkLocation': 'Edit Lokasi Kerja',
    'company.workLocationCreated': 'Lokasi kerja berhasil dibuat.',
    'company.workLocationUpdated': 'Lokasi kerja berhasil diperbarui.',
    'company.organizationUnit': 'Unit Organisasi',
    'company.selectOrganizationUnit': 'Pilih unit organisasi',
    'company.address': 'Alamat',
    'company.radiusMeters': 'Radius (meter)',
    'company.locationAndAddress': 'Lokasi & Alamat',
    'resource.detailEmpty': 'Tidak ada detail tersedia.',
    'resource.confirmDelete': 'Konfirmasi hapus',
    'resource.deleteConfirmDescription': 'Hapus {label}? Tindakan ini tidak dapat dibatalkan.',
    'resource.failedLoadData': 'Gagal memuat data.',
    'resource.detailNotAvailable': 'Detail tidak tersedia.',
    'resource.deleteFailedMissingId': 'Gagal menghapus: ID tidak ditemukan.',
    'resource.selectedRows': '{selected} dari {total} baris dipilih',
    'resource.searchLocation': 'Cari lokasi...',
    'resource.mapPickerHint': 'Klik pada peta, geser penanda, atau gunakan "Lokasi Saya" untuk menentukan lokasi.',
    'resource.geolocationUnsupported': 'Geolokasi tidak didukung oleh browser Anda.',
    'resource.geolocationDenied': 'Izin lokasi ditolak. Silakan aktifkan di pengaturan browser Anda.',
    'resource.geolocationUnavailable': 'Informasi lokasi tidak tersedia.',
    'resource.geolocationTimeout': 'Permintaan lokasi melebihi batas waktu. Silakan coba lagi.',
    'resource.geolocationUnknown': 'Terjadi kesalahan yang tidak diketahui saat mengambil lokasi.',
    'resource.noOrganizationUnits': 'Unit organisasi belum tersedia.',
  },
  en: {
    'common.language': 'Language',
    'common.indonesian': 'Indonesian',
    'common.english': 'English',
    'common.code': 'Code',
    'common.name': 'Name',
    'common.category': 'Category',
    'common.back': 'Back',
    'common.close': 'Close',
    'common.cancel': 'Cancel',
    'common.create': 'Create',
    'common.delete': 'Delete',
    'common.deleting': 'Deleting...',
    'common.save': 'Save',
    'common.saveChanges': 'Save changes',
    'common.saveConfiguration': 'Save configuration',
    'common.saving': 'Saving...',
    'common.loading': 'Loading...',
    'common.noData': 'No data yet.',
    'common.selectLanguage': 'Select language',
    'common.selectCategory': 'Select category',
    'common.requiredField': '{field} is required',
    'common.edit': 'Edit',
    'common.actions': 'Actions',
    'common.detail': 'Detail',
    'common.filter': 'Filter',
    'common.clear': 'Clear',
    'common.search': 'Search',
    'common.previous': 'Previous',
    'common.next': 'Next',
    'common.page': 'Page',
    'common.of': 'of',
    'common.rowsPerPage': 'Rows per page',
    'common.limit': 'Limit',
    'common.select': 'Select',
    'common.selectAll': 'Select all',
    'common.update': 'Update',
    'common.location': 'Location',
    'common.latitude': 'Latitude',
    'common.longitude': 'Longitude',
    'common.myLocation': 'My Location',
    'layout.main': 'Main',
    'layout.adminConsole': 'Admin Console',
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
    'auth.forgotPassword': 'Forgot password?',
    'auth.forgotPasswordDescription': 'Enter your email and we will send a password reset link.',
    'auth.sendResetLink': 'Send reset link',
    'auth.sendingResetLink': 'Sending reset link...',
    'auth.resetPassword': 'Reset password',
    'auth.resetPasswordDescription': 'Enter a new password for your account.',
    'auth.resetPasswordAction': 'Reset password',
    'auth.resettingPassword': 'Resetting password...',
    'auth.confirmPassword': 'Confirm password',
    'auth.passwordMismatch': 'Password confirmation does not match',
    'auth.backToLogin': 'Back to login',
    'auth.checkEmail': 'Verify email',
    'auth.checkEmailDescription': 'Complete the verification step or head back to login.',
    'auth.verifyingEmail': 'Verifying your email...',
    'auth.emailVerificationFailed': 'Email verification failed',
    'auth.resendVerificationEmail': 'Resend verification email',
    'auth.resendingVerificationEmail': 'Resending verification email...',
    'auth.verificationRequiredNotice': 'Registration succeeded. Please check your email to verify your account.',
    'auth.passwordResetFailed': 'Password reset failed',
    'auth.checkEmailBadge': 'Final step',
    'auth.checkEmailHero': 'Check your email to activate your account',
    'auth.checkEmailHelp': 'We have sent a verification link to your inbox. Open the email, click the link, then come back and sign in to ArtisanCode.',
    'auth.emailSentTo': 'Email sent to',
    'auth.emailUnavailable': 'Email unavailable',
    'auth.checkInboxStep': 'Open your inbox',
    'auth.checkInboxHint': 'Look for the ArtisanCode verification email in your primary inbox or promotions tab.',
    'auth.openVerificationLinkStep': 'Click the verification link',
    'auth.openVerificationLinkHint': 'The verification link activates your account and confirms this email address.',
    'auth.returnToSignInStep': 'Sign in again',
    'auth.returnToSignInHint': 'Once verification is done, return to the login page and sign in normally.',
    'auth.didNotReceiveEmail': 'Didn’t receive the email?',
    'auth.didNotReceiveEmailHint': 'You can resend the verification email or jump straight to your mail app.',
    'auth.openEmailApp': 'Open email app',
    'auth.spamFolderHint': 'Tip: check spam, updates, or promotions if the message does not show up after a few minutes.',
    'auth.resendInCountdown': 'Resend in {seconds}s',
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
    'company.companyCode': 'Company Code',
    'company.companyName': 'Company Name',
    'company.companyConfiguration': 'Company Configuration',
    'company.attendance': 'Attendance',
    'company.attendanceRadius': 'Attendance Radius (meters)',
    'company.leaveAllowance': 'Leave Allowance (days/year)',
    'company.checkInStart': 'Check-in Start',
    'company.checkInEnd': 'Check-in End',
    'company.checkOutStart': 'Check-out Start',
    'company.checkOutEnd': 'Check-out End',
    'company.overtime': 'Overtime',
    'company.overtimeRateMultiplier': 'Overtime Rate Multiplier',
    'company.locale': 'Locale',
    'company.timezone': 'Timezone',
    'company.dateFormat': 'Date Format',
    'company.timeFormat': 'Time Format',
    'company.organizationStructureLoading': 'Loading organization structure...',
    'company.organizationStructureEmpty': 'No organization units found for this company.',
    'company.createOrganizationUnit': 'Create Organization Unit',
    'company.editOrganizationUnit': 'Edit Organization Unit',
    'company.organizationUnitCode': 'Organization Unit Code',
    'company.organizationUnitName': 'Organization Unit Name',
    'company.organizationUnitCategory': 'Category',
    'company.organizationUnitCodePlaceholder': 'Organization unit code',
    'company.organizationUnitNamePlaceholder': 'Organization unit name',
    'company.parentLabel': 'Parent: {name} ({category})',
    'company.workLocation': 'Work Location',
    'company.workLocations': 'Work Locations',
    'company.addWorkLocation': 'Add Work Location',
    'company.editWorkLocation': 'Edit Work Location',
    'company.workLocationCreated': 'Work location created successfully.',
    'company.workLocationUpdated': 'Work location updated successfully.',
    'company.organizationUnit': 'Organization Unit',
    'company.selectOrganizationUnit': 'Select organization unit',
    'company.address': 'Address',
    'company.radiusMeters': 'Radius (meters)',
    'company.locationAndAddress': 'Location & Address',
    'resource.detailEmpty': 'No detail available.',
    'resource.confirmDelete': 'Confirm delete',
    'resource.deleteConfirmDescription': 'Delete {label}? This action cannot be undone.',
    'resource.failedLoadData': 'Failed to load data.',
    'resource.detailNotAvailable': 'Detail not available.',
    'resource.deleteFailedMissingId': 'Delete failed: missing id.',
    'resource.selectedRows': '{selected} of {total} row(s) selected',
    'resource.searchLocation': 'Search location...',
    'resource.mapPickerHint': 'Click on the map, drag the marker, or use "My Location" to set the location.',
    'resource.geolocationUnsupported': 'Geolocation is not supported by your browser.',
    'resource.geolocationDenied': 'Location permission denied. Please enable it in your browser settings.',
    'resource.geolocationUnavailable': 'Location information is unavailable.',
    'resource.geolocationTimeout': 'Location request timed out. Please try again.',
    'resource.geolocationUnknown': 'An unknown error occurred while getting location.',
    'resource.noOrganizationUnits': 'No organization units found.',
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
