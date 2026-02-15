import {useEffect, useState} from "react";
import {Link, useLocation} from "wouter";
import {Navbar} from "@/components/layout";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {useAuth} from "@/hooks/useAuth";
import {useToast} from "@/hooks/use-toast";
import {apiRequest} from "@/lib/queryClient";
import {API} from "@/lib/api";

type UserMe = {
    id: number;
    username: string;
    full_name: string | null;
    email: string | null;
    role: string;
    bio: string | null;
    avatar_url: string | null;
    profession: string | null;
    interests: string | null;
};

export default function Profile() {
    const [, setLocation] = useLocation();
    const {toast} = useToast();
    const {isAuthenticated} = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<UserMe | null>(null);
    const [fullName, setFullName] = useState("");
    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [profession, setProfession] = useState("");
    const [interests, setInterests] = useState("");

    useEffect(() => {
        if (!isAuthenticated) {
            setLocation("/login");
            return;
        }
        (async () => {
            try {
                const res = await apiRequest("GET", API.auth.me);
                const data = (await res.json()) as UserMe;
                setUser(data);
                setFullName(data.full_name ?? "");
                setBio(data.bio ?? "");
                setAvatarUrl(data.avatar_url ?? "");
                setProfession(data.profession ?? "");
                setInterests(data.interests ?? "");
            } catch {
                setLocation("/login");
            } finally {
                setLoading(false);
            }
        })();
    }, [isAuthenticated, setLocation]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await apiRequest("PUT", API.auth.updateMe, {
                full_name: fullName || null,
                bio: bio || null,
                avatar_url: avatarUrl || null,
                profession: profession || null,
                interests: interests || null,
            });
            toast({
                title: "Profile updated",
                description: "Your profile has been saved.",
            });
        } catch (e: any) {
            toast({
                title: "Update failed",
                description: e?.message ?? "Could not update profile.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar/>
                <div className="container mx-auto px-4 py-8">
                    <p className="text-muted-foreground">Loading profile…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar/>
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>
                            Add your details: about, interests, profile image, and profession.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full name</Label>
                                <Input
                                    id="full_name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Your name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="avatar_url">Profile image URL</Label>
                                <Input
                                    id="avatar_url"
                                    type="url"
                                    value={avatarUrl}
                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                    placeholder="https://..."
                                />
                                {avatarUrl && (
                                    <div className="mt-2">
                                        <img
                                            src={avatarUrl}
                                            alt="Avatar preview"
                                            className="h-20 w-20 rounded-full object-cover border"
                                            onError={(e) => (e.currentTarget.style.display = "none")}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="profession">Profession</Label>
                                <Input
                                    id="profession"
                                    value={profession}
                                    onChange={(e) => setProfession(e.target.value)}
                                    placeholder="e.g. Software Engineer, Designer"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bio">About</Label>
                                <textarea
                                    id="bio"
                                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="A short bio about you"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="interests">Interests</Label>
                                <textarea
                                    id="interests"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={interests}
                                    onChange={(e) => setInterests(e.target.value)}
                                    placeholder="e.g. Web dev, Python, Open source"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={saving}>
                                    {saving ? "Saving…" : "Save profile"}
                                </Button>
                                <Link href="/dashboard">
                                    <Button type="button" variant="outline">
                                        Back to dashboard
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
