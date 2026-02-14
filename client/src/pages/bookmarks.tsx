import {useEffect, useState} from "react";
import {Link} from "wouter";
import {Footer, Navbar} from "@/components/layout";
import {Button} from "@/components/ui/button";
import {Card, CardHeader, CardTitle} from "@/components/ui/card";
import {Bookmark} from "lucide-react";

const BOOKMARKS_KEY = "devlog-bookmarks";

type BookmarkEntry = { id: number; slug: string; title: string };

function normalizeList(raw: string): BookmarkEntry[] {
    try {
        const list = JSON.parse(raw || "[]");
        if (!Array.isArray(list)) return [];
        return list
            .map((x: BookmarkEntry | number) => (typeof x === "object" && x?.id && x?.slug && x?.title ? x : null))
            .filter(Boolean) as BookmarkEntry[];
    } catch {
        return [];
    }
}

export default function BookmarksPage() {
    const [articles, setArticles] = useState<BookmarkEntry[]>([]);

    useEffect(() => {
        setArticles(normalizeList(localStorage.getItem(BOOKMARKS_KEY) || "[]"));
    }, []);

    const removeBookmark = (id: number) => {
        const list = normalizeList(localStorage.getItem(BOOKMARKS_KEY) || "[]");
        const next = list.filter((a) => a.id !== id);
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
        setArticles(next);
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar/>
            <main className="container mx-auto px-4 py-12 max-w-2xl">
                <h1 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                    <Bookmark className="h-6 w-6"/>
                    Saved articles
                </h1>
                {articles.length === 0 ? (
                    <p className="text-muted-foreground">No bookmarks yet. Save articles from the blog to see them
                        here.</p>
                ) : (
                    <ul className="space-y-2">
                        {articles.map((a) => (
                            <Card key={a.id} className="flex flex-row items-center justify-between p-3 gap-2">
                                <Link href={`/blog/${a.slug}`} className="flex-1 min-w-0">
                                    <CardHeader className="p-0 cursor-pointer">
                                        <CardTitle
                                            className="text-base font-medium hover:text-primary truncate">{a.title}</CardTitle>
                                    </CardHeader>
                                </Link>
                                <Button variant="ghost" size="sm" onClick={() => removeBookmark(a.id)}>
                                    Remove
                                </Button>
                            </Card>
                        ))}
                    </ul>
                )}
            </main>
            <Footer/>
        </div>
    );
}
