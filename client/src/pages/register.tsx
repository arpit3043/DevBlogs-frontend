import {useEffect, useRef, useState} from "react";
import {Link, useLocation} from "wouter";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {useToast} from "@/hooks/use-toast";
import {apiRequest, getTokenFromAuthResponse} from "@/lib/queryClient";
import {API} from "@/lib/api";

declare global {
    interface Window {
        google: any;
    }
}

function persistSession(token: string) {
    localStorage.setItem("token", token);
    apiRequest("GET", API.auth.me)
        .then((r) => r.json())
        .then((data) => {
            localStorage.setItem(
                "user",
                JSON.stringify({
                    id: data.id,
                    username: data.username,
                    full_name: data.full_name ?? null,
                    email: data.email ?? null,
                    role: data.role ?? "reader",
                })
            );
        })
        .catch(() => {
        });
}

export default function Register() {
    const {toast} = useToast();
    const [, setLocation] = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const googleButtonRef = useRef<HTMLDivElement>(null);
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const handleGoogleCallback = async (response: { credential?: string }) => {
        try {
            if (!response?.credential) throw new Error("No Google credential received");
            const apiResponse = await apiRequest("POST", API.auth.googleLogin, { token: response.credential });
            if (!apiResponse.ok) {
                const err = await apiResponse.json().catch(() => ({}));
                throw new Error(err.detail || "Google sign-up failed");
            }
            const data = await apiResponse.json();
            const token = getTokenFromAuthResponse(data);
            if (!token) throw new Error("Token missing");
            persistSession(token);
            toast({ title: "Account created", description: "Welcome! Redirecting." });
            setLocation("/dashboard");
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Google sign-up failed";
            toast({ title: "Google sign-up failed", description: msg, variant: "destructive" });
        }
    };

    useEffect(() => {
        if (!window.google || !googleClientId || !googleButtonRef.current) return;
        if (googleButtonRef.current.children.length > 0) return;
        window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCallback,
            context: "signin",
        });
        try {
            window.google.accounts.id.renderButton(googleButtonRef.current, {
                type: "standard",
                theme: "outline",
                size: "large",
                text: "continue_with",
                width: 320,
                shape: "rectangular",
            });
        } catch {
            // ignore
        }
    }, [googleClientId]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast({ title: "Passwords don't match", description: "Please make sure your passwords match", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        try {
            const res = await apiRequest("POST", API.auth.register, { email: email.trim(), password });
            const data = await res.json();
            const token = getTokenFromAuthResponse(data);
            if (token) {
                persistSession(token);
                setLocation("/dashboard");
                toast({ title: "Account created", description: "Welcome! Redirecting to dashboard." });
            } else {
                setLocation("/login");
                toast({ title: "Account created", description: "Please sign in with your credentials." });
            }
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            let message = err?.message ?? "Registration failed. Please try again.";
            const isConflict = err?.status === 409 || message.toLowerCase().includes("already exists");
            toast({
                title: isConflict ? "Account already exists" : "Registration failed",
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>Sign up for a new account</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Email (Register): Email, Password, Confirm Password, Create Account */}
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reg-email">Email</Label>
                            <Input
                                id="reg-email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reg-password">Password</Label>
                            <Input
                                id="reg-password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reg-confirm">Confirm Password</Label>
                            <Input
                                id="reg-confirm"
                                type="password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Creating account..." : "Create Account"}
                        </Button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or sign up with Google</span>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-col items-center gap-2">
                            {googleClientId ? (
                                <>
                                    <div
                                        ref={googleButtonRef}
                                        id="google-button-register"
                                        className="min-h-[44px] flex items-center justify-center"
                                        aria-label="Sign up with Google — opens in a new window"
                                    />
                                    <p className="text-xs text-muted-foreground text-center max-w-[320px]">
                                        A new window will open so you can sign in with your Gmail account.
                                    </p>
                                </>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full max-w-[320px]"
                                    onClick={() => toast({ title: "Google not configured", description: "Add VITE_GOOGLE_CLIENT_ID to .env", variant: "destructive" })}
                                >
                                    Continue with Google (not configured)
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 text-center text-sm">
                        Already have an account?{" "}
                        <Link href="/login" className="text-primary hover:underline">
                            Sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}