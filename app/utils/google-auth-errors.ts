import type { ApiResponse } from '~/types/api'

export type GoogleAuthErrorKey =
  | 'auth.googleAccountNotConnected'
  | 'auth.googleEmailAmbiguous'
  | 'auth.googleEmailAlreadyRegistered'
  | 'auth.googleIdentityAlreadyLinked'
  | 'auth.googleTokenInvalid'
  | 'auth.googleRegistrationSessionInvalid'
  | 'auth.tenantCodeInvalid'
  | 'auth.tenantCodeReserved'
  | 'auth.tenantCodeAlreadyUsed'
  | 'auth.tenantSetupConfirmationRequired'

const googleAuthErrorKeys: Record<string, GoogleAuthErrorKey> = {
  google_account_not_connected: 'auth.googleAccountNotConnected',
  google_email_ambiguous: 'auth.googleEmailAmbiguous',
  google_email_already_registered: 'auth.googleEmailAlreadyRegistered',
  google_identity_already_linked: 'auth.googleIdentityAlreadyLinked',
  google_token_invalid: 'auth.googleTokenInvalid',
  google_id_token_invalid: 'auth.googleTokenInvalid',
  invalid_google_token: 'auth.googleTokenInvalid',
  google_registration_session_invalid: 'auth.googleRegistrationSessionInvalid',
  tenant_code_invalid: 'auth.tenantCodeInvalid',
  tenant_code_reserved: 'auth.tenantCodeReserved',
  tenant_code_already_used: 'auth.tenantCodeAlreadyUsed',
  tenant_setup_confirmation_required: 'auth.tenantSetupConfirmationRequired',
}

const readObjectCode = (value: unknown): string | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>
  const code = record.code ?? record.error_code
  return typeof code === 'string' && code.length > 0 ? code : null
}

export const extractGoogleAuthErrorCode = (response: ApiResponse<unknown>) =>
  response.code
  ?? readObjectCode(response.errors)
  ?? readObjectCode(response.data)
  ?? null

export const resolveGoogleAuthErrorKey = (response: ApiResponse<unknown>) => {
  const code = extractGoogleAuthErrorCode(response)
  return code ? googleAuthErrorKeys[code] ?? null : null
}
