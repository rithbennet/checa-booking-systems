import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { auth } from "@/shared/server/auth";
import { auth as betterAuth } from "@/shared/server/better-auth";
import { Button } from "@/shared/ui/shadcn/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/ui/shadcn/card";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";

// Server actions for authentication
async function login(formData: FormData) {
    "use server";
    const emailEntry = formData.get("email");
    const passwordEntry = formData.get("password");
    const email = typeof emailEntry === "string" ? emailEntry : "";
    const password = typeof passwordEntry === "string" ? passwordEntry : "";

    try {
        // Get headers for Better Auth to set cookies
        const headersList = await headers();
        const result = await betterAuth.api.signInEmail({
            body: {
                email,
                password,
            },
            headers: headersList,
        });

        // Better Auth's signInEmail returns { token, user } directly, not wrapped in data
        if (result.user && result.token) {
            // Better Auth should have set the cookie via headers
            redirect("/dashboard");
        } else {
            console.error("Sign in failed: No user or token returned");
            redirect("/signIn?error=Invalid credentials");
        }
    } catch (error) {
        console.error("Sign in error:", error);
        redirect("/signIn?error=Invalid credentials");
    }
}

async function loginWithGoogle() {
    "use server";
    const result = await betterAuth.api.signInSocial({
        body: {
            provider: "google",
            callbackURL: "/dashboard",
        },
    });

    if (result.url) {
        redirect(result.url);
    } else {
        redirect("/signIn?error=Social sign in failed");
    }
}

export default async function LoginPage({
    searchParams,
}: {
    // Next.js 15 PageProps: searchParams is a Promise in RSC
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
    const session = await auth();
    if (session?.user) redirect("/dashboard");

    const sp: Record<string, string | string[] | undefined> = searchParams
        ? await searchParams
        : {};
    const errorParam = sp.error;
    const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;
    const errorMessage = mapAuthError(error);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Main */}
            <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
                <Card className="shadow-lg">
                    <CardHeader className="text-center">
                        <CardTitle className="font-bold text-2xl text-gray-900">
                            Sign in to your account
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            Access the ChECA Lab Service Booking System
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {errorMessage ? (
                            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
                                {errorMessage}
                            </div>
                        ) : null}

                        <form action={login} className="space-y-4">
                            <div className="space-y-2">
                                <Label
                                    className="font-medium text-gray-700 text-sm"
                                    htmlFor="email"
                                >
                                    Email
                                </Label>
                                <Input
                                    autoComplete="email"
                                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    id="email"
                                    name="email"
                                    required
                                    type="email"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label
                                    className="font-medium text-gray-700 text-sm"
                                    htmlFor="password"
                                >
                                    Password
                                </Label>
                                <Input
                                    autoComplete="current-password"
                                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    id="password"
                                    name="password"
                                    required
                                    type="password"
                                />
                            </div>
                            <Button
                                className="h-12 w-full bg-blue-600 text-base hover:bg-blue-700"
                                type="submit"
                            >
                                Sign in
                            </Button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-gray-200 border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-500">or</span>
                            </div>
                        </div>

                        <form action={loginWithGoogle}>
                            <Button
                                className="h-12 w-full border-gray-300 text-base transition-colors hover:border-blue-400 hover:bg-blue-50"
                                variant="outline"
                            >
                                <FcGoogle />
                                Sign in with Google
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

function mapAuthError(error?: string) {
    if (!error) return "";
    // Align with messages thrown in Credentials authorize()
    switch (error) {
        case "CredentialsSignin":
        case "Invalid credentials":
            return "Invalid email or password.";
        case "Your account is pending admin approval.":
            return "Your account is pending admin approval. You can browse the app but cannot submit bookings yet.";
        case "Your account is not active.":
            return "Your account is not active.";
        default:
            return "Unable to sign in. Please try again.";
    }
}
