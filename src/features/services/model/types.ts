/**
 * Browse Services feature types
 */

import type { Service, ServiceFilters, UserType } from "@/entities/service";

export interface BrowseServicesState {
  services: Service[];
  filters: ServiceFilters;
  loading: boolean;
  error: string | null;
  userType: UserType | null;
}

export interface ServiceCardProps {
  service: Service;
  userType: UserType;
  onViewDetails: (serviceId: string) => void;
}
