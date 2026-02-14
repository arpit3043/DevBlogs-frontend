import {useEffect, useState} from "react";
import {Link, useLocation} from "wouter";
import {Navbar} from "@/components/layout";
import {Button} from "@/components/ui/button";
import {useAuth} from "@/hooks/useAuth";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {DollarSign, Edit2, Eye, FileEdit, FileText, MoreHorizontal, Trash2} from "lucide-react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {Skeleton} from "@/components/ui/skeleton";
import {useToast} from "@/hooks/use-toast";
import {apiRequest} from "@/lib/queryClient";
import {API} from "@/lib/api";
import {logger} from "@/lib/logger";

type DashboardData = {
    total_articles: number;
    total_views: number;
    total_earnings: number;
    top_articles: {
        id: number;
        slug: string;
        title: string;
        view_count: number;
    }[];
    drafts?: {
        id: number;
        slug: string;
        title: string;
        updated_at?: string;
        created_at?: string;
    }[];
    draft_count?: number;
};

export default function Dashboard() {
    const [, setLocation] = useLocation();
    const {toast} = useToast();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const {isAuthenticated} = useAuth();

    const refetchDashboard = async () => {
        try {
            const response = await apiRequest("GET", API.analytics.creatorDashboard);
            const dashboardData = (await response.json()) as DashboardData;
            setData(dashboardData);
        } catch {
            setData((prev) => prev ?? {total_articles: 0, total_views: 0, total_earnings: 0, top_articles: []});
        }
    };

    const handleDeleteArticle = async () => {
        if (!deleteSlug) return;
        setIsDeleting(true);
        try {
            await apiRequest("DELETE", API.articles.delete(deleteSlug));
            toast({title: "Article deleted", description: "The article has been removed."});
            setDeleteSlug(null);
            await refetchDashboard();
        } catch (e: any) {
            toast({
                title: "Delete failed",
                description: e?.message || "Could not delete the article.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            logger.warn("User not authenticated, redirecting to login");
            setLocation("/login");
            return;
        }

        logger.info("Fetching creator dashboard");

        (async () => {
            try {
                const response = await apiRequest(
                    "GET",
                    API.analytics.creatorDashboard
                );

                const dashboardData =
                    (await response.json()) as DashboardData;

                setData(dashboardData);
            } catch (e: any) {
                logger.error("Dashboard load failed", e);

                if (
                    e?.message?.includes("401") ||
                    e?.message?.includes("403")
                ) {
                    localStorage.removeItem("token");
                    setLocation("/login");
                    return;
                }

                setError(e?.message || "Failed to load dashboard");
            } finally {
                setLoading(false);
            }
        })();
    }, [isAuthenticated, setLocation]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar/>
                <div className="container mx-auto px-4 py-8">
                    <Skeleton className="h-10 w-48 mb-8"/>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-24"/>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar/>
                <div className="container mx-auto px-4 py-8">
                    <p className="text-destructive">{error}</p>
                    <Link href="/login">
                        <Button variant="outline" className="mt-4">
                            Log in
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const stats: DashboardData = data ?? {
        total_articles: 0,
        total_views: 0,
        total_earnings: 0,
        top_articles: [],
        drafts: [],
        draft_count: 0,
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar/>

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold">Dashboard</h1>
                        <p className="text-muted-foreground">
                            Overview of your content performance.
                        </p>
                    </div>
                    <Link href="/editor">
                        <Button className="gap-2">
                            <Edit2 className="h-4 w-4"/> New Article
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Views
                            </CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_views.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Articles
                            </CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_articles}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Est. Earnings
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ${stats.total_earnings.toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Articles</CardTitle>
                        <CardDescription>
                            Your best-performing content.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Views</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {stats.top_articles.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={3}
                                            className="text-center text-muted-foreground py-8"
                                        >
                                            No articles yet.{" "}
                                            <Link href="/editor">
                        <span className="text-primary hover:underline">
                          Create one
                        </span>
                                            </Link>
                                            .
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stats.top_articles.map((a) => (
                                        <TableRow key={a.id}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground"/>
                                                {a.title}
                                            </TableCell>
                                            <TableCell>
                                                {a.view_count.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <MoreHorizontal className="h-4 w-4"/>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/blog/${a.slug}`}>
                                                                View
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/editor?slug=${a.slug}`}>
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onSelect={(e) => {
                                                                e.preventDefault();
                                                                setDeleteSlug(a.slug);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2"/>
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {stats.drafts && stats.drafts.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>My Drafts</CardTitle>
                            <CardDescription>
                                Your saved drafts ({stats.draft_count || stats.drafts.length} total).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Last Updated</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.drafts.map((draft) => (
                                        <TableRow key={draft.id}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <FileEdit className="h-4 w-4 text-muted-foreground"/>
                                                {draft.title || "Untitled"}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {draft.updated_at
                                                    ? new Date(draft.updated_at).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })
                                                    : draft.created_at
                                                        ? new Date(draft.created_at).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })
                                                        : "—"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4"/>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/editor?slug=${draft.slug}`}>
                                                                <Edit2 className="h-4 w-4 mr-2"/>
                                                                Continue editing
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onSelect={(e) => {
                                                                e.preventDefault();
                                                                setDeleteSlug(draft.slug);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2"/>
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>

            <AlertDialog open={!!deleteSlug} onOpenChange={(open) => !open && setDeleteSlug(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete article?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove this article. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteArticle();
                            }}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting…" : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
