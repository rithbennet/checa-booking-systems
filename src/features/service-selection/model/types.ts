/**
 * Service Selection feature types
 */

import type { Service, UserType } from "@/entities/service";

export interface SelectedService extends Service {
  quantity?: number;
  selectedPricing?: {
    price: number;
    unit: string;
  };
}

export interface ServiceSelectionState {
  selectedServices: SelectedService[];
  userType: UserType | null;
}
