import { redirect } from "next/navigation";
import { SignInForm } from "@/features/authentication";
import { auth } from "@/shared/server/auth";

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

    return <SignInForm error={error} />;
}
