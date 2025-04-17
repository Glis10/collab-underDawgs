import db from "@/db";
import { serviceProvider } from "@/db/schema";
import haversine from "haversine-distance";
import { and, eq } from "drizzle-orm";

interface LatLng {
  latitude: number;
  longitude: number;
}

async function findNearbyProvider(userLocation: LatLng, maxDistance: number) {
  const allAvailableProviders = await db.query.serviceProvider.findMany({
    where: eq(serviceProvider.serviceStatus, "available"),
  });

  const nearbyProviders = allAvailableProviders.filter((provider) => {
    if (!provider.currentLocation) return false;

    if (
      !provider.currentLocation.latitude ||
      !provider.currentLocation.longitude
    )
      return false;

    const providerLocation: LatLng = {
      latitude: parseFloat(provider.currentLocation.latitude),
      longitude: parseFloat(provider.currentLocation.longitude),
    };

    const distance = haversine(userLocation, providerLocation);
    return distance <= maxDistance;
  });

  nearbyProviders.sort((a, b) => {
    const distA = haversine(userLocation, {
      latitude: parseFloat(a.currentLocation?.latitude || "0"),
      longitude: parseFloat(a.currentLocation?.longitude || "0"),
    });

    const distB = haversine(userLocation, {
      latitude: parseFloat(b.currentLocation?.latitude || "0"),
      longitude: parseFloat(b.currentLocation?.longitude || "0"),
    });
    return distA - distB;
  });

  return nearbyProviders;
}

async function getBestServiceProvider(userLocation: LatLng, serviceType: string) {
  const radii = [500, 1000, 2000, 5000, 10000];

  for (const radius of radii) {
    const candidates = await findNearbyProvider(userLocation, radius);
    if (candidates.length > 0) {
      return candidates[0];
    }
  }

  // ! TODO: Remove this in Production or find better solution
  // If no nearby providers found, get any available provider
  if (process.env.NODE_ENV === "development") {
    const anyAvailableProvider = await db.query.serviceProvider.findFirst({
      where: and(
        eq(serviceProvider.serviceStatus, "available"),
        eq(serviceProvider.serviceType, serviceType as any)
      ),
    });

    console.log("Any available provider", anyAvailableProvider);

    return anyAvailableProvider;
  }

  return null;
}

export { getBestServiceProvider };
