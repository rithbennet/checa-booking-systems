"use client";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { Button } from "@/shared/ui/shadcn/button";

type RouterButtonProps = React.ComponentProps<typeof Button> & {
    href: string;
};

export default function RouterButton({
    href,
    children,
    ...props
}: RouterButtonProps) {
    const router = useRouter();

    return (
        <Button
            {...props}
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
                // Forward any provided onClick handler
                if (typeof props.onClick === "function") {
                    (props.onClick as (e: MouseEvent<HTMLButtonElement>) => void)(e);
                }
                router.push(href);
            }}
        >
            {children}
        </Button>
    );
}
