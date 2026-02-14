import {useCallback, useEffect, useState} from "react";
import {apiRequest} from "@/lib/queryClient";
import {API} from "@/lib/api";

const TOKEN_KEY = "token";
const USER_KEY = "user";

export type AuthUser = {
    id: number;
    username: string;
    full_name: string | null;
    email: string | null;
    role: string;
};

function getStoredToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
}

function getStoredUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as AuthUser;
    } catch {
        return null;
    }
}

function setStoredUser(user: AuthUser | null) {
    if (typeof window === "undefined") return;
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
}

export function useAuth() {
    const [token, setToken] = useState<string | null>(getStoredToken);
    const [user, setUser] = useState<AuthUser | null>(getStoredUser);

    const fetchMe = useCallback(async () => {
        const t = getStoredToken();
        if (!t) return null;
        try {
            const res = await apiRequest("GET", API.auth.me);
            const data = await res.json();
            const u: AuthUser = {
                id: data.id,
                username: data.username,
                full_name: data.full_name ?? null,
                email: data.email ?? null,
                role: data.role ?? "reader",
            };
            setStoredUser(u);
            setUser(u);
            return u;
        } catch {
            return null;
        }
    }, []);

    useEffect(() => {
        const t = getStoredToken();
        setToken(t);
        if (t && !getStoredUser()) {
            fetchMe();
        } else {
            setUser(getStoredUser());
        }
    }, [fetchMe]);

    useEffect(() => {
        const onStorage = () => {
            setToken(getStoredToken());
            setUser(getStoredUser());
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    return {
        token,
        user,
        isAuthenticated: Boolean(token),
        refetchUser: fetchMe,
    };
}
