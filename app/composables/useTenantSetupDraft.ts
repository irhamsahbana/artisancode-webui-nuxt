export type PendingTenantSetupDraft =
  | {
    kind: 'email'
    name: string
    username: string
    email: string
    password: string
    language: 'id' | 'en'
  }
  | {
    kind: 'google'
    registrationToken: string
    email: string
    displayName: string
  }

export const useTenantSetupDraft = () => {
  const draft = useState<PendingTenantSetupDraft | null>('pending-tenant-setup-draft', () => null)

  const setDraft = (value: PendingTenantSetupDraft) => {
    draft.value = value
  }

  const clearDraft = () => {
    draft.value = null
  }

  return {
    draft,
    setDraft,
    clearDraft,
  }
}
