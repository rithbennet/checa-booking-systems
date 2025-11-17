"use client";

import { X } from "lucide-react";
import { Input } from "@/shared/ui/shadcn/input";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export function SearchBar({
    value,
    onChange,
    placeholder = "Search...",
    autoFocus = false,
}: SearchBarProps) {
    return (
        <div className="relative max-w-md flex-1">
            <Input
                autoFocus={autoFocus}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                value={value}
            />
            {value && (
                <button
                    className="-translate-y-1/2 absolute top-1/2 right-2 text-gray-400 hover:text-gray-600"
                    onClick={() => onChange("")}
                    type="button"
                >
                    <X className="size-4" />
                </button>
            )}
        </div>
    );
}
