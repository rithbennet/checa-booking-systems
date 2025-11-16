"use client";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
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

    const [isNavigating, setIsNavigating] = useState(false);
    const mountedRef = useRef(true);

    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
        // Forward any provided onClick handler
        if (typeof props.onClick === "function") {
            (props.onClick as (e: MouseEvent<HTMLButtonElement>) => void)(e);
        }

        // If the click handler prevented default, or the button was already disabled, don't navigate
        if (e.defaultPrevented || props.disabled) return;

        setIsNavigating(true);
        try {
            // router.push may return a Promise in some Next versions.
            // Awaiting a non-promise value is a no-op, so cast to Promise<void> to handle both cases.
            await (router.push(href) as unknown as Promise<void>);
        } finally {
            if (mountedRef.current) {
                setIsNavigating(false);
            }
        }
    };

    return (
        <Button
            {...props}
            disabled={props.disabled || isNavigating}
            onClick={handleClick}
        >
            {children}
        </Button>
    );
}
