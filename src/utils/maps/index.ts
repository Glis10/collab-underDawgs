import db from "@/db";
import { serviceProvider } from "@/db/schema";
import haversine from "haversine-distance";
import { and, eq } from "drizzle-orm";
import { serviceTypeEnum } from "@/db/schema/enums";

interface LatLng {
  latitude: number;
  longitude: number;
}

async function findNearbyProvider(
  userLocation: LatLng,
  maxDistance: number,
  serviceType: (typeof serviceTypeEnum.enumValues)[number]
) {
  console.log("[DEBUG] Searching for providers with params:", {
    userLocation,
    maxDistance,
    serviceType,
  });

  const allAvailableProviders = await db.query.serviceProvider.findMany({
    where: and(
      eq(serviceProvider.serviceStatus, "available"),
      eq(serviceProvider.serviceType, serviceType)
    ),
  });

  console.log(
    "[DEBUG] Found available providers:",
    allAvailableProviders.length
  );
  console.log(
    "[DEBUG] Available providers details:",
    allAvailableProviders.map((p) => ({
      id: p.id,
      name: p.name,
      serviceType: p.serviceType,
      status: p.serviceStatus,
      location: p.currentLocation,
    }))
  );

  const nearbyProviders = allAvailableProviders.filter((provider) => {
    if (!provider.currentLocation) {
      console.log("[DEBUG] Provider has no location:", provider.id);
      return false;
    }

    if (
      !provider.currentLocation.latitude ||
      !provider.currentLocation.longitude
    ) {
      console.log("[DEBUG] Provider has invalid location:", {
        id: provider.id,
        location: provider.currentLocation,
      });
      return false;
    }

    const providerLocation: LatLng = {
      latitude: parseFloat(provider.currentLocation.latitude),
      longitude: parseFloat(provider.currentLocation.longitude),
    };

    const distance = haversine(userLocation, providerLocation);
    console.log("[DEBUG] Provider distance:", {
      id: provider.id,
      distance,
      maxDistance,
      isWithinRange: distance <= maxDistance,
    });
    return distance <= maxDistance;
  });

  console.log("[DEBUG] Found nearby providers:", nearbyProviders.length);

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

async function getBestServiceProvider(
  userLocation: LatLng,
  serviceType: (typeof serviceTypeEnum.enumValues)[number]
) {
  console.log("[DEBUG] Starting provider search with:", {
    userLocation,
    serviceType,
  });

  const radii = [500, 1000, 2000, 5000, 10000];

  for (const radius of radii) {
    console.log(`[DEBUG] Searching within ${radius}m radius`);
    const candidates = await findNearbyProvider(
      userLocation,
      radius,
      serviceType
    );
    if (candidates.length > 0) {
      console.log("[DEBUG] Found provider within radius:", {
        radius,
        provider: {
          id: candidates[0].id,
          name: candidates[0].name,
          location: candidates[0].currentLocation,
        },
      });
      return candidates[0];
    }
  }

  // If no nearby providers found, get any available provider in development mode
  if (process.env.NODE_ENV === "development") {
    console.log(
      "[DEBUG] No providers found in radius, checking for any available provider"
    );
    const anyAvailableProvider = await db.query.serviceProvider.findFirst({
      where: and(
        eq(serviceProvider.serviceStatus, "available"),
        eq(serviceProvider.serviceType, serviceType)
      ),
    });

    console.log("[DEBUG] Any available provider:", anyAvailableProvider);
    return anyAvailableProvider;
  }

  console.log("[DEBUG] No providers found");
  return null;
}

export { getBestServiceProvider };
