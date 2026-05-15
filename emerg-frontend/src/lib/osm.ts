import { EmergencyLocation } from '@/src/lib/auth';

export async function reverseGeocodeNominatim(location: EmergencyLocation): Promise<string> {
  if (!location.latitude || !location.longitude) {
    return '';
  }

  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: location.latitude,
    lon: location.longitude,
    zoom: '18',
    addressdetails: '1',
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return '';
  }

  const payload = (await response.json()) as {
    display_name?: string;
    name?: string;
    address?: Record<string, string | undefined>;
  };

  return (
    payload.name ||
    payload.address?.neighbourhood ||
    payload.address?.suburb ||
    payload.address?.city_district ||
    payload.address?.road ||
    payload.display_name ||
    ''
  );
}
