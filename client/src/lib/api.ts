/**
 * Central API path constants and helpers. Single source of truth for backend sync.
 */
const API_PREFIX = "/api";

export const API = {
    auth: {
        login: `${API_PREFIX}/auth/login`,
        register: `${API_PREFIX}/auth/register`,
        googleLogin: `${API_PREFIX}/auth/google-login`,
        otpSend: `${API_PREFIX}/auth/otp/send`,
        otpVerify: `${API_PREFIX}/auth/otp/verify`,
        me: `${API_PREFIX}/auth/me`,
        updateMe: `${API_PREFIX}/auth/me`,
    },
    articles: {
        list: `${API_PREFIX}/articles/`,
        create: `${API_PREFIX}/articles/`,
        get: (slug: string) => `${API_PREFIX}/articles/${slug}`,
        update: (slug: string) => `${API_PREFIX}/articles/${slug}`,
        patch: (slug: string) => `${API_PREFIX}/articles/${slug}`,
        delete: (slug: string) => `${API_PREFIX}/articles/${slug}`,
        publish: (slug: string) => `${API_PREFIX}/articles/${slug}/publish`,
        unpublish: (slug: string) => `${API_PREFIX}/articles/${slug}/unpublish`,
        related: (slug: string) => `${API_PREFIX}/articles/${slug}/related`,
        crosspost: (slug: string) => `${API_PREFIX}/articles/${slug}/crosspost`,
    },
    ai: {
        tldr: `${API_PREFIX}/ai/tldr`,
        explain: `${API_PREFIX}/ai/explain`,
        improve: `${API_PREFIX}/ai/improve`,
        seo: `${API_PREFIX}/ai/seo`,
        diagram: `${API_PREFIX}/ai/diagram`,
        usage: `${API_PREFIX}/ai/usage`,
    },
    billing: {
        subscribe: `${API_PREFIX}/billing/subscribe`,
        cancel: `${API_PREFIX}/billing/cancel`,
        resume: `${API_PREFIX}/billing/resume`,
        upgrade: `${API_PREFIX}/billing/upgrade`,
        portal: `${API_PREFIX}/billing/portal`,
        status: `${API_PREFIX}/billing/status`,
    },
    analytics: {
        articleStats: (id: number) => `${API_PREFIX}/analytics/article/${id}`,
        codeCopy: `${API_PREFIX}/analytics/code-copy`,
        creatorDashboard: `${API_PREFIX}/analytics/creator/dashboard`,
        platform: `${API_PREFIX}/analytics/platform`,
        readingProgress: `${API_PREFIX}/analytics/reading-progress`,
        recommendations: `${API_PREFIX}/analytics/recommendations`,
        trending: `${API_PREFIX}/analytics/trending`,
    },
} as const;
