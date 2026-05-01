import { navigateTo, useCookie } from "#app";

import type { ApiResponse } from "~/types/api";
import { useApi } from "./useApi";

type LoginPayload = {
  email: string;
  password: string;
  tenant_code: string;
};

type RegisterPayload = {
  name: string;
  username: string;
  email: string;
  password: string;
  tenant_code?: string;
  tenant_name?: string;
  language: "id" | "en";
};

type GoogleLoginPayload = {
  id_token: string;
};

type GoogleRegisterInitResponse = {
  registration_token: string;
  email: string;
  display_name: string;
  picture_url?: string | null;
};

type GoogleRegisterPayload = {
  id_token?: string;
  registration_token?: string;
  tenant_name: string;
  tenant_code: string;
  confirm_tenant_setup: true;
  language: "id" | "en";
};

type AuthTokenResponse = {
  access_token: string;
  tenant_code?: string;
};

type RegisterResponse = {
  email: string;
  verification_required: boolean;
  access_token?: string;
  tenant_code?: string;
};

type TenantScopedEmailPayload = {
  email: string;
  tenant_code: string;
};

type EmptyResponse = Record<string, never>;

export const useAuth = () => {
  const token = useCookie<string | null>("sb_token");
  const { apiFetch } = useApi();
  const localePath = useLocalePath();

  // Extract user from JWT token
  const user = computed(() => {
    if (!token.value) return null;
    try {
      const payload = token.value.split(".")[1];
      const decoded = JSON.parse(atob(payload || ""));
      return {
        id: decoded.user_id,
        tenant_id: decoded.tenant_id,
        tenant_name: decoded.tenant_name,
        username: decoded.user_name,
        roles: decoded.roles,
        name: decoded.user_name, // fallback for UI
      };
    } catch {
      return null;
    }
  });

  const login = async (payload: LoginPayload) => {
    const response = await apiFetch<AuthTokenResponse>("/users/login", {
      method: "POST",
      body: payload,
    });

    if (response.success && response.data) {
      token.value = response.data.access_token;
    }

    return response as ApiResponse<AuthTokenResponse>;
  };

  const register = async (payload: RegisterPayload) => {
    const response = await apiFetch<RegisterResponse>("/users/register", {
      method: "POST",
      body: payload,
    });

    if (response.success && response.data?.access_token) {
      token.value = response.data.access_token;
    }

    return response as ApiResponse<RegisterResponse>;
  };

  const googleLogin = async (payload: GoogleLoginPayload) => {
    const response = await apiFetch<AuthTokenResponse>("/users/google/login", {
      method: "POST",
      body: payload,
    });

    if (response.success && response.data) {
      token.value = response.data.access_token;
    }

    return response as ApiResponse<AuthTokenResponse>;
  };

  const googleRegisterInit = async (payload: GoogleLoginPayload) => {
    const response = await apiFetch<GoogleRegisterInitResponse>(
      "/users/google/register/init",
      {
        method: "POST",
        body: payload,
      }
    );

    return response as ApiResponse<GoogleRegisterInitResponse>;
  };

  const googleRegister = async (payload: GoogleRegisterPayload) => {
    const response = await apiFetch<AuthTokenResponse>(
      "/users/google/register",
      {
        method: "POST",
        body: payload,
      }
    );

    if (response.success && response.data) {
      token.value = response.data.access_token;
    }

    return response as ApiResponse<AuthTokenResponse>;
  };

  const verifyEmail = async (tokenValue: string) => {
    return apiFetch<EmptyResponse>("/users/verify-email", {
      method: "POST",
      body: { token: tokenValue },
    }) as Promise<ApiResponse<EmptyResponse>>;
  };

  const resendVerificationEmail = async (payload: TenantScopedEmailPayload) => {
    return apiFetch<EmptyResponse>("/users/resend-verification-email", {
      method: "POST",
      body: payload,
    }) as Promise<ApiResponse<EmptyResponse>>;
  };

  const forgotPassword = async (payload: TenantScopedEmailPayload) => {
    return apiFetch<EmptyResponse>("/users/forgot-password", {
      method: "POST",
      body: payload,
    }) as Promise<ApiResponse<EmptyResponse>>;
  };

  const resetPassword = async (tokenValue: string, password: string) => {
    return apiFetch<EmptyResponse>("/users/reset-password", {
      method: "POST",
      body: { token: tokenValue, password },
    }) as Promise<ApiResponse<EmptyResponse>>;
  };

  const logout = async () => {
    await apiFetch<EmptyResponse>("/users/logout", {
      method: "POST",
      authMode: "none",
    });
    token.value = null;
    await navigateTo(localePath("/login"));
  };

  return {
    token,
    user,
    login,
    register,
    googleLogin,
    googleRegisterInit,
    googleRegister,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    logout,
  };
};
