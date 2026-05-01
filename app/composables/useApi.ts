import { navigateTo, useCookie, useState } from "#app";
import { $fetch } from "ofetch";
import type { ApiResponse } from "~/types/api";
import {
  getAuthLoginPath,
  getAuthLogoutPath,
  getAuthRefreshPath,
  isAuthenticatedMode,
  shouldAttemptTokenRefresh,
  type AuthMode,
} from "~/utils/auth-session";

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, unknown>;
  body?: BodyInit | Record<string, unknown> | null;
  signal?: AbortSignal | null;
  authMode?: AuthMode;
};

export const useApi = () => {
  const token = useCookie<string | null>("sb_token");
  const internalToken = useCookie<string | null>("sb_internal_token");
  const refreshUserRequest = useState<Promise<
    "success" | "expired" | "failed"
  > | null>("auth_refresh_user_request", () => null);
  const refreshInternalRequest = useState<Promise<
    "success" | "expired" | "failed"
  > | null>("auth_refresh_internal_request", () => null);
  const { show } = useBanner();
  const { locale, t } = useLocale();
  const localePath = useLocalePath();

  const isAbortedRequestError = (error: unknown) => {
    if (!(error instanceof Error)) {
      return false;
    }

    if (error.name === "AbortError") {
      return true;
    }

    const message = error.message.toLowerCase();
    if (
      message.includes("signal is aborted") ||
      message.includes("request was aborted") ||
      message.includes("aborted without reason")
    ) {
      return true;
    }

    const cause = "cause" in error ? error.cause : undefined;
    return cause instanceof Error && cause.name === "AbortError";
  };

  const apiFetch = async <T>(path: string, options: ApiFetchOptions = {}) => {
    const authMode = options.authMode ?? "user";
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    const clearSession = async (mode: Exclude<AuthMode, "none">) => {
      if (mode === "internal") {
        internalToken.value = null;
      } else {
        token.value = null;
        const user = useState<unknown | null>("auth_user", () => null);
        user.value = null;
      }

      show(t("api.sessionExpired"), "error");
      await navigateTo(localePath(getAuthLoginPath(mode)));
    };

    const runRequest = async () => {
      const headers: Record<string, string> = {
        "Accept-Language": locale.value,
      };

      if (isAuthenticatedMode(authMode)) {
        const activeToken =
          authMode === "internal" ? internalToken.value : token.value;
        if (activeToken) {
          headers.Authorization = `Bearer ${activeToken}`;
        }
      }

      return $fetch.raw<ApiResponse<T>>(`/api/proxy${normalizedPath}`, {
        method: options.method ?? "GET",
        query: options.query,
        body: options.body,
        headers,
        signal: options.signal ?? undefined,
        ignoreResponseError: true,
      });
    };

    const refreshSession = async (mode: Exclude<AuthMode, "none">) => {
      const refreshState =
        mode === "internal" ? refreshInternalRequest : refreshUserRequest;
      if (refreshState.value) {
        return refreshState.value;
      }

      refreshState.value = (async (): Promise<
        "success" | "expired" | "failed"
      > => {
        try {
          const response = await $fetch.raw<
            ApiResponse<{ access_token: string }>
          >(`/api/proxy${getAuthRefreshPath(mode)}`, {
            method: "POST",
            body: {},
            headers: {
              "Accept-Language": locale.value,
            },
            ignoreResponseError: true,
          });

          if (
            response.status >= 200 &&
            response.status < 300 &&
            response._data?.success &&
            response._data.data?.access_token
          ) {
            if (mode === "internal") {
              internalToken.value = response._data.data.access_token;
            } else {
              token.value = response._data.data.access_token;
            }

            return "success";
          }

          if (response.status === 400 || response.status === 401) {
            await clearSession(mode);
            return "expired";
          }

          return "failed";
        } catch (error) {
          if (!isAbortedRequestError(error)) {
            console.warn("[auth] refresh failed", error);
          }

          return "failed";
        }
      })().finally(() => {
        refreshState.value = null;
      });

      return refreshState.value;
    };

    try {
      let response = await runRequest();

      const activeToken =
        authMode === "internal"
          ? internalToken.value
          : authMode === "user"
            ? token.value
            : null;

      if (
        activeToken &&
        shouldAttemptTokenRefresh(response.status, authMode) &&
        isAuthenticatedMode(authMode) &&
        normalizedPath !== getAuthRefreshPath(authMode) &&
        normalizedPath !== getAuthLogoutPath(authMode)
      ) {
        const refreshResult = await refreshSession(authMode);
        if (refreshResult === "expired") {
          return {
            success: false,
            message: t("api.sessionExpired"),
            data: null,
            errors: null,
            meta: {
              status: 401,
              retryAfterSeconds: null,
            },
          };
        }

        if (refreshResult === "failed") {
          show(t("api.requestFailed"), "error");
          return {
            success: false,
            message: t("api.requestFailed"),
            data: null,
            errors: null,
            meta: {
              status: response.status,
              retryAfterSeconds: null,
            },
          };
        }

        response = await runRequest();
      }

      const data = response._data;
      const status = response.status;
      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfterSeconds = retryAfterHeader
        ? Number.parseInt(retryAfterHeader, 10)
        : null;
      const hasSuccessFlag = typeof data?.success === "boolean";
      const message = hasSuccessFlag
        ? data?.message
        : `${t("api.requestFailed")} (${status})`;

      if (
        shouldAttemptTokenRefresh(status, authMode) &&
        isAuthenticatedMode(authMode) &&
        normalizedPath === getAuthRefreshPath(authMode)
      ) {
        await clearSession(authMode);
        return {
          success: false,
          message: t("api.sessionExpired"),
          data: null,
          errors: data ?? null,
          meta: {
            status,
            retryAfterSeconds: Number.isFinite(retryAfterSeconds)
              ? retryAfterSeconds
              : null,
          },
        };
      }

      if (status >= 400 || (hasSuccessFlag && data?.success === false)) {
        if (
          !(
            shouldAttemptTokenRefresh(status, authMode) &&
            isAuthenticatedMode(authMode)
          )
        ) {
          show(message ?? t("api.requestFailed"), "error");
        }
      }

      if (hasSuccessFlag) {
        return {
          ...(data as ApiResponse<T>),
          meta: {
            ...(data as ApiResponse<T>).meta,
            status,
            retryAfterSeconds: Number.isFinite(retryAfterSeconds)
              ? retryAfterSeconds
              : null,
          },
        };
      }

      return {
        success: false,
        message: message ?? t("api.requestFailed"),
        data: null,
        errors: data ?? null,
        meta: {
          status,
          retryAfterSeconds: Number.isFinite(retryAfterSeconds)
            ? retryAfterSeconds
            : null,
        },
      };
    } catch (error) {
      if (isAbortedRequestError(error)) {
        return {
          success: false,
          message: "",
          data: null,
          errors: null,
          meta: {
            retryAfterSeconds: null,
          },
        };
      }

      const message =
        error instanceof Error ? error.message : t("api.networkError");
      show(message, "error");
      return {
        success: false,
        message,
        data: null,
        errors: error,
        meta: {
          retryAfterSeconds: null,
        },
      };
    }
  };

  return { apiFetch };
};
