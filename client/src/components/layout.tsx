import {Link, useLocation} from "wouter";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {LayoutDashboard, LogOut, Menu, Moon, PenLine, Sun,} from "lucide-react";
import {useState} from "react";
import {Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet";
import {useAuth} from "@/hooks/useAuth";
import {useTheme} from "@/contexts/ThemeContext";
import {FeedbackDialog} from "@/components/FeedbackDialog";
import techBlogsLogo from "@/assets/tech-b-logs-logo.png";

function logOut() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
}

export function Navbar() {
    const [location] = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const {isAuthenticated, user} = useAuth();
    const {theme, toggleTheme} = useTheme();

    const navItems = [
        {label: "Home", href: "/"},
        {label: "Explore", href: "/blog"},
        {label: "Write", href: "/editor"},
        {label: "Bookmarks", href: "/bookmarks"},
        {label: "Profile", href: "/profile"},
    ];
    if (isAuthenticated && user?.role === "admin") {
        navItems.push({label: "Admin", href: "/admin"});
    }

    return (
        <nav className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/">
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                        <img
                            src={techBlogsLogo}
                            alt="Tech B-Logs"
                            className="h-10 w-auto object-contain"
                        />
                        <span
                            className="font-display font-bold text-xl tracking-tight hidden sm:inline">Tech B-Logs</span>
                    </div>
                </Link>

                <div className="hidden md:flex items-center gap-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="hidden md:flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}
                            title={theme === "dark" ? "Light mode" : "Dark mode"}>
                        {theme === "dark" ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
                    </Button>
                    {isAuthenticated ? (
                        <>
              <span className="text-sm text-muted-foreground">
                {user?.full_name || user?.username || "User"}
                  {user?.role && (
                      <Badge variant="secondary" className="ml-2 text-xs capitalize">
                          {user.role}
                      </Badge>
                  )}
              </span>
                            <Link href="/dashboard">
                                <Button variant="default" size="sm" className="gap-2">
                                    <LayoutDashboard className="h-4 w-4"/>
                                    Dashboard
                                </Button>
                            </Link>
                            <Link href="/editor">
                                <Button variant="outline" size="sm"
                                        className="gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5">
                                    <PenLine className="h-4 w-4"/>
                                    Write
                                </Button>
                            </Link>
                            <Button variant="ghost" size="sm" className="gap-2" onClick={logOut}>
                                <LogOut className="h-4 w-4"/>
                                Log out
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost" size="sm">Log in</Button>
                            </Link>
                            <Link href="/dashboard">
                                <Button variant="default" size="sm" className="gap-2">
                                    <LayoutDashboard className="h-4 w-4"/>
                                    Dashboard
                                </Button>
                            </Link>
                            <Link href="/editor">
                                <Button variant="outline" size="sm"
                                        className="gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5">
                                    <PenLine className="h-4 w-4"/>
                                    Write
                                </Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Nav */}
                <div className="md:hidden">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5"/>
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <div className="flex flex-col gap-6 mt-10">
                                {navItems.map((item) => (
                                    <Link key={item.href} href={item.href} className="text-lg font-medium"
                                          onClick={() => setIsOpen(false)}>
                                        {item.label}
                                    </Link>
                                ))}
                                <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => {
                                    toggleTheme();
                                    setIsOpen(false);
                                }}>
                                    {theme === "dark" ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
                                    {theme === "dark" ? "Light mode" : "Dark mode"}
                                </Button>
                                <div className="h-px bg-border my-2"/>
                                {isAuthenticated && (
                                    <p className="text-sm text-muted-foreground">
                                        {user?.full_name || user?.username || "User"} ({user?.role ?? "reader"})
                                    </p>
                                )}
                                <Link href="/dashboard">
                                    <Button className="w-full justify-start gap-2" variant="secondary"
                                            onClick={() => setIsOpen(false)}>
                                        <LayoutDashboard className="h-4 w-4"/> Dashboard
                                    </Button>
                                </Link>
                                <Link href="/editor">
                                    <Button className="w-full justify-start gap-2" onClick={() => setIsOpen(false)}>
                                        <PenLine className="h-4 w-4"/> Start Writing
                                    </Button>
                                </Link>
                                {isAuthenticated ? (
                                    <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => {
                                        logOut();
                                        setIsOpen(false);
                                    }}>
                                        <LogOut className="h-4 w-4"/> Log out
                                    </Button>
                                ) : (
                                    <Link href="/login">
                                        <Button className="w-full justify-start gap-2" onClick={() => setIsOpen(false)}>
                                            Log in
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
}

export function Footer() {
    return (
        <footer className="bg-card border-t border-border/50 py-12 mt-20">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <img
                                src={techBlogsLogo}
                                alt="Tech B-Logs"
                                className="h-8 w-auto object-contain"
                            />
                            <span className="font-display font-bold text-lg">Tech B-Logs</span>
                        </div>
                        <p className="text-muted-foreground text-sm max-w-sm">
                            The platform for engineering teams to share knowledge, document systems, and build their
                            technical brand.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-medium mb-4 text-sm uppercase tracking-wider text-muted-foreground">Product</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="/getting-started" className="hover:text-primary transition-colors">Getting
                                started</a></li>
                            <li><a href="/#features" className="hover:text-primary transition-colors">Features</a></li>
                            <li><a href="/#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                            <li><a href="/blog" className="hover:text-primary transition-colors">Blog</a></li>
                            <li><a href="/bookmarks" className="hover:text-primary transition-colors">Bookmarks</a></li>
                            <li><span className="inline-flex"><FeedbackDialog/></span></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-medium mb-4 text-sm uppercase tracking-wider text-muted-foreground">Legal</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-border/30 text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} Tech B-Logs. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
