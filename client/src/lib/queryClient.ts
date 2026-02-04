import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { logger } from "./logger";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function throwIfResNotOk(res: Response, info?: { method: string; url: string }) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    logger.error("API response not OK", {
      method: info?.method,
      url: info?.url,
      status: res.status,
      body: text,
    });
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (data !== undefined && data !== null) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fullUrl = `${API_BASE_URL}${url}`;
  logger.debug("apiRequest", { method, url: fullUrl, body: data });

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data !== undefined && data !== null ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res, { method, url: fullUrl });
  return res;
}

/** Backend returns { access_token, token_type }. Use this after login/register. */
export function getTokenFromAuthResponse(data: { access_token?: string; token?: string }): string | null {
  return data.access_token ?? data.token ?? null;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const path =
      Array.isArray(queryKey) && typeof queryKey[0] === "string" && queryKey[0].startsWith("/")
        ? queryKey[0]
        : "/" + (Array.isArray(queryKey) ? queryKey.join("/") : String(queryKey));
    const fullUrl = `${API_BASE_URL}${path}`;

    logger.debug("queryFn request", { url: fullUrl });

    const res = await fetch(fullUrl, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res, { method: "GET", url: fullUrl });
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
