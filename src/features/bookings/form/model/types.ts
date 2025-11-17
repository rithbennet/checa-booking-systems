/**
 * Booking Form feature types
 */

import type { BookingServiceItem, BookingStep } from "@/entities/booking";
import type { InvoiceProfile } from "@/entities/invoice";

export type InstitutionalAcademicType = "student" | "staff" | "none";

export interface BookingProfile extends InvoiceProfile {
  academicType?: InstitutionalAcademicType | null;
}

export interface BookingFormState {
  currentStep: number;
  steps: BookingStep[];
  selectedServices: BookingServiceItem[];
  projectDescription?: string;
  preferredStartDate?: Date;
  preferredEndDate?: Date;
  additionalNotes?: string;
  isSubmitting: boolean;
  errors: Record<string, string>;
}

export interface ServiceDetailsFormData {
  sampleType?: string;
  quantity?: number;
  sampleDetails?: string;
  sampleHazard?: string;
  testingMethod?: string;
  temperatureControlled?: boolean;
  lightSensitive?: boolean;
  hazardousMaterial?: boolean;
  inertAtmosphere?: boolean;
  technicalRequirements?: string;
  startDate?: Date;
  endDate?: Date;
  preferredTimeSlot?: string;
  deadlineRequirements?: string;
  fumeHood?: boolean;
  analyticalBalance?: boolean;
  heatingEquipment?: boolean;
  magneticStirrer?: boolean;
  rotaryEvaporator?: boolean;
  vacuumSystem?: boolean;
  otherEquipmentRequirements?: string;
}
