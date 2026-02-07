import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, DollarSign, MoreHorizontal, Edit2, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { API } from "@/lib/api";
import { logger } from "@/lib/logger";

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
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      logger.warn("No token found, redirecting to login");
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

        const dashboardData = await response.json() as DashboardData;
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
  }, [setLocation]);

  /* ---------------- Loading ---------------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- Error ---------------- */

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
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
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

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
              <Edit2 className="h-4 w-4" /> New Article
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Views
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
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
              <FileText className="h-4 w-4 text-muted-foreground" />
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
              <DollarSign className="h-4 w-4 text-muted-foreground" />
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
                        <FileText className="h-4 w-4 text-muted-foreground" />
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
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/blog/${a.slug}`}>
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/editor?slug=${a.slug}`}
                              >
                                Edit
                              </Link>
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
      </div>
    </div>
  );
}
