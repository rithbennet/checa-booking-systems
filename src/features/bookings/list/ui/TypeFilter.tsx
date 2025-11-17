"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/shadcn/select";

type BookingType = "all" | "analysis_only" | "working_space";

interface TypeFilterProps {
    value: BookingType;
    onChange: (value: BookingType) => void;
}

export function TypeFilter({ value, onChange }: TypeFilterProps) {
    return (
        <div className="flex items-center gap-3">
            <span className="font-medium text-muted-foreground text-sm">Type:</span>
            <Select onValueChange={onChange} value={value}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">
                        <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-blue-500" />
                            <span>All Types</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="analysis_only">
                        <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-purple-500" />
                            <span>Analysis Only</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="working_space">
                        <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-green-500" />
                            <span>With Workspace</span>
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
