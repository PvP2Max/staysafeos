/**
 * Nominatim API service for address geocoding and search
 * Uses internal API proxy to avoid mixed content and CORS issues
 */

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

/**
 * Search for addresses matching a query string
 * Uses internal API proxy to handle HTTPS/CORS
 */
export async function searchAddress(query: string, limit = 5): Promise<NominatimResult[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
    });

    const response = await fetch(`/api/geocode/search?${params}`);

    if (!response.ok) {
      console.error("[nominatim] Search failed:", response.status, response.statusText);
      return [];
    }

    const results = await response.json();
    return results as NominatimResult[];
  } catch (error) {
    console.error("[nominatim] Search error:", error);
    return [];
  }
}

/**
 * Reverse geocode coordinates to an address
 * Uses internal API proxy to handle HTTPS/CORS
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
    });

    const response = await fetch(`/api/geocode/reverse?${params}`);

    if (!response.ok) {
      console.error("[nominatim] Reverse geocode failed:", response.status, response.statusText);
      return null;
    }

    const result = await response.json();
    return result.display_name || null;
  } catch (error) {
    console.error("[nominatim] Reverse geocode error:", error);
    return null;
  }
}

/**
 * Format a Nominatim result for display
 * Shorter format than display_name
 */
export function formatAddress(result: NominatimResult): string {
  const addr = result.address;
  if (!addr) return result.display_name;

  const parts: string[] = [];

  // Street address
  if (addr.house_number && addr.road) {
    parts.push(`${addr.house_number} ${addr.road}`);
  } else if (addr.road) {
    parts.push(addr.road);
  }

  // City, State
  if (addr.city) {
    parts.push(addr.city);
  }
  if (addr.state) {
    parts.push(addr.state);
  }

  return parts.length > 0 ? parts.join(", ") : result.display_name;
}
