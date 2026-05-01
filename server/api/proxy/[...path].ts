import {
  defineEventHandler,
  deleteCookie,
  getCookie,
  getMethod,
  getQuery,
  getRequestHeaders,
  readBody,
  setCookie,
  setResponseStatus,
} from "h3";

const refreshCookieAgeSeconds = 60 * 60 * 24 * 7;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const getSessionCookieName = (path: string) => {
  if (path.startsWith("internal-users/")) {
    return "sb_internal_refresh_token";
  }

  if (path.startsWith("users/")) {
    return "sb_refresh_token";
  }

  return null;
};

const isRefreshPath = (path: string) =>
  path === "users/refresh-token" || path === "internal-users/refresh-token";

const isLogoutPath = (path: string) =>
  path === "users/logout" || path === "internal-users/logout";

const withRefreshTokenBody = (body: unknown, refreshToken: string) => {
  if (isRecord(body)) {
    return {
      ...body,
      refresh_token: refreshToken,
    };
  }

  return {
    refresh_token: refreshToken,
  };
};

const stripRefreshToken = (payload: unknown) => {
  if (!isRecord(payload)) {
    return payload;
  }

  const data = payload.data;
  if (!isRecord(data) || typeof data.refresh_token !== "string") {
    return payload;
  }

  const sanitizedData = { ...data };
  delete sanitizedData.refresh_token;

  return {
    ...payload,
    data: sanitizedData,
  };
};

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const method = getMethod(event);
  const query = getQuery(event);
  const initialBody =
    method === "GET" || method === "HEAD" ? undefined : await readBody(event);
  const rawHeaders = getRequestHeaders(event);
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawHeaders)) {
    if (typeof value === "string") {
      headers[key] = value;
    }
  }
  delete headers["content-length"];
  const param = event.context.params?.path;
  const path = Array.isArray(param) ? param.join("/") : (param ?? "");
  const base = config.apiBase.endsWith("/")
    ? config.apiBase.slice(0, -1)
    : config.apiBase;
  const url = `${base}/${path}`;
  const locale = String(rawHeaders["accept-language"] ?? "")
    .toLowerCase()
    .startsWith("en")
    ? "en"
    : "id";
  const refreshCookieName = getSessionCookieName(path);
  const refreshToken = refreshCookieName
    ? (getCookie(event, refreshCookieName) ?? "")
    : "";
  const body =
    isRefreshPath(path) || isLogoutPath(path)
      ? withRefreshTokenBody(initialBody, refreshToken)
      : initialBody;

  try {
    const response = await $fetch.raw(url, {
      method,
      query,
      body,
      headers,
      ignoreResponseError: true,
    });

    if (
      refreshCookieName &&
      isRecord(response._data) &&
      isRecord(response._data.data)
    ) {
      const nextRefreshToken = response._data.data.refresh_token;
      if (typeof nextRefreshToken === "string" && nextRefreshToken.length > 0) {
        setCookie(event, refreshCookieName, nextRefreshToken, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: refreshCookieAgeSeconds,
          path: "/",
        });
      }
    }

    if (
      refreshCookieName &&
      isLogoutPath(path) &&
      response.status >= 200 &&
      response.status < 300
    ) {
      deleteCookie(event, refreshCookieName, { path: "/" });
    }

    if (refreshCookieName && isRefreshPath(path) && response.status === 401) {
      deleteCookie(event, refreshCookieName, { path: "/" });
    }

    setResponseStatus(event, response.status);
    return stripRefreshToken(response._data);
  } catch (error: unknown) {
    // Walk the cause chain to detect ECONNREFUSED
    // ofetch wraps the original TypeError in a FetchError
    let isConnectionError = false;
    let cause: unknown = error;
    while (cause) {
      const err = cause as NodeJS.ErrnoException;
      if (err?.code === "ECONNREFUSED") {
        isConnectionError = true;
        break;
      }
      cause = err?.cause;
    }

    const status = isConnectionError ? 502 : 500;
    const message = isConnectionError
      ? locale === "en"
        ? "Data could not be loaded. Please try again later."
        : "Data belum bisa dimuat. Silakan coba lagi nanti."
      : locale === "en"
        ? "Something went wrong while loading data. Please try again."
        : "Terjadi gangguan saat memuat data. Silakan coba lagi.";

    // Use console.warn so Nitro doesn't show it as a loud ERROR
    console.warn(
      `[proxy] ${method} ${url} failed:`,
      isConnectionError
        ? "ECONNREFUSED"
        : error instanceof Error
          ? error.message
          : error
    );

    setResponseStatus(event, status);
    return {
      success: false,
      message,
      data: null,
      errors: null,
    };
  }
});
