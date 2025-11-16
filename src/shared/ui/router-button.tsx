"use client";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useState } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/shared/lib/utils";
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

    const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
        // Forward any provided onClick handler
        if (typeof props.onClick === "function") {
            (props.onClick as (e: MouseEvent<HTMLButtonElement>) => void)(e);
        }

        // If the click handler prevented default, or the button was already disabled, don't navigate
        if (e.defaultPrevented || props.disabled) return;

        // Force React to apply the disabled state before triggering navigation
        flushSync(() => {
            setIsNavigating(true);
        });

        // Trigger navigation (no need to await; this component will likely unmount)
        router.push(href);
    };

    const { className, ...rest } = props;

    return (
        <Button
            {...rest}
            className={cn(
                className,
                (isNavigating || props.disabled) && "opacity-60",
            )}
            disabled={props.disabled || isNavigating}
            onClick={handleClick}
        >
            {children}
        </Button>
    );
}
