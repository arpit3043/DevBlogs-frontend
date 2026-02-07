import { QueryClient } from "@tanstack/react-query";
import { logger } from "./logger";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

async function throwIfResNotOk(
  res: Response,
  info?: { method: string; url: string }
) {
  if (!res.ok) {
    let errorBody: any = null;

    try {
      errorBody = await res.json();
    } catch {
      errorBody = await res.text();
    }

    logger.error("API response not OK", {
      method: info?.method,
      url: info?.url,
      status: res.status,
      body: errorBody,
    });

    const message =
      typeof errorBody === "object" && errorBody?.error
        ? errorBody.error
        : res.statusText;

    throw new Error(`${res.status}: ${message}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Only set Content-Type when sending a body
  if (data !== undefined && method !== "GET") {
    headers["Content-Type"] = "application/json";
  }

  const fullUrl = `${API_BASE_URL}${url}`;

  logger.debug("apiRequest", {
    method,
    url: fullUrl,
    hasToken: !!token,
  });

  const res = await fetch(fullUrl, {
    method,
    headers,
    body:
      data !== undefined && method !== "GET"
        ? JSON.stringify(data)
        : undefined,
  });

  await throwIfResNotOk(res, { method, url: fullUrl });
  return res;
}

export function getTokenFromAuthResponse(data: {
  access_token?: string;
  token?: string;
}): string | null {
  return data.access_token ?? data.token ?? null;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
});
