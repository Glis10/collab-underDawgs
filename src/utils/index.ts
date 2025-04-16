import { serviceProvider } from "@/db/schema";

import db from "@/db";
import { faker } from "@faker-js/faker";

export const capitalizeFirstLetter = (str: string) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

interface LatLng {
  latitude: number;
  longitude: number;
}

export const createServiceProvider = async (location: LatLng) => {
  const randomOrganization = await db.query.organization.findFirst({});

  if (!randomOrganization) {
    throw new Error("No organization found");
  }

  const createdServiceProvider = await db
    .insert(serviceProvider)
    .values({
      name: faker.internet.username(),
      age: faker.number.int({ min: 18, max: 65 }),
      email: faker.internet.email(),
      phoneNumber: +faker.phone.number(),
      primaryAddress: faker.location.streetAddress(),
      password: faker.internet.password(),
      serviceType: randomOrganization.serviceCategory,
      isVerified: true,
      organizationId: randomOrganization.id,
      currentLocation: {
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
      },
      serviceStatus: "available",
    })
    .returning({
      id: serviceProvider.id,
      currentLocation: serviceProvider.currentLocation,
      serviceStatus: serviceProvider.serviceStatus,
    });

  console.log("Randomly created Service Provider", createdServiceProvider[0]);

  return createdServiceProvider;
};

export const createNearServiceProviders = async (
  destLocation: LatLng,
  count: number
) => {
  const createdServiceProviders = [];
  for (let i = 0; i < count; i++) {
    const serviceProvider = await createServiceProvider({
      latitude: destLocation.latitude + (Math.random() - 0.5) * 0.01,
      longitude: destLocation.longitude + (Math.random() - 0.5) * 0.01,
    });
    createdServiceProviders.push(serviceProvider);
  }
  return createdServiceProviders;
};
