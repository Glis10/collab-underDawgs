import { envConfig } from "@/config/env.config";
import axios from "axios";

const MAPS_ACCESS_TOKEN = envConfig.galli_maps_token;
const BASE_API = `https://route-init.gallimap.com/api/v1`;

interface IAutoCompleteProps {
  searchQuery: string;
  currentLat: string;
  currentLong: string;
}

interface IRoutingProps {
  srcLat: string;
  srcLng: string;
  dstLat: string;
  dstLng: string;
  mode?: "DRIVING" | "WALKING" | "CYCLING";
}

const compeletAutoSearch = async ({
  searchQuery,
  currentLat,
  currentLong,
}: IAutoCompleteProps) => {
  try {
    if (searchQuery.length < 4) {
      return null;
    }

    const response = await axios.get(`${BASE_API}/search/autocomplete`, {
      params: {
        accessToken: MAPS_ACCESS_TOKEN,
        word: searchQuery,
        lat: currentLat,
        lng: currentLong,
      },
    });
    console.log("response from galli maps", response);

    if (response.data.success) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    console.log("Error while fetching maps autocomplete data", error);
    return null;
  }
};

const getOptimalRoute = async ({
  srcLat,
  srcLng,
  dstLat,
  dstLng,
  mode = "DRIVING",
}: IRoutingProps) => {
  try {
    const response = await axios.get(`${BASE_API}/routing`, {
      params: {
        accessToken: MAPS_ACCESS_TOKEN,
        srcLat,
        srcLng,
        dstLat,
        dstLng,
        mode,
      },
    });

    if (response.data.success) {
      return response.data.data.data;
    }

    return null;
  } catch (error) {
    console.log("Error while fetching maps routing data", error);
    return null;
  }
};

export { compeletAutoSearch, getOptimalRoute };
