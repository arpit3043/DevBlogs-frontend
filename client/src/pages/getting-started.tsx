import {Link} from "wouter";
import {Footer, Navbar} from "@/components/layout";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Bookmark, BookOpen, LayoutDashboard, PenLine, Sparkles} from "lucide-react";

export default function GettingStartedPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar/>
            <main className="container mx-auto px-4 py-12 max-w-3xl">
                <h1 className="text-3xl font-display font-bold mb-2">Getting started with DevLog</h1>
                <p className="text-muted-foreground mb-10">
                    A short overview of the platform so you can write, discover, and manage your technical blog.
                </p>

                <div className="space-y-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <PenLine className="h-5 w-5 text-primary"/>
                            </div>
                            <CardTitle>Write & publish</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-muted-foreground">
                            <p>Create an account and go to <strong className="text-foreground">Write</strong> (or
                                Dashboard → new draft). Use Markdown, add code blocks, and use the toolbar for bold,
                                italic, links, and headings. Use the <strong
                                    className="text-foreground">Diagram</strong> and <strong
                                    className="text-foreground">SEO</strong> tools to add mermaid diagrams and SEO
                                topics. Save drafts and publish when ready.</p>
                            <Link href="/editor">
                                <Button variant="outline" size="sm" className="mt-2">Open editor</Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-primary"/>
                            </div>
                            <CardTitle>Explore</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-muted-foreground">
                            <p>On the <strong className="text-foreground">Home</strong> page you see the main feed and
                                “Up next” suggestions. Use <strong className="text-foreground">Explore /
                                    Blog</strong> to browse all published articles. Open any article to read,
                                use <strong className="text-foreground">AI TL;DR</strong> and <strong
                                    className="text-foreground">Explain</strong> (when signed in), and share or bookmark
                                posts.</p>
                            <Link href="/blog">
                                <Button variant="outline" size="sm" className="mt-2">Browse blog</Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Bookmark className="h-5 w-5 text-primary"/>
                            </div>
                            <CardTitle>Bookmarks</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-muted-foreground">
                            <p>Click the bookmark icon on any article to save it. Your saved articles appear in
                                the <strong className="text-foreground">Bookmarks</strong> section (link in the footer)
                                so you can find them later.</p>
                            <Link href="/bookmarks">
                                <Button variant="outline" size="sm" className="mt-2">View bookmarks</Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <LayoutDashboard className="h-5 w-5 text-primary"/>
                            </div>
                            <CardTitle>Profile & dashboard</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-muted-foreground">
                            <p>Your <strong className="text-foreground">Profile / Dashboard</strong> shows your drafts
                                and published articles, view stats, and lets you edit or delete posts. Drafts are
                                autosaved as you type.</p>
                            <Link href="/dashboard">
                                <Button variant="outline" size="sm" className="mt-2">Go to dashboard</Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-primary"/>
                            </div>
                            <CardTitle>AI features</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-muted-foreground">
                            <p><strong className="text-foreground">In the editor:</strong> SEO (topics list), Diagram
                                (mermaid from a topic), and AI Assist (improve content). <strong
                                    className="text-foreground">On articles:</strong> TL;DR (summary) and Explain
                                (concept explanation). These require a signed-in creator account and may be
                                rate-limited.</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-12 flex justify-center">
                    <Link href="/">
                        <Button>Back to home</Button>
                    </Link>
                </div>
            </main>
            <Footer/>
        </div>
    );
}
