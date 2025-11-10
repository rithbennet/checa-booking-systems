"use client";

import { Card, CardContent, CardHeader } from "@/shared/ui/shadcn/card";
import { Skeleton } from "@/shared/ui/shadcn/skeleton";

export function ServicesPageSkeleton() {
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
					{/* Filters Sidebar Skeleton */}
					<div className="lg:col-span-1">
						<Card>
							<CardHeader>
								<Skeleton className="h-6 w-32" />
							</CardHeader>
							<CardContent className="space-y-6">
								{/* Search skeleton */}
								<div>
									<Skeleton className="mb-2 h-4 w-16" />
									<Skeleton className="h-10 w-full" />
								</div>

								{/* Category filter skeleton */}
								<div>
									<Skeleton className="mb-2 h-4 w-24" />
									<Skeleton className="h-10 w-full" />
								</div>

								{/* Price range skeleton */}
								<div>
									<Skeleton className="mb-2 h-4 w-32" />
									<Skeleton className="h-2 w-full" />
								</div>

								{/* Availability filter skeleton */}
								<div>
									<Skeleton className="mb-2 h-4 w-20" />
									<Skeleton className="h-10 w-full" />
								</div>
							</CardContent>
						</Card>

						{/* User Rate Info Skeleton */}
						<Card className="mt-6 border-blue-200 bg-blue-50">
							<div className="p-4">
								<Skeleton className="h-6 w-24" />
								<div className="mt-2 flex items-center space-x-2">
									<Skeleton className="h-6 w-32" />
								</div>
								<Skeleton className="mt-2 h-4 w-full" />
							</div>
						</Card>
					</div>

					{/* Services Grid Skeleton */}
					<div className="lg:col-span-3">
						{/* Header skeleton */}
						<div className="mb-6 flex items-center justify-between">
							<div>
								<Skeleton className="mb-2 h-8 w-64" />
								<Skeleton className="h-4 w-32" />
							</div>
							<Skeleton className="h-10 w-32" />
						</div>

						{/* Service cards skeleton */}
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							{Array.from(
								{ length: 6 },
								(_, index) => `skeleton-card-${index}`,
							).map((id) => (
								<Card className="transition-shadow" key={id}>
									<CardHeader>
										<div className="flex items-start justify-between">
											<div className="flex items-center space-x-3">
												<Skeleton className="h-10 w-10 rounded-lg" />
												<div className="flex-1">
													<Skeleton className="mb-2 h-5 w-3/4" />
													<Skeleton className="h-4 w-1/2" />
												</div>
											</div>
											<Skeleton className="h-6 w-20 rounded-full" />
										</div>
									</CardHeader>
									<CardContent>
										{/* Description skeleton */}
										<Skeleton className="mb-4 h-4 w-full" />
										<Skeleton className="mb-4 h-4 w-5/6" />

										<div className="space-y-3">
											{/* Category skeleton */}
											<div className="flex items-center justify-between">
												<Skeleton className="h-4 w-16" />
												<Skeleton className="h-5 w-24 rounded-full" />
											</div>

											{/* Pricing skeleton */}
											<div className="rounded-lg bg-blue-50 p-3">
												<div className="flex items-center justify-between">
													<Skeleton className="h-4 w-32" />
													<div className="text-right">
														<Skeleton className="mb-1 h-6 w-20" />
														<Skeleton className="h-4 w-24" />
													</div>
												</div>
											</div>
										</div>

										{/* Buttons skeleton */}
										<div className="mt-4 flex items-center space-x-2">
											<Skeleton className="h-10 flex-1" />
											<Skeleton className="h-10 flex-1" />
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
