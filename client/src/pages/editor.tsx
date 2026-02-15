import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Badge} from "@/components/ui/badge";
import {
    ArrowLeft,
    Bold,
    Code,
    GitBranch,
    Heading1,
    Heading2,
    Heading3,
    Image as ImageIcon,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Quote,
    Save,
    Search,
    Share2,
    Sparkles,
    Underline,
} from "lucide-react";
import {useCallback, useEffect, useRef, useState} from "react";
import {Link, useLocation} from "wouter";
import {useToast} from "@/hooks/use-toast";
import {apiRequest} from "@/lib/queryClient";
import {API} from "@/lib/api";
import {logger} from "@/lib/logger";
import {MarkdownRenderer} from "@/components/MarkdownRenderer";

export default function Editor() {
    const {toast} = useToast();
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState(`# Introduction\n\nWrite your technical deep dive here...`);

    // Initialize history on mount
    useEffect(() => {
        const initialContent = `# Introduction\n\nWrite your technical deep dive here...`;
        if (historyRef.current.length === 0) {
            historyRef.current = [initialContent];
            historyIndexRef.current = 0;
        }
    }, []);
    const [slug, setSlug] = useState("");
    const [articleStatus, setArticleStatus] = useState<"draft" | "published">("draft");
    const [isPublishing, setIsPublishing] = useState(false);
    const [isSeoLoading, setIsSeoLoading] = useState(false);
    const [seoResult, setSeoResult] = useState<{
        seo_topics?: string;
        meta_title?: string;
        meta_description?: string;
        keywords?: string[]
    } | null>(null);
    const [diagramTopic, setDiagramTopic] = useState("");
    const [isDiagramLoading, setIsDiagramLoading] = useState(false);
    const [crosspostDevto, setCrosspostDevto] = useState(false);
    const [crosspostMedium, setCrosspostMedium] = useState(false);
    const [isCrossposting, setIsCrossposting] = useState(false);
    const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
    const contentRef = useRef<HTMLTextAreaElement>(null);
    const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef<number>(-1);
    const lastSelectionRef = useRef({ start: 0, end: 0 });
    const [, setLocation] = useLocation();

    const getSelection = useCallback((): {
        start: number;
        end: number;
        text: string;
        before: string;
        after: string
    } => {
        const ta = contentRef.current;
        if (!ta) return {start: 0, end: 0, text: "", before: "", after: ""};
        // When user clicks a toolbar button, textarea loses focus and selection is lost. Use saved selection.
        const isFocused = typeof document !== "undefined" && document.activeElement === ta;
        const start = isFocused ? ta.selectionStart : lastSelectionRef.current.start;
        const end = isFocused ? ta.selectionEnd : lastSelectionRef.current.end;
        const text = content.slice(start, end);
        return {start, end, text, before: content.slice(0, start), after: content.slice(end)};
    }, [content]);

    const saveToHistory = useCallback((text: string) => {
        if (historyRef.current[historyIndexRef.current] === text) return;
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        historyRef.current.push(text);
        if (historyRef.current.length > 50) historyRef.current.shift();
        historyIndexRef.current = historyRef.current.length - 1;
    }, []);

    const applyMarkdown = useCallback((wrapBefore: string, wrapAfter: string = wrapBefore) => {
        const {start, end, text, before, after} = getSelection();
        const newContent = before + wrapBefore + text + wrapAfter + after;
        setContent(newContent);
        saveToHistory(newContent);
        setTimeout(() => {
            contentRef.current?.focus();
            const newPos = start + wrapBefore.length + text.length;
            contentRef.current?.setSelectionRange(newPos, newPos);
        }, 0);
    }, [getSelection, saveToHistory]);

    const insertAtLineStart = useCallback((prefix: string) => {
        const {start, before, after} = getSelection();
        const lineStart = before.lastIndexOf("\n") + 1;
        const newBefore = before.slice(0, lineStart) + prefix + before.slice(lineStart);
        const newContent = newBefore + after;
        setContent(newContent);
        saveToHistory(newContent);
        setTimeout(() => contentRef.current?.focus(), 0);
    }, [getSelection, saveToHistory]);

    const handleBold = () => applyMarkdown("**");
    const handleItalic = () => applyMarkdown("*");
    const handleUnderline = () => applyMarkdown("<u>", "</u>");
    const handleCode = () => applyMarkdown("`");
    const handleBlockquote = () => insertAtLineStart("> ");
    const handleH1 = () => insertAtLineStart("# ");
    const handleH2 = () => insertAtLineStart("## ");
    const handleH3 = () => insertAtLineStart("### ");
    const handleUnorderedList = () => insertAtLineStart("- ");
    const handleOrderedList = () => insertAtLineStart("1. ");

    const handleLink = () => {
        const {start, end, text, before, after} = getSelection();
        const url = window.prompt("Enter URL:", "https://");
        if (url == null) return;
        const label = text.trim() || "link text";
        const insert = `[${label}](${url})`;
        const newContent = before + insert + after;
        setContent(newContent);
        saveToHistory(newContent);
        setTimeout(() => {
            contentRef.current?.focus();
            const newPos = start + insert.length;
            contentRef.current?.setSelectionRange(newPos, newPos);
        }, 0);
    };

    const handleUndo = useCallback(() => {
        if (historyIndexRef.current > 0) {
            historyIndexRef.current--;
            const prevContent = historyRef.current[historyIndexRef.current];
            setContent(prevContent);
        }
    }, []);

    const handleRedo = useCallback(() => {
        if (historyIndexRef.current < historyRef.current.length - 1) {
            historyIndexRef.current++;
            const nextContent = historyRef.current[historyIndexRef.current];
            setContent(nextContent);
        }
    }, []);

    // Track content changes for history (debounced to avoid too many entries)
    useEffect(() => {
        if (historyRef.current.length === 0) return; // Skip if not initialized
        const timeoutId = setTimeout(() => {
            const current = historyRef.current[historyIndexRef.current];
            if (current !== content) {
                saveToHistory(content);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [content, saveToHistory]);

    const handleImage = () => {
        const {start, before, after} = getSelection();
        const url = window.prompt("Enter image URL:", "https://");
        if (url == null) return;
        const alt = window.prompt("Alt text (optional):", "") || "image";
        const insert = `![${alt}](${url})`;
        const newContent = before + insert + after;
        setContent(newContent);
        saveToHistory(newContent);
        setTimeout(() => {
            contentRef.current?.focus();
            contentRef.current?.setSelectionRange(start + insert.length, start + insert.length);
        }, 0);
    };

    const searchSlug = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("slug") : null;
    useEffect(() => {
        if (!searchSlug) {
            // Initialize history with initial content
            if (content && historyRef.current.length === 0) {
                historyRef.current = [content];
                historyIndexRef.current = 0;
            }
            return;
        }
        apiRequest("GET", API.articles.get(searchSlug))
            .then((r) => r.json())
            .then((a: { title?: string; content?: string; slug?: string; status?: string }) => {
                if (a.title != null) setTitle(a.title);
                if (a.content != null) {
                    setContent(a.content);
                    historyRef.current = [a.content];
                    historyIndexRef.current = 0;
                }
                if (a.slug != null) setSlug(a.slug);
                if (a.status === "published") setArticleStatus("published");
            })
            .catch(() => {
            });
    }, [searchSlug]);

    const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
    const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

    useEffect(() => {
        if (!title.trim()) return;
        autosaveRef.current && clearTimeout(autosaveRef.current);
        autosaveRef.current = setTimeout(() => {
            (async () => {
                setIsSaving(true);
                try {
                    const payload = {title: title.trim(), content: content || ""};
                    const res = slug
                        ? await apiRequest("PATCH", API.articles.patch(slug), payload)
                        : await apiRequest("POST", API.articles.create, payload);
                    const data = await res.json();
                    if (data.slug) setSlug(data.slug);
                } catch (_) {
                }
                setIsSaving(false);
            })();
        }, 3000);
        return () => {
            if (autosaveRef.current) clearTimeout(autosaveRef.current);
        };
    }, [title, content, slug]);

    const handleSaveDraft = async () => {
        if (!title.trim()) {
            toast({
                title: "Title required",
                description: "Please enter a title before saving.",
                variant: "destructive",
            });
            return;
        }
        setIsSaving(true);
        logger.info("Save draft clicked", {titleLength: title.length});
        try {
            const payload = {title: title.trim(), content: content || ""};
            const res = slug
                ? await apiRequest("PATCH", API.articles.patch(slug), payload)
                : await apiRequest("POST", API.articles.create, payload);
            const data = await res.json();
            if (data.slug) setSlug(data.slug);
            toast({
                title: "Draft saved",
                description: "Your draft has been saved successfully.",
            });
        } catch (error) {
            toast({
                title: "Save failed",
                description: "Failed to save draft. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!slug) {
            toast({
                title: "Save draft first",
                description: "Save your draft to get a link, then you can publish.",
                variant: "destructive",
            });
            return;
        }
        if (articleStatus === "published") {
            toast({
                title: "Already published",
                description: "This article is already published. Use the update endpoint to modify it.",
                variant: "default",
            });
            return;
        }
        setIsPublishing(true);
        try {
            const res = await apiRequest("POST", API.articles.publish(slug), {});
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                const detail = errData.detail || res.statusText;
                if (res.status === 400) {
                    toast({
                        title: "Cannot publish",
                        description: detail || "Article is already published or invalid state.",
                        variant: "destructive",
                    });
                    return;
                }
                throw new Error(detail);
            }
            setArticleStatus("published");
            toast({
                title: "Published",
                description: "Your article is now live. Taking you to the article.",
            });
            setLocation(`/blog/${slug}`);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Could not publish";
            toast({
                title: "Publish failed",
                description: msg.includes("already published") ? "Article is already published. Use update to modify it." : msg,
                variant: "destructive",
            });
        } finally {
            setIsPublishing(false);
        }
    };

    const handleAiAssist = async () => {
        if (!content?.trim()) {
            toast({
                title: "Content required",
                description: "Add some content before using AI assist.",
                variant: "destructive",
            });
            return;
        }
        setIsAiGenerating(true);
        try {
            const response = await apiRequest("POST", API.ai.improve, {
                content,
                instruction: "Add a concise TL;DR (2-3 sentences) at the beginning. Keep the rest unchanged.",
            });
            const data = await response.json();
            const improved = data.improved_content || data.content;
            if (improved) setContent(improved);
            toast({
                title: "AI Assist applied",
                description: "Content updated with TL;DR.",
            });
        } catch (error) {
            toast({
                title: "AI Assist failed",
                description: "Failed to improve content. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsAiGenerating(false);
        }
    };

    const handleGenerateSeo = async () => {
        if (!title?.trim() && !content?.trim()) {
            toast({
                title: "Add title or content",
                description: "Add a title or some content before generating SEO metadata.",
                variant: "destructive",
            });
            return;
        }
        setIsSeoLoading(true);
        setSeoResult(null);
        try {
            const res = await apiRequest("POST", API.ai.seo, {
                title: title.trim() || "Untitled",
                content: content?.slice(0, 4000) || "",
            });
            const data = await res.json();
            setSeoResult({
                seo_topics: data.seo_topics,
                meta_title: data.meta_title,
                meta_description: data.meta_description,
                keywords: data.keywords ?? [],
            });
            toast({title: "SEO suggestions ready", description: "Use the suggestions below for your meta tags."});
        } catch (error) {
            toast({
                title: "SEO generation failed",
                description: "AI is unavailable or you may need a Pro/Creator plan.",
                variant: "destructive",
            });
        } finally {
            setIsSeoLoading(false);
        }
    };

    const handleGenerateDiagram = async () => {
        if (!diagramTopic.trim()) {
            toast({title: "Enter a topic", description: "e.g. API request flow", variant: "destructive"});
            return;
        }
        setIsDiagramLoading(true);
        try {
            const res = await apiRequest("POST", API.ai.diagram, {
                topic: diagramTopic.trim(),
                diagram_type: "flowchart",
            });
            const data = await res.json();
            const code = data.mermaid_code?.trim();
            if (code) {
                const block = `\n\n\`\`\`mermaid\n${code}\n\`\`\`\n\n`;
                setContent((c) => c + block);
                setDiagramTopic("");
                toast({title: "Diagram inserted", description: "Mermaid diagram added to your content."});
            } else {
                toast({title: "No diagram generated", variant: "destructive"});
            }
        } catch (error) {
            toast({
                title: "Diagram failed",
                description: "AI unavailable or try another topic.",
                variant: "destructive"
            });
        } finally {
            setIsDiagramLoading(false);
        }
    };

    const handleCrosspost = async () => {
        if (!slug || (!crosspostDevto && !crosspostMedium)) {
            toast({title: "Select at least one platform", variant: "destructive"});
            return;
        }
        setIsCrossposting(true);
        try {
            await apiRequest("POST", API.articles.crosspost(slug), {devto: crosspostDevto, medium: crosspostMedium});
            toast({
                title: "Cross-post requested",
                description: "Your article will be synced to the selected platforms."
            });
        } catch (error) {
            toast({title: "Cross-post failed", variant: "destructive"});
        } finally {
            setIsCrossposting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Editor Header */}
            <header
                className="h-16 border-b border-border bg-card/50 backdrop-blur px-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4"/>
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Drafts</span>
                        <span>/</span>
                        <span className="text-foreground font-medium">Untitled Article</span>
                    </div>
                    <Badge variant="secondary"
                           className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Unsaved</Badge>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleSaveDraft}
                            disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2"/>
                        {isSaving ? "Saving..." : "Save Draft"}
                    </Button>
                    <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={handlePublish}
                        disabled={isPublishing || !slug}
                    >
                        {isPublishing ? "Publishing…" : articleStatus === "published" ? "Published" : "Publish"}
                    </Button>
                </div>
            </header>

            {/* Main Editor Area */}
            <main className="flex-1 container mx-auto max-w-4xl py-12 px-4 flex flex-col gap-6">

                {/* Title Input */}
                <Input
                    placeholder="Article Title"
                    className="text-4xl font-display font-bold border-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50 h-auto bg-transparent"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                {/* Toolbar - all buttons wired to markdown */}
                <div
                    className="flex items-center gap-1 p-2 bg-secondary/30 rounded-lg border border-border sticky top-20 z-10 backdrop-blur-sm">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Bold"
                            onMouseDown={(e) => { e.preventDefault(); lastSelectionRef.current = { start: contentRef.current?.selectionStart ?? 0, end: contentRef.current?.selectionEnd ?? 0 }; }}
                            onClick={handleBold}>
                        <Bold className="h-4 w-4"/>
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Italic"
                            onMouseDown={(e) => { e.preventDefault(); lastSelectionRef.current = { start: contentRef.current?.selectionStart ?? 0, end: contentRef.current?.selectionEnd ?? 0 }; }}
                            onClick={handleItalic}>
                        <Italic className="h-4 w-4"/>
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Underline"
                            onMouseDown={(e) => { e.preventDefault(); lastSelectionRef.current = { start: contentRef.current?.selectionStart ?? 0, end: contentRef.current?.selectionEnd ?? 0 }; }}
                            onClick={handleUnderline}>
                        <Underline className="h-4 w-4"/>
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Link"
                            onMouseDown={(e) => { e.preventDefault(); lastSelectionRef.current = { start: contentRef.current?.selectionStart ?? 0, end: contentRef.current?.selectionEnd ?? 0 }; }}
                            onClick={handleLink}>
                        <LinkIcon className="h-4 w-4"/>
                    </Button>
                    <div className="w-px h-4 bg-border mx-1"/>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Code"
                            onMouseDown={(e) => { e.preventDefault(); lastSelectionRef.current = { start: contentRef.current?.selectionStart ?? 0, end: contentRef.current?.selectionEnd ?? 0 }; }}
                            onClick={handleCode}>
                        <Code className="h-4 w-4"/>
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Image (URL)"
                            onMouseDown={(e) => { e.preventDefault(); lastSelectionRef.current = { start: contentRef.current?.selectionStart ?? 0, end: contentRef.current?.selectionEnd ?? 0 }; }}
                            onClick={handleImage}>
                        <ImageIcon className="h-4 w-4"/>
                    </Button>
                    <div className="w-px h-4 bg-border mx-1"/>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Blockquote"
                            onMouseDown={(e) => { e.preventDefault(); lastSelectionRef.current = { start: contentRef.current?.selectionStart ?? 0, end: contentRef.current?.selectionEnd ?? 0 }; }}
                            onClick={handleBlockquote}>
                        <Quote className="h-4 w-4"/>
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Heading 1"
                            onMouseDown={(e) => { e.preventDefault(); lastSelectionRef.current = { start: contentRef.current?.selectionStart ?? 0, end: contentRef.current?.selectionEnd ?? 0 }; }}
                            onClick={handleH1}>
                        <Heading1 className="h-4 w-4"/>
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Heading 2"
                            onMouseDown={(e) => { e.preventDefault(); lastSelectionRef.current = { start: contentRef.current?.selectionStart ?? 0, end: contentRef.current?.selectionEnd ?? 0 }; }}
                            onClick={handleH2}>
                        <Heading2 className="h-4 w-4"/>
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Heading 3"
                            onMouseDown={(e) => { e.preventDefault(); lastSelectionRef.current = { start: contentRef.current?.selectionStart ?? 0, end: contentRef.current?.selectionEnd ?? 0 }; }}
                            onClick={handleH3}>
                        <Heading3 className="h-4 w-4"/>
                    </Button>
                    <div className="w-px h-4 bg-border mx-1"/>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Bullet list"
                            onMouseDown={(e) => { e.preventDefault(); lastSelectionRef.current = { start: contentRef.current?.selectionStart ?? 0, end: contentRef.current?.selectionEnd ?? 0 }; }}
                            onClick={handleUnorderedList}>
                        <List className="h-4 w-4"/>
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Numbered list"
                            onMouseDown={(e) => { e.preventDefault(); lastSelectionRef.current = { start: contentRef.current?.selectionStart ?? 0, end: contentRef.current?.selectionEnd ?? 0 }; }}
                            onClick={handleOrderedList}>
                        <ListOrdered className="h-4 w-4"/>
                    </Button>

                    <div className="flex-1"/>

                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-2 border-primary/30 text-primary hover:bg-primary/10"
                        onClick={handleAiAssist}
                        disabled={isAiGenerating}
                    >
                        <Sparkles className={`h-3 w-3 ${isAiGenerating ? "animate-spin" : ""}`}/>
                        {isAiGenerating ? "Generating…" : "AI Assist"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-2 border-primary/30 text-primary hover:bg-primary/10"
                        onClick={handleGenerateSeo}
                        disabled={isSeoLoading}
                    >
                        <Search className={`h-3 w-3 ${isSeoLoading ? "animate-spin" : ""}`}/>
                        {isSeoLoading ? "Generating…" : "SEO"}
                    </Button>
                    <div className="flex items-center gap-1">
                        <input
                            placeholder="Diagram topic..."
                            value={diagramTopic}
                            onChange={(e) => setDiagramTopic(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleGenerateDiagram()}
                            className="h-8 w-36 rounded border border-border bg-background px-2 text-xs"
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                            onClick={handleGenerateDiagram}
                            disabled={isDiagramLoading}
                        >
                            <GitBranch className={`h-3 w-3 ${isDiagramLoading ? "animate-spin" : ""}`}/>
                            Diagram
                        </Button>
                    </div>
                </div>

                {articleStatus === "published" && slug && (
                    <div
                        className="rounded-lg border border-border bg-secondary/20 p-4 flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium flex items-center gap-2">
              <Share2 className="h-4 w-4 text-primary"/>
              Cross-post
            </span>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={crosspostDevto}
                                   onChange={(e) => setCrosspostDevto(e.target.checked)} className="rounded"/>
                            Dev.to
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={crosspostMedium}
                                   onChange={(e) => setCrosspostMedium(e.target.checked)} className="rounded"/>
                            Medium
                        </label>
                        <Button variant="outline" size="sm" onClick={handleCrosspost} disabled={isCrossposting}>
                            {isCrossposting ? "Posting…" : "Publish to selected"}
                        </Button>
                    </div>
                )}

                {seoResult && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                        <p className="text-sm font-medium text-primary">AI SEO topics</p>
                        {seoResult.seo_topics ? (
                            <p className="text-sm text-foreground whitespace-pre-wrap bg-background/80 rounded px-2 py-2">{seoResult.seo_topics}</p>
                        ) : null}
                        {seoResult.meta_title && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Meta title</p>
                                <p className="text-sm font-mono bg-background/80 rounded px-2 py-1">{seoResult.meta_title}</p>
                            </div>
                        )}
                        {seoResult.meta_description && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Meta description</p>
                                <p className="text-sm font-mono bg-background/80 rounded px-2 py-1">{seoResult.meta_description}</p>
                            </div>
                        )}
                        {seoResult.keywords?.length ? (
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Keywords</p>
                                <div className="flex flex-wrap gap-1">
                                    {seoResult.keywords.map((k) => (
                                        <Badge key={k} variant="secondary" className="text-xs">
                                            {k}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <p className="text-xs text-muted-foreground">
                        You can use Markdown to write easily and add code blocks.
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant={viewMode === "edit" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setViewMode("edit")}
                        >
                            Edit
                        </Button>
                        <Button
                            type="button"
                            variant={viewMode === "preview" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setViewMode("preview")}
                        >
                            Preview
                        </Button>
                        <span className="text-xs text-muted-foreground">
              {wordCount} words · {readingTimeMin} min read
            </span>
                    </div>
                </div>

                {/* Content Area */}
                {viewMode === "edit" ? (
                    <Textarea
                        ref={contentRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onBlur={() => {
                            if (contentRef.current)
                                lastSelectionRef.current = { start: contentRef.current.selectionStart, end: contentRef.current.selectionEnd };
                        }}
                        onKeyDown={(e) => {
                            const mod = e.metaKey || e.ctrlKey;
                            if (!mod) return;
                            switch (e.key.toLowerCase()) {
                                case "b":
                                    e.preventDefault();
                                    handleBold();
                                    break;
                                case "i":
                                    e.preventDefault();
                                    handleItalic();
                                    break;
                                case "u":
                                    e.preventDefault();
                                    handleUnderline();
                                    break;
                                case "k":
                                    e.preventDefault();
                                    handleLink();
                                    break;
                                case "z":
                                    e.preventDefault();
                                    if (e.shiftKey) {
                                        handleRedo();
                                    } else {
                                        handleUndo();
                                    }
                                    break;
                                case "y":
                                    if (e.metaKey || e.ctrlKey) {
                                        e.preventDefault();
                                        handleRedo();
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }}
                        className="flex-1 min-h-[500px] font-mono text-base resize-none border-none focus-visible:ring-0 p-0 bg-transparent leading-relaxed"
                        placeholder="Start writing..."
                    />
                ) : (
                    <div
                        className="flex-1 min-h-[500px] rounded-lg border border-border bg-card/30 p-6 prose prose-invert max-w-none dark:prose-invert">
                        <MarkdownRenderer content={content || "*Nothing to preview yet.*"}/>
                    </div>
                )}
            </main>
        </div>
    );
}
