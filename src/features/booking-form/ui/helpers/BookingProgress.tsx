"use client";

import type { BookingStep } from "@/entities/booking";

interface BookingProgressProps {
	steps: BookingStep[];
	currentStep?: number;
	onStepClick?: (stepNumber: number) => void;
}

export function BookingProgress({
	steps,
	currentStep,
	onStepClick,
}: BookingProgressProps) {
	return (
		<div className="mb-8">
			<div className="flex items-center justify-between">
				{steps.map((step, index) => (
					<div className="flex flex-1 items-center" key={step.number}>
						<div className="flex items-center">
							{(() => {
								const isClickable =
									typeof currentStep === "number" &&
									step.number < currentStep &&
									!!onStepClick;
								const circle = (
									<div
										className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${step.status === "completed"
											? "border-green-500 bg-green-500 text-white"
											: step.status === "current"
												? "border-blue-500 bg-blue-500 text-white"
												: "border-gray-300 bg-white text-gray-500"
											}`}
									>
										{step.status === "completed" ? "✓" : step.number}
									</div>
								);
								const labels = (
									<div className="ml-3 text-left">
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
								);
								if (isClickable) {
									return (
										<button
											aria-label={`Go to Step ${step.number}: ${step.title}`}
											className="flex items-center rounded-md transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
											onClick={() => onStepClick?.(step.number)}
											type="button"
										>
											{circle}
											{labels}
										</button>
									);
								}
								return (
									<div className="flex items-center">
										{circle}
										{labels}
									</div>
								);
							})()}
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
