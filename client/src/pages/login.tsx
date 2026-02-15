import {useEffect, useRef, useState} from "react";
import {Link, useLocation} from "wouter";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {useToast} from "@/hooks/use-toast";
import {apiRequest, getTokenFromAuthResponse} from "@/lib/queryClient";
import {API} from "@/lib/api";
import {logger} from "@/lib/logger";

function persistSession(token: string) {
    localStorage.setItem("token", token);
    apiRequest("GET", API.auth.me)
        .then((r) => r.json())
        .then((data) => {
            const user = {
                id: data.id,
                username: data.username,
                full_name: data.full_name ?? null,
                email: data.email ?? null,
                role: data.role ?? "reader",
            };
            localStorage.setItem("user", JSON.stringify(user));
        })
        .catch(() => {
        });
}

declare global {
    interface Window {
        google: any;
    }
}

export default function Login() {
    const {toast} = useToast();
    const [, setLocation] = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (token) setLocation("/dashboard");
    }, [token, setLocation]);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    /* =========================
       OTP Login Component
       ========================= */
    function OTPLoginForm() {
        const [otpEmailOrPhone, setOtpEmailOrPhone] = useState("");
        const [otpCode, setOtpCode] = useState("");
        const [otpSent, setOtpSent] = useState(false);
        const [isSending, setIsSending] = useState(false);
        const [isVerifying, setIsVerifying] = useState(false);
        const [countdown, setCountdown] = useState(0);
        const isEmail = otpEmailOrPhone.includes("@");

        const handleSendOTP = async (e: React.FormEvent) => {
            e.preventDefault();
            const value = otpEmailOrPhone.trim();
            if (!value) {
                toast({ title: "Error", description: "Enter email or phone number.", variant: "destructive" });
                return;
            }
            setIsSending(true);
            try {
                const response = await apiRequest("POST", API.auth.otpSend, {
                    email: isEmail ? value : undefined,
                    phone: !isEmail ? value : undefined,
                });
                const body = await response.json().catch(() => ({}));
                setOtpSent(true);
                setCountdown(60);
                const interval = setInterval(() => {
                    setCountdown((prev) => (prev <= 1 ? (clearInterval(interval), 0) : prev - 1));
                }, 1000);
                const devOtp = body?.dev_otp;
                toast({
                    title: "OTP sent",
                    description: devOtp ? `For development: your OTP is ${devOtp}` : "Check your email or phone for the code.",
                });
            } catch (error: unknown) {
                toast({
                    title: "Failed to send OTP",
                    description: error instanceof Error ? error.message : "Please try again.",
                    variant: "destructive",
                });
            } finally {
                setIsSending(false);
            }
        };

        const handleVerifyOTP = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!otpCode || otpCode.length !== 6) {
                toast({ title: "Error", description: "Enter the 6-digit OTP code.", variant: "destructive" });
                return;
            }
            const value = otpEmailOrPhone.trim();
            const useEmail = value.includes("@");
            setIsVerifying(true);
            try {
                const response = await apiRequest("POST", API.auth.otpVerify, {
                    email: useEmail ? value : undefined,
                    phone: !useEmail ? value : undefined,
                    code: otpCode,
                });
                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.detail || "Invalid OTP");
                }
                const data = await response.json();
                const token = getTokenFromAuthResponse(data);
                if (!token) throw new Error("Token missing");
                persistSession(token);
                toast({ title: "Login successful", description: "Welcome back!" });
                setLocation("/dashboard");
            } catch (error: unknown) {
                toast({
                    title: "OTP verification failed",
                    description: error instanceof Error ? error.message : "Invalid or expired code.",
                    variant: "destructive",
                });
            } finally {
                setIsVerifying(false);
            }
        };

        return (
            <div className="space-y-4">
                {!otpSent ? (
                    <form onSubmit={handleSendOTP} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="otp-email-or-phone">Email or Phone Number</Label>
                            <Input
                                id="otp-email-or-phone"
                                type="text"
                                inputMode="email"
                                placeholder="name@example.com or +1234567890"
                                value={otpEmailOrPhone}
                                onChange={(e) => setOtpEmailOrPhone(e.target.value)}
                                disabled={isSending}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSending || !otpEmailOrPhone.trim()}>
                            {isSending ? "Sending..." : "Send OTP"}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOTP} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="otp-code">Enter OTP Code</Label>
                            <Input
                                id="otp-code"
                                type="text"
                                inputMode="numeric"
                                placeholder="123456"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                maxLength={6}
                                className="text-center text-2xl tracking-widest"
                            />
                            <p className="text-xs text-muted-foreground text-center">Code sent to {otpEmailOrPhone}</p>
                        </div>
                        <Button type="submit" className="w-full" disabled={isVerifying || otpCode.length !== 6}>
                            {isVerifying ? "Verifying..." : "Verify OTP"}
                        </Button>
                        {countdown > 0 ? (
                            <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-muted/30 px-4 py-3">
                                <span className="text-2xl font-mono font-semibold tabular-nums text-foreground">{countdown}s</span>
                                <p className="text-xs text-center text-muted-foreground">Resend OTP in</p>
                            </div>
                        ) : (
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full text-xs"
                                onClick={() => { setOtpSent(false); setOtpCode(""); setCountdown(0); }}
                            >
                                Resend OTP
                            </Button>
                        )}
                    </form>
                )}
            </div>
        );
    }

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const googleButtonRef = useRef<HTMLDivElement>(null);

    /* =========================
       Google Sign-In: render button or One Tap
       ========================= */
    useEffect(() => {
        if (!window.google || !googleClientId || !googleButtonRef.current) return;
        if (googleButtonRef.current.children.length > 0) return; // already rendered

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
            // fallback
        }
    }, [googleClientId]);

    /* =========================
       Google Login Callback
       ========================= */
    const handleGoogleCallback = async (response: any) => {
        try {
            if (!response?.credential) {
                throw new Error("No Google credential received");
            }

            const apiResponse = await apiRequest(
                "POST",
                API.auth.googleLogin,
                {token: response.credential}
            );

            if (!apiResponse.ok) {
                const err = await apiResponse.json().catch(() => ({}));
                throw new Error(err.detail || "Google login failed");
            }

            const data = await apiResponse.json();
            const token = getTokenFromAuthResponse(data);

            if (!token) throw new Error("Token missing");
            persistSession(token);
            toast({
                title: "Login successful",
                description: "Welcome back!",
            });

            setLocation("/dashboard");
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Google login failed";
            logger.error("Google login failed", error);
            toast({
                title: "Google login failed",
                description: msg.includes("not configured") ? "Google OAuth is not configured on the server." : msg,
                variant: "destructive",
            });
        }
    };

    /* =========================
       Email / Phone Login
       ========================= */
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password) {
            toast({ title: "Missing fields", description: "Enter email and password.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        try {
            const response = await apiRequest("POST", API.auth.login, {
                identifier: email.trim(),
                password,
            });
            const data = await response.json();
            const token = getTokenFromAuthResponse(data);
            if (!token) throw new Error("Token not received");
            persistSession(token);
            toast({ title: "Login successful", description: "Welcome back!" });
            setLocation("/dashboard");
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Invalid email or password.";
            logger.error("Login failed", { error });
            toast({ title: "Login failed", description: msg, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>Sign in to your account</CardDescription>
                </CardHeader>

                <CardContent>
                    <Tabs defaultValue="email" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="email">Email</TabsTrigger>
                            <TabsTrigger value="otp">OTP</TabsTrigger>
                        </TabsList>

                        {/* Email (Sign In): Email, Password, Sign In */}
                        <TabsContent value="email">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="login-email">Email</Label>
                                    <Input
                                        id="login-email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="login-password">Password</Label>
                                    <Input
                                        id="login-password"
                                        type="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? "Signing in..." : "Sign In"}
                                </Button>
                            </form>
                        </TabsContent>

                        {/* OTP: Email or Phone → Send OTP → then Verify */}
                        <TabsContent value="otp">
                            <OTPLoginForm />
                        </TabsContent>
                    </Tabs>

                    {/* Sign in with Google — opens in a new window for Gmail */}
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t"/>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or sign in with Google
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-col items-center gap-2">
                            {googleClientId ? (
                                <>
                                    <div
                                        ref={googleButtonRef}
                                        id="google-button-container"
                                        className="min-h-[44px] flex items-center justify-center"
                                        aria-label="Sign in with Google — opens in a new window"
                                    />
                                    <p className="text-xs text-muted-foreground text-center max-w-[320px]">
                                        A new window will open so you can sign in with your Gmail account.
                                    </p>
                                </>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full max-w-[320px]"
                                    onClick={() =>
                                        toast({
                                            title: "Google sign-in not configured",
                                            description: "Add VITE_GOOGLE_CLIENT_ID to your frontend .env (same value as backend GOOGLE_CLIENT_ID).",
                                            variant: "destructive",
                                        })
                                    }
                                >
                                    Continue with Google (not configured)
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 text-center text-sm">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="text-primary hover:underline">
                            Sign up
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
