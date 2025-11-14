"use client";

import type { UseFormReturn } from "react-hook-form";
import type { CreateBookingInput } from "@/entities/booking/model/schemas";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/ui/shadcn/card";
import { Label } from "@/shared/ui/shadcn/label";
import { Textarea } from "@/shared/ui/shadcn/textarea";

interface ProjectInfoStepProps {
    form: UseFormReturn<CreateBookingInput>;
}

export function ProjectInfoStep({ form }: ProjectInfoStepProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Project Information</CardTitle>
                <CardDescription>
                    Provide details about your project and any additional requirements
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Project Description */}
                <div className="space-y-3">
                    <Label
                        className="font-medium text-gray-700 text-sm"
                        htmlFor="project-description"
                    >
                        Project Description (Optional)
                    </Label>
                    <Textarea
                        className="border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                        id="project-description"
                        {...form.register("projectDescription")}
                        placeholder="Briefly describe your project, research objectives, or intended use of the services..."
                        rows={5}
                    />
                    <p className="text-gray-500 text-xs">
                        This helps our team better understand your requirements and provide
                        appropriate support.
                    </p>
                </div>

                {/* Additional Notes */}
                <div className="space-y-3">
                    <Label
                        className="font-medium text-gray-700 text-sm"
                        htmlFor="additional-notes"
                    >
                        Additional Notes/Special Instructions (Optional)
                    </Label>
                    <Textarea
                        className="border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                        id="additional-notes"
                        {...form.register("additionalNotes")}
                        placeholder="Any additional information, special instructions, safety considerations, or requirements not covered above..."
                        rows={5}
                    />
                    <p className="text-gray-500 text-xs">
                        Include any specific requirements, deadlines, safety considerations,
                        or special arrangements needed for your services.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
