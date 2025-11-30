"use client";

import { AlertCircle, Link as LinkIcon, Loader2, Unlink } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import {
    type LinkedAccount,
    useLinkedAccounts,
    useLinkSocialAccount,
    useUnlinkAccount,
} from "@/entities/user";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/shared/ui/shadcn/alert-dialog";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/ui/shadcn/card";

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function getProviderIcon(provider: string) {
    switch (provider) {
        case "google":
            return <FcGoogle className="size-5" />;
        default:
            return <LinkIcon className="size-5" />;
    }
}

function getProviderName(provider: string): string {
    switch (provider) {
        case "google":
            return "Google";
        case "credential":
            return "Email & Password";
        default:
            return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
}

export function LinkedAccountsCard() {
    const searchParams = useSearchParams();
    const { data: accounts, isLoading, error, refetch } = useLinkedAccounts();
    const linkAccount = useLinkSocialAccount();
    const unlinkAccount = useUnlinkAccount();

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [unlinkingAccount, setUnlinkingAccount] =
        useState<LinkedAccount | null>(null);

    // Check for success message from OAuth callback
    useEffect(() => {
        if (searchParams.get("linked") === "success") {
            setSuccessMessage("Account linked successfully!");
            refetch(); // Refresh the accounts list
            // Clear the URL param after showing the message
            const timeout = setTimeout(() => {
                setSuccessMessage(null);
                window.history.replaceState({}, "", "/profile");
            }, 3000);
            return () => clearTimeout(timeout);
        }
    }, [searchParams, refetch]);

    const handleLinkGoogle = () => {
        linkAccount.mutate("google");
    };

    const handleUnlink = (account: LinkedAccount) => {
        setUnlinkingAccount(account);
    };

    const confirmUnlink = () => {
        if (unlinkingAccount) {
            unlinkAccount.mutate(unlinkingAccount.provider, {
                onSuccess: () => {
                    setSuccessMessage("Account unlinked successfully!");
                    setUnlinkingAccount(null);
                    setTimeout(() => setSuccessMessage(null), 3000);
                },
                onError: (error) => {
                    console.error("Failed to unlink account:", error);
                    setUnlinkingAccount(null);
                },
            });
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Linked Accounts</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Linked Accounts</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                    <AlertCircle className="size-6" />
                    <p className="text-sm">Failed to load linked accounts</p>
                </CardContent>
            </Card>
        );
    }

    const hasGoogleLinked = accounts?.some((acc) => acc.provider === "google");
    // An account can only be unlinked if there's more than one account
    const canUnlink = accounts && accounts.length > 1;

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Linked Accounts</CardTitle>
                    <CardDescription>
                        Connect additional sign-in methods to your account
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {successMessage && (
                        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-green-700 text-sm">
                            {successMessage}
                        </div>
                    )}

                    {/* Connected accounts */}
                    {accounts && accounts.length > 0 && (
                        <div className="space-y-3">
                            {accounts.map((account) => (
                                <div
                                    className="flex items-center justify-between rounded-lg border p-3"
                                    key={account.id}
                                >
                                    <div className="flex items-center gap-3">
                                        {getProviderIcon(account.provider)}
                                        <div>
                                            <p className="font-medium text-sm">
                                                {getProviderName(account.provider)}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                Connected on {formatDate(account.linkedAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">Connected</Badge>
                                        {canUnlink && account.provider !== "credential" && (
                                            <Button
                                                disabled={unlinkAccount.isPending}
                                                onClick={() => handleUnlink(account)}
                                                size="sm"
                                                variant="ghost"
                                            >
                                                {unlinkAccount.isPending ? (
                                                    <Loader2 className="size-4 animate-spin" />
                                                ) : (
                                                    <Unlink className="size-4" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Link Google button if not already linked */}
                    {!hasGoogleLinked && (
                        <div className="rounded-lg border border-dashed p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FcGoogle className="size-5" />
                                    <div>
                                        <p className="font-medium text-sm">Google</p>
                                        <p className="text-muted-foreground text-xs">
                                            Sign in with your Google account
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    disabled={linkAccount.isPending}
                                    onClick={handleLinkGoogle}
                                    size="sm"
                                    variant="outline"
                                >
                                    {linkAccount.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                            Linking...
                                        </>
                                    ) : (
                                        <>
                                            <LinkIcon className="mr-2 size-4" />
                                            Link Account
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {accounts && accounts.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm">
                            No accounts linked yet. Link a social account for easier sign-in.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Unlink confirmation dialog */}
            <AlertDialog
                onOpenChange={() => setUnlinkingAccount(null)}
                open={!!unlinkingAccount}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unlink Account?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to unlink your{" "}
                            {unlinkingAccount && getProviderName(unlinkingAccount.provider)}{" "}
                            account? You won't be able to use it to sign in anymore.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmUnlink}>
                            Unlink
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
