import {useEffect, useRef, useState} from "react";
import {Link, useParams} from "wouter";
import {Footer, Navbar} from "@/components/layout";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";
import {Skeleton} from "@/components/ui/skeleton";
import {Bookmark, Calendar, Clock, HelpCircle, Share2, Sparkles} from "lucide-react";
import {API_BASE_URL, apiRequest} from "@/lib/queryClient";
import {API} from "@/lib/api";
import {useToast} from "@/hooks/use-toast";
import {logger} from "@/lib/logger";
import {Input} from "@/components/ui/input";
import {MarkdownRenderer} from "@/components/MarkdownRenderer";

type ArticleData = {
    id: number;
    slug: string;
    title: string;
    subtitle?: string;
    content: string;
    cover_image_url?: string;
    author_id: number;
    tags: string[];
    reading_time_minutes?: number;
    view_count: number;
    status: string;
    published_at: string | null;
    created_at: string;
    updated_at: string;
};

export default function ArticlePage() {
    const params = useParams<{ slug: string }>();
    const slug = params?.slug;
    const {toast} = useToast();
    const [article, setArticle] = useState<ArticleData | null>(null);
    const [tldr, setTldr] = useState<string | null>(null);
    const [loadingTldr, setLoadingTldr] = useState(false);
    const [concept, setConcept] = useState("");
    const [explanation, setExplanation] = useState<string | null>(null);
    const [loadingExplain, setLoadingExplain] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const articleBodyRef = useRef<HTMLElement>(null);
    const readStartRef = useRef<number>(Date.now());
    const maxScrollRef = useRef<number>(0);

    useEffect(() => {
        if (!slug) return;
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const url = `${API_BASE_URL}${API.articles.get(slug)}`;
        logger.info("Fetching article", {slug, url});
        fetch(url, {headers, credentials: "include"})
            .then((res) => {
                if (!res.ok) throw new Error(res.status === 404 ? "Article not found" : `${res.status}`);
                return res.json();
            })
            .then(setArticle)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [slug]);

    useEffect(() => {
        if (!article?.id) return;
        const handleCopy = (e: ClipboardEvent) => {
            const target = e.target as Node;
            if (articleBodyRef.current?.contains(target) && (target as Element).closest?.("pre, code")) {
                apiRequest("POST", API.analytics.codeCopy + `?article_id=${article.id}`).catch(() => {
                });
            }
        };
        document.addEventListener("copy", handleCopy);
        return () => document.removeEventListener("copy", handleCopy);
    }, [article?.id]);

    useEffect(() => {
        if (!article?.id) return;
        const interval = setInterval(() => {
            const scrollPct = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            if (scrollPct > maxScrollRef.current) maxScrollRef.current = scrollPct;
        }, 2000);
        return () => clearInterval(interval);
    }, [article?.id]);

    useEffect(() => {
        if (!article?.id) return;
        const sendProgress = () => {
            const timeSpent = Math.round((Date.now() - readStartRef.current) / 1000);
            const scrollPct = maxScrollRef.current;
            const token = localStorage.getItem("token");
            if (token && scrollPct >= 0)
                apiRequest("POST", API.analytics.readingProgress + `?article_id=${article.id}&scroll_percentage=${scrollPct}&time_spent=${timeSpent}`).catch(() => {
                });
        };
        const onVisibilityChange = () => {
            if (document.visibilityState === "hidden") sendProgress();
        };
        document.addEventListener("visibilitychange", onVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", onVisibilityChange);
            if (document.visibilityState === "hidden") sendProgress();
        };
    }, [article?.id]);

    const handleCodeCopy = () => {
        if (article?.id) apiRequest("POST", API.analytics.codeCopy + `?article_id=${article.id}`).catch(() => {
        });
    };

    const handleShare = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: article?.title,
                    text: article?.subtitle || undefined,
                    url,
                });
                toast({title: "Shared", description: "Thanks for sharing!"});
            } else {
                await navigator.clipboard.writeText(url);
                toast({title: "Link copied", description: "Share link copied to clipboard."});
            }
        } catch (err) {
            if ((err as Error).name !== "AbortError") {
                await navigator.clipboard.writeText(url).catch(() => {
                });
                toast({title: "Link copied", description: "Share link copied to clipboard."});
            }
        }
    };

    const BOOKMARKS_KEY = "devlog-bookmarks";
    type BookmarkEntry = { id: number; slug: string; title: string };
    const [bookmarked, setBookmarked] = useState(false);
    useEffect(() => {
        if (!article?.id) return;
        const raw = localStorage.getItem(BOOKMARKS_KEY) || "[]";
        try {
            const list = JSON.parse(raw);
            const ids = Array.isArray(list) ? list.map((x: BookmarkEntry | number) => (typeof x === "object" && x?.id ? x.id : x)) : [];
            setBookmarked(ids.includes(article.id));
        } catch {
            setBookmarked(false);
        }
    }, [article?.id]);
    const handleBookmark = () => {
        if (!article?.id || !article?.slug || !article?.title) return;
        const raw = localStorage.getItem(BOOKMARKS_KEY) || "[]";
        let list: (BookmarkEntry | number)[] = [];
        try {
            list = JSON.parse(raw);
            if (!Array.isArray(list)) list = [];
        } catch {
            list = [];
        }
        const entry: BookmarkEntry = {id: article.id, slug: article.slug, title: article.title};
        const has = list.some((x) => (typeof x === "object" && x?.id === article.id) || x === article.id);
        const next = has ? list.filter((x) => (typeof x === "object" ? x.id !== article.id : x !== article.id)) : [...list, entry];
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
        setBookmarked(!has);
        toast({
            title: !has ? "Bookmarked" : "Bookmark removed",
            description: !has ? "Saved to your bookmarks." : undefined,
        });
    };

    const parseTldr = (raw: string): string => {
        if (!raw?.trim()) return "";
        const s = raw.trim();
        if (s.startsWith("{")) {
            try {
                const o = JSON.parse(s);
                if (typeof o.summary === "string") return o.summary;
                if (typeof o.tldr === "string") return o.tldr;
            } catch {
                return s;
            }
        }
        return s;
    };

    const fetchTldr = async () => {
        if (!slug || !article) return;
        setLoadingTldr(true);
        try {
            const res = await apiRequest("POST", API.ai.tldr, {article_slug: slug});
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                const detail = errData.detail || res.statusText;
                if (res.status === 403) {
                    toast({
                        title: "Authentication required",
                        description: "Please sign in with a Creator account to use AI TL;DR.",
                        variant: "destructive",
                    });
                    return;
                }
                if (res.status === 503) {
                    toast({
                        title: "AI service unavailable",
                        description: detail || "AI rate limit exceeded. Please try again in a few minutes.",
                        variant: "destructive",
                    });
                    return;
                }
                throw new Error(detail);
            }
            const data = await res.json();
            const tldrText = parseTldr(data.tldr || "");
            if (!tldrText) {
                toast({
                    title: "TL;DR unavailable",
                    description: "AI service returned empty response. Please try again.",
                    variant: "destructive",
                });
                return;
            }
            setTldr(tldrText);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to generate TL;DR";
            toast({
                title: "TL;DR unavailable",
                description: msg.includes("rate limit") || msg.includes("503") ? "AI rate limit exceeded. Please try again in a few minutes." : msg,
                variant: "destructive",
            });
        } finally {
            setLoadingTldr(false);
        }
    };

    const fetchExplainConcept = async () => {
        if (!slug || !concept.trim()) return;
        setLoadingExplain(true);
        setExplanation(null);
        try {
            const res = await apiRequest("POST", API.ai.explain, {article_slug: slug, concept: concept.trim()});
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                const detail = err.detail || res.statusText;
                if (res.status === 400) {
                    toast({
                        title: "Invalid request",
                        description: detail || "Please provide a valid concept to explain.",
                        variant: "destructive"
                    });
                    setLoadingExplain(false);
                    return;
                }
                if (res.status === 403) {
                    toast({
                        title: "Authentication required",
                        description: "Please sign in with a Creator account to use AI Explain.",
                        variant: "destructive"
                    });
                    setLoadingExplain(false);
                    return;
                }
                if (res.status === 503) {
                    toast({
                        title: "AI service unavailable",
                        description: detail || "AI rate limit exceeded. Please try again in a few minutes.",
                        variant: "destructive"
                    });
                    setLoadingExplain(false);
                    return;
                }
                if (res.status === 500) {
                    toast({
                        title: "Explanation failed",
                        description: detail || "Failed to generate explanation. Please try again.",
                        variant: "destructive"
                    });
                    setLoadingExplain(false);
                    return;
                }
                throw new Error(detail);
            }
            const data = await res.json();
            const raw = data.explanation || "";
            const text = raw.trim().startsWith("{") ? (() => {
                try {
                    const o = JSON.parse(raw);
                    return o.explanation || raw;
                } catch {
                    return raw;
                }
            })() : raw;
            if (!text || text.includes("Unable to generate explanation")) {
                setExplanation(text || `Unable to explain '${concept}' from this article. The concept may not be clearly explained here. Consider searching online resources or asking a more specific question.`);
            } else {
                setExplanation(text);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to explain concept";
            setExplanation(`Unable to explain '${concept}' from this article. The concept may not be clearly explained here. Consider searching online resources or asking a more specific question.`);
            toast({
                title: "Explanation unavailable",
                description: msg.includes("rate limit") || msg.includes("503") ? "AI rate limit exceeded. Please try again in a few minutes." : "Using fallback explanation.",
                variant: "default",
            });
        } finally {
            setLoadingExplain(false);
        }
    };

    if (!slug) return null;
    if (error) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar/>
                <main className="container mx-auto px-4 py-12 max-w-4xl">
                    <p className="text-destructive">{error}</p>
                    <Link href="/blog">
                        <Button variant="outline" className="mt-4">Back to articles</Button>
                    </Link>
                </main>
                <Footer/>
            </div>
        );
    }

    if (loading || !article) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar/>
                <main className="container mx-auto px-4 py-12 max-w-4xl">
                    <Skeleton className="h-12 w-3/4 mb-6"/>
                    <Skeleton className="h-6 w-1/2 mb-12"/>
                    <Skeleton className="h-64 w-full"/>
                </main>
                <Footer/>
            </div>
        );
    }

    const publishedDate = article.published_at ? new Date(article.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    }) : null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar/>

            <main className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="mb-8">
                    {article.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {article.tags.slice(0, 5).map((t) => (
                                <Badge key={t} variant="outline" className="text-primary border-primary/30">
                                    {t}
                                </Badge>
                            ))}
                        </div>
                    )}
                    <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight mb-6">
                        {article.title}
                    </h1>
                    {article.subtitle && (
                        <p className="text-xl text-muted-foreground mb-6">{article.subtitle}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {publishedDate && (
                            <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3"/> {publishedDate}
              </span>
                        )}
                        {article.reading_time_minutes != null && (
                            <span className="flex items-center gap-1">
                <Clock className="h-3 w-3"/> {article.reading_time_minutes} min read
              </span>
                        )}
                        <span>{article.view_count} views</span>
                    </div>
                </div>

                {article.cover_image_url && (
                    <div className="rounded-xl overflow-hidden mb-12 border border-border/50 shadow-2xl">
                        <img
                            src={article.cover_image_url}
                            alt=""
                            className="aspect-[21/9] w-full object-cover"
                        />
                    </div>
                )}

                {article.status === "published" && (
                    <div
                        className="bg-secondary/20 border border-primary/20 rounded-lg p-6 mb-12 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 text-primary font-medium">
                <Sparkles className="h-4 w-4"/>
                AI TL;DR
              </span>
                            {!tldr && (
                                <Button variant="outline" size="sm" onClick={fetchTldr} disabled={loadingTldr}>
                                    {loadingTldr ? "Generating…" : "Generate TL;DR"}
                                </Button>
                            )}
                        </div>
                        {tldr ? (
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{tldr}</p>
                        ) : loadingTldr ? (
                            <p className="text-muted-foreground text-sm">Generating summary…</p>
                        ) : null}
                    </div>
                )}

                {article.status === "published" && (
                    <div className="bg-secondary/20 border border-primary/20 rounded-lg p-6 mb-12">
                        <div className="flex items-center gap-2 text-primary font-medium mb-3">
                            <HelpCircle className="h-4 w-4"/>
                            Explain a concept
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                            Ask the AI to explain a term or concept from this article.
                        </p>
                        <div className="flex gap-2 flex-wrap">
                            <Input
                                placeholder="e.g. API, cache, OAuth"
                                value={concept}
                                onChange={(e) => setConcept(e.target.value)}
                                className="max-w-xs bg-background/80"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchExplainConcept}
                                disabled={loadingExplain || !concept.trim()}
                            >
                                {loadingExplain ? "Explaining…" : "Explain"}
                            </Button>
                        </div>
                        {explanation && (
                            <div className="mt-4 p-4 rounded-lg bg-background/50 border border-border/50">
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{explanation}</p>
                            </div>
                        )}
                    </div>
                )}

                <article ref={articleBodyRef} className="prose prose-invert prose-lg max-w-none">
                    <MarkdownRenderer content={article.content} onCodeCopy={handleCodeCopy}/>
                </article>

                <Separator className="my-12"/>

                <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" title="Bookmark" onClick={handleBookmark}>
                        <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-primary text-primary" : ""}`}/>
                    </Button>
                    <Button variant="ghost" size="icon" title="Share" onClick={handleShare}>
                        <Share2 className="h-4 w-4"/>
                    </Button>
                </div>
            </main>

            <Footer/>
        </div>
    );
}
