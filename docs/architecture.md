# Architecture

Web UI berjalan di atas **Nuxt 4**, **Vue 3**, **TypeScript**, dan **Tailwind CSS**.
Project root: `webui/`

## Active Directory Structure

Direktori yang benar-benar aktif saat ini:

1. `app/`
   - entry Nuxt app dan UI shell utama
2. `app/pages/`
   - file-based routes yang umumnya tipis
3. `app/modules/`
   - implementasi page/resource yang lebih besar
4. `app/components/`
   - shared UI primitives dan reusable shells
5. `app/composables/`
   - shared app logic seperti API, auth, banner, locale
6. `app/layouts/`
   - app shell utama, termasuk sidebar dan top bar
7. `app/middleware/`
   - auth guard global
8. `app/types/`
   - tipe shared untuk API dan page modules
9. `app/utils/`
   - helper presentasional dan UI localization
10. `server/`
   - Nitro proxy layer

Saat ini `server/` secara efektif hanya dipakai untuk proxy backend:

- `server/api/proxy/[...path].ts`

## Runtime Highlights

- Nuxt config memakai `components: [{ path: '~/components', pathPrefix: false }]`
- alias `~` mengarah ke root `app/`
- global CSS masuk lewat `~/assets/css/main.css`
- color mode dikelola oleh `@nuxtjs/color-mode`
- runtime config public saat ini memuat `appName`
- backend access dari app code selalu lewat proxy `/api/proxy/...`

## Auth Route Map

Public auth routes yang aktif sekarang:

- `/login`
- `/register`
- `/auth/check-email`
- `/auth/email-verification`
- `/auth/forgot-password`
- `/auth/reset-password`

Kontrak payload auth publik yang tenant-aware:

- `/login` mengirim `email`, `password`, `tenant_code`
- `/register` mengirim `tenant_code` sebagai kode tenant baru
- `/auth/check-email` menyimpan `email` dan `tenant_code` di query agar resend verification tetap punya konteks tenant
- `/auth/forgot-password` dan resend verification mengirim `email` + `tenant_code`

File route wrapper aktif:

- `app/pages/login.vue`
- `app/pages/register.vue`
- `app/pages/auth/check-email.vue`
- `app/pages/auth/email-verification.vue`
- `app/pages/auth/forgot-password.vue`
- `app/pages/auth/reset-password.vue`

Module auth aktif:

- `app/modules/auth/login-page.vue`
- `app/modules/auth/register-page.vue`
- `app/modules/auth/check-email-page.vue`
- `app/modules/auth/email-verification-page.vue`
- `app/modules/auth/forgot-password-page.vue`
- `app/modules/auth/reset-password-page.vue`

Auth middleware saat ini menjaga allowlist public route di `app/middleware/auth.global.ts`. Bila menambah auth page public baru, file ini wajib ikut diupdate.

## Dashboard Pattern

Dashboard home route saat ini memakai:

- route wrapper: `app/pages/index.vue`
- module page: `app/modules/dashboard/index-page.vue`

Dokumen lama yang masih menyebut `dashboard-page.vue` sudah tidak akurat.

## Resource Route Patterns

Frontend sekarang memakai beberapa pola resource yang hidup berdampingan.

### 1. Thin wrapper ke module page

Contoh:

- `app/pages/resources/attendance-logs.vue` -> `app/modules/resources/attendance-logs/attendance-logs-page.vue`
- `app/pages/resources/employees.vue` -> `app/modules/resources/employees/employees-page.vue`
- `app/pages/resources/work-shifts.vue` -> `app/modules/resources/work-shifts/work-shifts-page.vue`

### 2. Thin wrapper dengan optional route param di file yang sama

Dipakai saat satu module menangani list/manage flow sendiri melalui route seperti `:id?`.

Contoh:

- `app/pages/resources/users.vue` -> path `/resources/users/:id?`
- `app/pages/resources/roles.vue` -> path `/resources/roles/:id?`
- `app/pages/resources/categories.vue` -> path `/resources/categories/:id?`
- `app/pages/resources/teachers.vue` -> path `/resources/teachers/:id?`
- `app/pages/resources/programs.vue` -> path `/resources/programs/:id?`
- `app/pages/resources/enrollments.vue` -> path `/resources/enrollments/:id?`
- `app/pages/resources/invoices.vue` -> path `/resources/invoices/:id?`
- `app/pages/resources/permissions.vue` -> path `/resources/permissions/:id?`

Catatan:

- route `permissions` saat ini hanya redirect ke `/resources/roles`

### 3. Dedicated detail/manage page

Dipakai saat detail page memang berdiri sendiri.

Contoh:

- `app/pages/resources/companies/[id].vue` -> `app/modules/resources/companies/companies-manage-page.vue`
- `app/pages/resources/org-units/[id].vue` -> `app/modules/resources/org-units/org-unit-detail-page.vue`
- `app/pages/resources/students/[id].vue` -> `app/modules/resources/students/student-detail-page.vue`

## Current Resource Modules

Module resource yang aktif di repo saat ini:

- attendance logs
- branches
- categories
- companies
- employees
- enrollments
- invoices
- job positions
- org units
- permissions
- programs
- roles
- students
- teachers
- users
- work locations
- work shifts

Catatan penting:

- `branches` module ada di `app/modules/resources/branches/branches-page.vue`
- sampai saat ini belum ada file route `app/pages/resources/branches.vue`, jadi module itu belum terekspos sebagai route normal

## App Shell Notes

Default app shell ada di `app/layouts/default.vue`.

Shell ini saat ini menangani:

- page title dan document title
- sidebar navigation desktop
- mobile navigation drawer
- theme toggle
- locale switcher
- global banner rendering

Sidebar yang aktif sekarang hanya mengekspos subset resource inti:

- dashboard
- companies
- employees
- attendance logs
- job positions
- work locations
- work shifts
- roles

Route resource `users` masih ada untuk kebutuhan internal/admin flow, tetapi sengaja tidak ditampilkan di navigasi utama. Arah produk yang aktif adalah memakai istilah domain seperti employee, company, dan access/roles dibanding menu generik user.

Jadi, tidak semua page/resource yang ada di repo otomatis muncul di navigasi utama.

## Reusable Components

Shared components yang jadi fondasi UI sekarang:

- `ResourceList`
- `ResourceTable`
- `FormDialogShell`
- `SearchableSelect`
- `SearchableTreeSelect`
- `LocationMapPicker`
- primitive `ui/*` seperti `Button`, `Input`, `Card`, `Badge`, `Table`

`ResourceList` dan `ResourceTable` saat ini adalah shared shell paling penting untuk banyak CRUD-style resource.

## Data Flow

Alur data frontend saat ini:

1. page/module memanggil `useApi().apiFetch(...)`
2. `useApi` menambahkan auth header dan `Accept-Language`
3. request dikirim ke `/api/proxy/...`
4. Nitro proxy meneruskan request ke backend `runtimeConfig.apiBase`
5. response backend dipakai langsung oleh page/module

Untuk resource pages, pola fetch yang dominan saat ini adalah client-side fetch non-blocking, sering dikombinasikan dengan penyimpanan last successful result agar konten lama tetap tampil saat refresh.
