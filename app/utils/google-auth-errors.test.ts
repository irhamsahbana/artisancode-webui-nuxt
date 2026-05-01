import assert from 'node:assert/strict'
import test from 'node:test'

const {
  extractGoogleAuthErrorCode,
  resolveGoogleAuthErrorKey,
} = await import(new URL('./google-auth-errors.ts', import.meta.url).href)

test('resolves top-level Google auth error codes to locale keys', () => {
  assert.equal(resolveGoogleAuthErrorKey({
    success: false,
    message: '',
    data: null,
    errors: null,
    code: 'google_email_ambiguous',
  }), 'auth.googleEmailAmbiguous')
})

test('maps google account not connected error for continuation flows', () => {
  assert.equal(resolveGoogleAuthErrorKey({
    success: false,
    message: '',
    data: null,
    errors: null,
    code: 'google_account_not_connected',
  }), 'auth.googleAccountNotConnected')
})

test('extracts nested Google auth error codes from API errors', () => {
  assert.equal(extractGoogleAuthErrorCode({
    success: false,
    message: '',
    data: null,
    errors: { error_code: 'tenant_code_reserved' },
  }), 'tenant_code_reserved')
})

test('maps invalid Google token variants to the same locale key', () => {
  assert.equal(resolveGoogleAuthErrorKey({
    success: false,
    message: '',
    data: { code: 'google_id_token_invalid' },
    errors: null,
  }), 'auth.googleTokenInvalid')
})

test('returns null for unknown Google auth error codes', () => {
  assert.equal(resolveGoogleAuthErrorKey({
    success: false,
    message: '',
    data: null,
    errors: { code: 'unknown_code' },
  }), null)
})
