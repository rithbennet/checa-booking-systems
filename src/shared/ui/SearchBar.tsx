"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/shared/ui/shadcn/input";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
    showSearchIcon?: boolean;
}

export function SearchBar({
    value,
    onChange,
    placeholder = "Search...",
    autoFocus = false,
    showSearchIcon = false,
}: SearchBarProps) {
    return (
        <div
            className={
                showSearchIcon ? "relative max-w-md flex-1" : "relative flex-1"
            }
        >
            {showSearchIcon && (
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
            )}
            <Input
                autoFocus={autoFocus}
                className={showSearchIcon ? "pl-9" : undefined}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                type="search"
                value={value}
            />
            {value && (
                <button
                    aria-label="Clear search"
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

export default SearchBar;
