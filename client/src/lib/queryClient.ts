import {QueryClient} from "@tanstack/react-query";
import {logger} from "./logger";

export const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8000";

function handleUnauthorized() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    const loginPath = "/login";
    if (typeof window !== "undefined" && window.location.pathname !== loginPath) {
        window.location.href = loginPath;
    }
}

async function throwIfResNotOk(
    res: Response,
    info?: { method: string; url: string }
) {
    if (res.status === 401) {
        handleUnauthorized();
        throw new Error("401: Unauthorized");
    }
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
        // Backend (FastAPI) returns { detail: "..." }; some APIs use { error: "..." }
        const message =
            typeof errorBody === "object" && (errorBody?.detail ?? errorBody?.error)
                ? (errorBody.detail ?? errorBody.error)
                : res.statusText;
        const err = new Error(message) as Error & { status?: number; body?: unknown };
        err.status = res.status;
        err.body = errorBody;
        throw err;
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

    await throwIfResNotOk(res, {method, url: fullUrl});
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
