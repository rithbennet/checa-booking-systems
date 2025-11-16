"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AccordionContentNoAutoClose,
    AccordionItemNoAutoClose,
    AccordionNoAutoClose,
    AccordionTriggerNoAutoClose,
} from "@/shared/ui/shadcn/accordion-no-auto-close";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/shared/ui/shadcn/alert-dialog";

type ServiceSampleIssues = { sampleIndex: number; issues: string[] };
type ServiceIssuesGroup = {
    serviceId: string;
    serviceName: string;
    issuesBySample: ServiceSampleIssues[];
};
type WorkspaceIssues = { slotIndex: number; issues: string[] };

interface ServicesValidationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data?: { services?: ServiceIssuesGroup[]; workspaces?: WorkspaceIssues[] };
}

export function ServicesValidationDialog({
    open,
    onOpenChange,
    data,
}: ServicesValidationDialogProps) {
    const services = data?.services ?? [];
    const workspaces = data?.workspaces ?? [];

    // Auto-expand: compute all ids to be opened by default when dialog opens
    const allServiceIds = useMemo(
        () => services.map((g) => g.serviceId),
        [services],
    );
    const samplesByService = useMemo<Record<string, string[]>>(() => {
        const map: Record<string, string[]> = {};
        services.forEach((group) => {
            map[group.serviceId] = group.issuesBySample.map((s) => `${group.serviceId}-${s.sampleIndex}`);
        });
        return map;
    }, [services]);
    const allWorkspaceKeys = useMemo(
        () => workspaces.map((w) => `workspace-${w.slotIndex}`),
        [workspaces],
    );

    const [openServices, setOpenServices] = useState<string[]>([]);
    const [openSamples, setOpenSamples] = useState<Record<string, string[]>>({});
    const [openWorkspaces, setOpenWorkspaces] = useState<string[]>([]);

    useEffect(() => {
        if (open) {
            setOpenServices(allServiceIds);
            setOpenSamples(samplesByService);
            setOpenWorkspaces(["workspaces", ...allWorkspaceKeys]);
        }
    }, [open, allServiceIds, allWorkspaceKeys, samplesByService]);

    return (
        <AlertDialog onOpenChange={onOpenChange} open={open}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Incomplete service details</AlertDialogTitle>
                    <AlertDialogDescription>
                        Please fill the required fields before continuing.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div>
                    <AccordionNoAutoClose
                        className="w-full"
                        onValueChange={(v) => setOpenServices(Array.isArray(v) ? v : [])}
                        type="multiple"
                        value={openServices}
                    >
                        {services.map((group) => (
                            <AccordionItemNoAutoClose
                                className="border-0"
                                key={group.serviceId}
                                value={group.serviceId}
                            >
                                <div className="px-2 py-2">
                                    <AccordionTriggerNoAutoClose className="flex items-center justify-between hover:no-underline">
                                        <span className="font-medium">{group.serviceName}</span>
                                    </AccordionTriggerNoAutoClose>
                                    <AccordionContentNoAutoClose>
                                        <AccordionNoAutoClose
                                            className="w-full"
                                            onValueChange={(v) =>
                                                setOpenSamples((prev) => ({
                                                    ...prev,
                                                    [group.serviceId]: Array.isArray(v)
                                                        ? (v as string[])
                                                        : [],
                                                }))
                                            }
                                            type="multiple"
                                            value={openSamples[group.serviceId] ?? []}
                                        >
                                            {group.issuesBySample.map((s) => (
                                                <AccordionItemNoAutoClose
                                                    className="border-0"
                                                    key={`${group.serviceId}-${s.sampleIndex}`}
                                                    value={`${group.serviceId}-${s.sampleIndex}`}
                                                >
                                                    <div className="px-2 py-1">
                                                        <AccordionTriggerNoAutoClose className="flex items-center justify-between hover:no-underline">
                                                            <span>Sample {s.sampleIndex}</span>
                                                        </AccordionTriggerNoAutoClose>
                                                        <AccordionContentNoAutoClose>
                                                            <ul className="list-disc pl-5">
                                                                {s.issues.map((issue, i) => (
                                                                    <li
                                                                        key={`${group.serviceId}-${s.sampleIndex}-${i}`}
                                                                    >
                                                                        {issue}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </AccordionContentNoAutoClose>
                                                    </div>
                                                </AccordionItemNoAutoClose>
                                            ))}
                                        </AccordionNoAutoClose>
                                    </AccordionContentNoAutoClose>
                                </div>
                            </AccordionItemNoAutoClose>
                        ))}

                        {workspaces.length ? (
                            <AccordionItemNoAutoClose className="border-0" value="workspaces">
                                <div className="px-2 py-2">
                                    <AccordionTriggerNoAutoClose className="flex items-center justify-between hover:no-underline">
                                        <span className="font-medium">Workspace Bookings</span>
                                    </AccordionTriggerNoAutoClose>
                                    <AccordionContentNoAutoClose>
                                        <AccordionNoAutoClose
                                            className="w-full"
                                            onValueChange={(v) =>
                                                setOpenWorkspaces(
                                                    Array.isArray(v) ? (v as string[]) : [],
                                                )
                                            }
                                            type="multiple"
                                            value={openWorkspaces}
                                        >
                                            {workspaces.map((w) => (
                                                <AccordionItemNoAutoClose
                                                    className="border-0"
                                                    key={`workspace-${w.slotIndex}`}
                                                    value={`workspace-${w.slotIndex}`}
                                                >
                                                    <div className="px-2 py-1">
                                                        <AccordionTriggerNoAutoClose className="flex items-center justify-between hover:no-underline">
                                                            <span>Slot {w.slotIndex}</span>
                                                        </AccordionTriggerNoAutoClose>
                                                        <AccordionContentNoAutoClose>
                                                            <ul className="list-disc pl-5">
                                                                {w.issues.map((issue, i) => (
                                                                    <li key={`workspace-${w.slotIndex}-${i}`}>
                                                                        {issue}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </AccordionContentNoAutoClose>
                                                    </div>
                                                </AccordionItemNoAutoClose>
                                            ))}
                                        </AccordionNoAutoClose>
                                    </AccordionContentNoAutoClose>
                                </div>
                            </AccordionItemNoAutoClose>
                        ) : null}
                    </AccordionNoAutoClose>
                </div>

                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => onOpenChange(false)}>
                        Review
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
