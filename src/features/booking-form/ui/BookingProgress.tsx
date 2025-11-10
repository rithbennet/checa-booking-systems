"use client";

import type { BookingStep } from "@/entities/booking";

interface BookingProgressProps {
	steps: BookingStep[];
}

export function BookingProgress({ steps }: BookingProgressProps) {
	return (
		<div className="mb-8">
			<div className="flex items-center justify-between">
				{steps.map((step, index) => (
					<div className="flex flex-1 items-center" key={step.number}>
						<div className="flex items-center">
							<div
								className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
									step.status === "completed"
										? "border-green-500 bg-green-500 text-white"
										: step.status === "current"
											? "border-blue-500 bg-blue-500 text-white"
											: "border-gray-300 bg-white text-gray-500"
								}`}
							>
								{step.status === "completed" ? "✓" : step.number}
							</div>
							<div className="ml-3">
								<p
									className={`font-medium text-sm ${step.status === "current" ? "text-blue-600" : "text-gray-500"}`}
								>
									Step {step.number}
								</p>
								<p
									className={`text-xs ${step.status === "current" ? "text-blue-600" : "text-gray-500"}`}
								>
									{step.title}
								</p>
							</div>
						</div>
						{index < steps.length - 1 && (
							<div
								className={`mx-4 h-0.5 flex-1 ${step.status === "completed" ? "bg-green-500" : "bg-gray-300"}`}
							/>
						)}
					</div>
				))}
			</div>
		</div>
	);
}

