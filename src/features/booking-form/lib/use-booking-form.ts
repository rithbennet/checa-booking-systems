/**
 * Booking form business logic hook
 * Contains all business logic for the booking form
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { type UseFormReturn, useFieldArray, useForm } from "react-hook-form";
import { toast as sonnerToast } from "sonner";
import { useCreateBooking } from "@/entities/booking/api/use-bookings";
import type {
	CreateBookingInput,
	WorkspaceBookingInput,
} from "@/entities/booking/model/schemas";
import { createBookingInputSchema } from "@/entities/booking/model/schemas";
import type { Service, UserType } from "@/entities/service";
import { getServicePrice } from "@/entities/service";
import { useBookingStore } from "../model/use-booking-store";

interface UseBookingFormOptions {
	userType: UserType;
	userStatus?: string;
	initialServices?: Array<{ service: Service; item: any }>;
}

export function useBookingForm({
	userType,
	userStatus,
	initialServices = [],
}: UseBookingFormOptions): {
	form: UseFormReturn<CreateBookingInput>;
	fields: Array<CreateBookingInput["serviceItems"][0] & { id: string }>;
	workspaceFields: Array<
		CreateBookingInput["workspaceBookings"][0] & { id: string }
	>;
	isBlocked: boolean;
	currentStep: number;
	isServiceDialogOpen: boolean;
	selectedServiceIds: string[];
	handleAddService: (service: Service) => void;
	handleAddSample: (serviceId: string) => void;
	handleAddWorkspace: () => void;
	handleRemoveService: (index: number) => void;
	handleRemoveServiceGroup: (serviceId: string) => void;
	handleRemoveWorkspace: (index: number) => void;
	handleServiceUpdate: (
		index: number,
		data: Partial<CreateBookingInput["serviceItems"][0]>,
	) => void;
	handleWorkspaceUpdate: (
		index: number,
		data: Partial<WorkspaceBookingInput>,
	) => void;
	handleSaveDraft: () => void;
	onSubmit: (data: CreateBookingInput) => Promise<void>;
	getServiceForField: (serviceId: string) => Service | undefined;
	setServiceDialogOpen: (open: boolean) => void;
	setCurrentStep: (step: number) => void;
	isSubmitting: boolean;
} {
	const {
		formData: storeFormData,
		servicesMap,
		isServiceDialogOpen,
		currentStep,
		setFormData,
		addService: addServiceToStore,
		removeService: removeServiceFromStore,
		updateServiceItem: updateServiceItemInStore,
		setServiceDialogOpen,
		setCurrentStep,
		clearDraft,
		getService,
	} = useBookingStore();

	const createBookingMutation = useCreateBooking();

	// Initialize services map from initial services
	useEffect(() => {
		if (initialServices.length > 0) {
			const currentMap = useBookingStore.getState().servicesMap;
			const map = new Map(currentMap);
			initialServices.forEach(({ service }) => {
				map.set(service.id, service);
			});
			useBookingStore.setState({ servicesMap: map });
		}
	}, [initialServices]);

	// Initialize form with React Hook Form
	const form = useForm<CreateBookingInput>({
		resolver: zodResolver(createBookingInputSchema),
		defaultValues: {
			serviceItems:
				storeFormData.serviceItems && storeFormData.serviceItems.length > 0
					? storeFormData.serviceItems
					: initialServices.map(({ item }) => ({
							serviceId: item.serviceId,
							quantity: item.quantity ?? 1,
							durationMonths: item.durationMonths ?? 0,
							sampleType: item.sampleType,
							sampleDetails: item.sampleDetails,
							testingMethod: item.testingMethod,
							samplePreparation: item.samplePreparation,
							temperatureControlled: item.temperatureControlled ?? false,
							lightSensitive: item.lightSensitive ?? false,
							hazardousMaterial: item.hazardousMaterial ?? false,
							inertAtmosphere: item.inertAtmosphere ?? false,
							equipmentIds: item.equipmentIds ?? [],
							otherEquipmentRequests: item.otherEquipmentRequests ?? [],
							addOnIds: item.addOnIds ?? [],
						})),
			workspaceBookings: storeFormData.workspaceBookings || [],
			projectDescription: storeFormData.projectDescription || "",
			additionalNotes: storeFormData.additionalNotes || "",
		},
	});

	const { fields, append, remove, update } = useFieldArray({
		control: form.control,
		name: "serviceItems",
	});

	const {
		fields: workspaceFields,
		append: appendWorkspace,
		remove: removeWorkspace,
		update: updateWorkspace,
	} = useFieldArray({
		control: form.control,
		name: "workspaceBookings",
	});

	// Sync form with store
	useEffect(() => {
		if (storeFormData.serviceItems && storeFormData.serviceItems.length > 0) {
			form.reset({
				...storeFormData,
				serviceItems: storeFormData.serviceItems,
			} as CreateBookingInput);
		}
	}, [form.reset, storeFormData]);

	// Auto-save draft every 30 seconds
	useEffect(() => {
		const interval = setInterval(() => {
			const formData = form.getValues();
			if (formData.serviceItems && formData.serviceItems.length > 0) {
				setFormData(formData);
			}
		}, 30000); // 30 seconds

		return () => clearInterval(interval);
	}, [form, setFormData]);

	const isBlocked =
		userStatus === "pending" ||
		userStatus === "inactive" ||
		userStatus === "rejected";

	const handleAddService = (service: Service) => {
		const pricing = getServicePrice(service, userType);
		if (!pricing) {
			sonnerToast.error("Error", {
				description: "Pricing not available for this service.",
			});
			return;
		}

		// Add to store
		addServiceToStore(service);

		// Add to form - each service item represents one sample or one workspace slot
		const isWorkingSpace = service.category === "working_space";
		const defaultItem: CreateBookingInput["serviceItems"][0] = {
			serviceId: service.id,
			quantity: isWorkingSpace ? 0 : 1,
			durationMonths: isWorkingSpace ? 1 : 0,
			sampleName: undefined,
			temperatureControlled: false,
			lightSensitive: false,
			hazardousMaterial: false,
			inertAtmosphere: false,
			equipmentIds: [],
			otherEquipmentRequests: [],
			addOnIds: [],
			// For workspace: initialize with current date as start, and 1 month later as end
			...(isWorkingSpace
				? {
						expectedCompletionDate: new Date(),
						notes: `START_DATE:${new Date().toISOString()}||END_DATE:${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}`,
					}
				: {}),
		};

		append(defaultItem);
		sonnerToast.success("Service added", {
			description: `${service.name} has been added to your booking.`,
		});
	};

	const handleAddSample = (serviceId: string) => {
		// Find the service
		let service = getService(serviceId);

		// If service not in map, try to find it from initialServices
		if (!service && initialServices.length > 0) {
			const found = initialServices.find(
				({ service: s }) => s.id === serviceId,
			);
			if (found) {
				service = found.service;
				// Add to store as a safeguard
				addServiceToStore(service);
			}
		}

		if (!service) {
			sonnerToast.error("Error", {
				description: "Service not found.",
			});
			return;
		}

		const pricing = getServicePrice(service, userType);
		if (!pricing) {
			sonnerToast.error("Error", {
				description: "Pricing not available for this service.",
			});
			return;
		}

		// Ensure service is in the map
		if (!getService(serviceId)) {
			addServiceToStore(service);
		}

		const isWorkingSpace = service.category === "working_space";

		// Add a new service item for this sample/slot (same service, different sample/slot)
		const defaultItem: CreateBookingInput["serviceItems"][0] = {
			serviceId: service.id,
			quantity: isWorkingSpace ? 0 : 1,
			durationMonths: isWorkingSpace ? 1 : 0,
			sampleName: undefined,
			temperatureControlled: false,
			lightSensitive: false,
			hazardousMaterial: false,
			inertAtmosphere: false,
			equipmentIds: [],
			otherEquipmentRequests: [],
			addOnIds: [],
			// For workspace: initialize with current date as start, and 1 month later as end
			...(isWorkingSpace
				? {
						expectedCompletionDate: new Date(),
						notes: `START_DATE:${new Date().toISOString()}||END_DATE:${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}`,
					}
				: {}),
		};

		append(defaultItem);
		sonnerToast.success(isWorkingSpace ? "Month slot added" : "Sample added", {
			description: isWorkingSpace
				? `Another month slot for ${service.name} has been added.`
				: `Another sample for ${service.name} has been added.`,
		});
	};

	const handleRemoveService = (index: number) => {
		const field = fields[index];
		if (!field) return;

		// Check if this is the last item for this service
		const itemsForService = fields.filter(
			(f) => f.serviceId === field.serviceId,
		);
		const isLastItem = itemsForService.length === 1;

		// Remove from form
		remove(index);

		// Only remove from store if it's the last item for this service
		if (isLastItem) {
			removeServiceFromStore(field.serviceId);
		}
	};

	const handleRemoveServiceGroup = (serviceId: string) => {
		// Find all indices for this service
		const indicesToRemove = fields
			.map((field, index) => (field.serviceId === serviceId ? index : -1))
			.filter((index) => index !== -1)
			.sort((a, b) => b - a); // Sort descending to remove from end first

		// Remove all items for this service
		indicesToRemove.forEach((index) => {
			remove(index);
		});

		// Remove from store
		removeServiceFromStore(serviceId);

		sonnerToast.success("Service removed", {
			description: "All samples for this service have been removed.",
		});
	};

	const handleServiceUpdate = (
		index: number,
		data: Partial<CreateBookingInput["serviceItems"][0]>,
	) => {
		const field = fields[index];
		if (field) {
			updateServiceItemInStore(field.serviceId, data);
			update(index, {
				...form.getValues(`serviceItems.${index}`),
				...data,
			});
		}
	};

	const handleSaveDraft = () => {
		const formData = form.getValues();
		setFormData(formData);
		sonnerToast.success("Draft saved", {
			description: "Your booking has been saved as a draft.",
		});
	};

	const onSubmit = async (data: CreateBookingInput): Promise<void> => {
		try {
			const result = await createBookingMutation.mutateAsync(data);
			clearDraft();
			sonnerToast.success("Booking submitted", {
				description: `Your booking request ${result.referenceNumber} has been submitted successfully.`,
			});
			// Navigate to success page or booking list
			window.location.href = `/bookings/${result.id}`;
		} catch (error) {
			sonnerToast.error("Error", {
				description:
					error instanceof Error
						? error.message
						: "Failed to submit booking. Please try again.",
			});
		}
	};

	// Get services for form fields
	const getServiceForField = (serviceId: string): Service | undefined => {
		return getService(serviceId);
	};

	const selectedServiceIds = fields.map((field) => field.serviceId);

	const handleAddWorkspace = () => {
		const defaultWorkspace: WorkspaceBookingInput = {
			startDate: new Date(),
			endDate: new Date(),
			equipmentIds: [],
			addOnIds: [],
		};
		appendWorkspace(defaultWorkspace);
		sonnerToast.success("Workspace added", {
			description: "Workspace booking has been added to your booking.",
		});
	};

	const handleWorkspaceUpdate = (
		index: number,
		data: Partial<WorkspaceBookingInput>,
	) => {
		updateWorkspace(index, {
			...form.getValues(`workspaceBookings.${index}`),
			...data,
		});
	};

	const handleRemoveWorkspace = (index: number) => {
		removeWorkspace(index);
		sonnerToast.success("Workspace removed", {
			description: "Workspace booking has been removed.",
		});
	};

	return {
		form,
		fields,
		workspaceFields,
		isBlocked,
		currentStep,
		isServiceDialogOpen,
		selectedServiceIds,
		handleAddService,
		handleAddSample,
		handleAddWorkspace,
		handleRemoveService,
		handleRemoveServiceGroup,
		handleRemoveWorkspace,
		handleServiceUpdate,
		handleWorkspaceUpdate,
		handleSaveDraft,
		onSubmit,
		getServiceForField,
		setServiceDialogOpen,
		setCurrentStep,
		isSubmitting: createBookingMutation.isPending,
	};
}
