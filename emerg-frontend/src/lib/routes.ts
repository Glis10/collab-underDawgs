import { EmergencyLocation } from '@/src/lib/auth';

type RoutePoint = {
  latitude: string;
  longitude: string;
};

function isFiniteCoordinate(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
}

function toRoutePoint(latitude: number, longitude: number): RoutePoint | null {
  if (!isFiniteCoordinate(latitude, longitude)) {
    return null;
  }

  return {
    latitude: latitude.toString(),
    longitude: longitude.toString(),
  };
}

function decodePolyline(value: string): RoutePoint[] {
  const coordinates: RoutePoint[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < value.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = value.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < value.length);

    latitude += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;

    do {
      byte = value.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < value.length);

    longitude += result & 1 ? ~(result >> 1) : result >> 1;

    const point = toRoutePoint(latitude / 1e5, longitude / 1e5);

    if (point) {
      coordinates.push(point);
    }
  }

  return coordinates.length > 1 ? coordinates : [];
}

function parseCoordinatePair(value: unknown): RoutePoint | null {
  if (Array.isArray(value) && value.length >= 2) {
    const first = Number(value[0]);
    const second = Number(value[1]);

    if (isFiniteCoordinate(second, first)) {
      return toRoutePoint(second, first);
    }

    return toRoutePoint(first, second);
  }

  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    const latitude = Number(record.lat ?? record.latitude);
    const longitude = Number(record.lng ?? record.lon ?? record.longitude);

    return toRoutePoint(latitude, longitude);
  }

  return null;
}

function uniqueRoute(coordinates: RoutePoint[]) {
  return coordinates.filter((point, index, list) => {
    const previous = list[index - 1];

    return !previous || previous.latitude !== point.latitude || previous.longitude !== point.longitude;
  });
}

export function extractRouteCoordinates(value: unknown): EmergencyLocation[] {
  const candidates: RoutePoint[][] = [];

  const visit = (node: unknown) => {
    if (!node) {
      return;
    }

    if (typeof node === 'string') {
      const trimmed = node.trim();

      if (/^[\x3f-\x7e]+$/.test(trimmed) && trimmed.length > 8) {
        const decoded = decodePolyline(trimmed);

        if (decoded.length > 1) {
          candidates.push(decoded);
        }
      }

      return;
    }

    if (Array.isArray(node)) {
      const coordinateList = uniqueRoute(
        node
          .map(parseCoordinatePair)
          .filter((item): item is RoutePoint => Boolean(item))
      );

      if (coordinateList.length > 1) {
        candidates.push(coordinateList);
      }

      node.forEach(visit);
      return;
    }

    if (typeof node === 'object') {
      Object.values(node as Record<string, unknown>).forEach(visit);
    }
  };

  visit(value);

  return candidates.sort((left, right) => right.length - left.length)[0] || [];
}
