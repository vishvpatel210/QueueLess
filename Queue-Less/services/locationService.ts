export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const locationService = {
  // Calculate distance between two coordinates in kilometers using Haversine formula
  calculateDistanceKm(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth radius in km
    const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coord1.latitude * Math.PI) / 180) *
        Math.cos((coord2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  },

  async getCurrentLocation(): Promise<Coordinates> {
    // Simulated fallback coordinates for development
    return {
      latitude: 37.7749,
      longitude: -122.4194,
    };
  },
};

export default locationService;
