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
  coordinates: [number, number]; // [longitude, latitude]
}

export interface OperatingHours {
  open: string;
  close: string;
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
