export type BusinessCategory =
  | 'All'
  | 'Healthcare'
  | 'Salon & Spa'
  | 'Bank & Finance'
  | 'Retail'
  | 'Dining & Cafe'
  | 'Government Services'
  | 'Service Center'
  | 'Other';

export interface LocationCoordinates {
  type: 'Point';
  coordinates: [number, number];
}

export interface OperatingHours {
  open: string;
  close: string;
}

export interface ServiceItem {
  _id: string;
  branchId: string;
  name: string;
  description?: string;
  estimatedDurationMinutes: number;
  price: number;
  maxQueueCapacity: number;
  prefix: string;
  isActive: boolean;
}

export interface Branch {
  _id: string;
  businessId: string | Business;
  name: string;
  address: string;
  location: LocationCoordinates;
  operatingHours: OperatingHours;
  phone?: string;
  qrCodeUrl?: string;
  isActive: boolean;
  services?: ServiceItem[];
}

export interface Business {
  _id: string;
  name: string;
  description?: string;
  category: BusinessCategory;
  logoUrl?: string;
  ownerId: string;
  rating: number;
  reviewCount: number;
  branches?: Branch[];
  createdAt: string;
}
