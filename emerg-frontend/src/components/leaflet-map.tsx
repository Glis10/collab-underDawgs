import React, { useEffect, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { EmergencyLocation } from '@/src/lib/auth';

type LeafletMapProps = {
  userLocation: EmergencyLocation;
  responderLocation?: EmergencyLocation | null;
  responderLocations?: { location: EmergencyLocation; label: string }[];
  routeCoordinates?: EmergencyLocation[];
  userLabel?: string;
  userMarkerColor?: string;
  userMarkerText?: string;
  responderLabel?: string;
  responderMarkerColor?: string;
  responderMarkerText?: string;
  fallback: React.ReactNode;
  height?: number;
  fitMaxZoom?: number;
  onLocationSelect?: (location: EmergencyLocation) => void;
  selectedLocation?: EmergencyLocation | null;
  zoomEnabled?: boolean;
};

function toPoint(location?: EmergencyLocation | null) {
  if (!location?.latitude || !location.longitude) {
    return null;
  }

  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
}

function buildLeafletHtml({
  userLocation,
  responderLocation,
  responderLocations,
  routeCoordinates,
  userLabel = 'User',
  userMarkerColor = '#1A365D',
  responderLabel = 'Responder',
  responderMarkerColor = '#E63946',
  fitMaxZoom = 16,
  onLocationSelect,
  selectedLocation,
  zoomEnabled = true,
  mapId,
}: Omit<LeafletMapProps, 'fallback'> & { mapId: string }) {
  const user = toPoint(userLocation);
  const selected = toPoint(selectedLocation);
  const responders = (responderLocations && responderLocations.length > 0
    ? responderLocations
    : responderLocation
      ? [{ location: responderLocation, label: responderLabel }]
      : []
  )
    .map((item) => ({
      point: toPoint(item.location),
      label: escapeHtml(item.label),
    }))
    .filter((item): item is { point: { latitude: number; longitude: number }; label: string } => Boolean(item.point));

  if (!user) {
    return '';
  }

  const escapedUserLabel = escapeHtml(userLabel);
  const routeJs = JSON.stringify(
    routeCoordinates
      ?.map(toPoint)
      .filter((point): point is { latitude: number; longitude: number } => Boolean(point))
      .map((point) => [point.latitude, point.longitude]) || []
  );
  const responderJs = JSON.stringify(responders.map((item) => ({
    point: [item.point.latitude, item.point.longitude],
    label: item.label,
  })));
  const selectedJs = selected ? `[${selected.latitude}, ${selected.longitude}]` : 'null';

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { background: #eef6f7; height: 100%; margin: 0; width: 100%; }
      .leaflet-control-attribution { font: 10px/1.2 Arial, sans-serif; }
      .leaflet-popup-content-wrapper { border-radius: 8px; font-family: Arial, sans-serif; font-weight: 700; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const user = [${user.latitude}, ${user.longitude}];
      const responders = ${responderJs};
      const routeCoordinates = ${routeJs};
      const selected = ${selectedJs};
      const canSelectLocation = ${Boolean(onLocationSelect)};
      const map = L.map('map', {
        boxZoom: ${zoomEnabled},
        doubleClickZoom: ${zoomEnabled},
        keyboard: ${zoomEnabled},
        scrollWheelZoom: ${zoomEnabled},
        touchZoom: ${zoomEnabled},
        zoomControl: false
      }).setView(user, 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      L.circleMarker(user, {
        radius: 9,
        color: '#FFFFFF',
        weight: 3,
        fillColor: '${userMarkerColor}',
        fillOpacity: 1
      }).addTo(map).bindPopup('${escapedUserLabel}');

      let selectionMarker = null;
      const setSelection = (point) => {
        if (!point) {
          return;
        }

        if (selectionMarker) {
          selectionMarker.setLatLng(point);
          return;
        }

        selectionMarker = L.circleMarker(point, {
          radius: 11,
          color: '#FFFFFF',
          weight: 3,
          fillColor: '#00A86B',
          fillOpacity: 1
        }).addTo(map).bindPopup('Selected location');
      };

      setSelection(selected);

      if (canSelectLocation) {
        map.on('click', (event) => {
          const point = [event.latlng.lat, event.latlng.lng];
          setSelection(point);
          const message = JSON.stringify({
            mapId: '${mapId}',
            type: 'leaflet-location-select',
            latitude: event.latlng.lat.toString(),
            longitude: event.latlng.lng.toString()
          });

          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(message);
          } else {
            window.parent.postMessage(message, '*');
          }
        });
      }

      const bounds = [user];

      responders.forEach((responder) => {
        L.circleMarker(responder.point, {
          radius: 9,
          color: '#FFFFFF',
          weight: 3,
          fillColor: '${responderMarkerColor}',
          fillOpacity: 1
        }).addTo(map).bindPopup(responder.label);

        L.polyline(routeCoordinates.length > 1 ? routeCoordinates : [responder.point, user], {
          color: '#3182CE',
          weight: 5,
          opacity: 0.75
        }).addTo(map);

        bounds.push(responder.point);
      });

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [36, 36], maxZoom: ${fitMaxZoom} });
      }

      setTimeout(() => map.invalidateSize(), 80);
      setTimeout(() => map.invalidateSize(), 300);
    </script>
  </body>
</html>`;
}

function buildGalliHtml({
  userLocation,
  responderLocation,
  responderLocations,
  routeCoordinates,
  userMarkerColor = '#1A365D',
  userMarkerText = 'U',
  responderLabel = 'Responder',
  responderMarkerColor = '#E63946',
  responderMarkerText = 'R',
  fitMaxZoom = 16,
  onLocationSelect,
  selectedLocation,
  zoomEnabled = true,
  mapId,
}: Omit<LeafletMapProps, 'fallback'> & { mapId: string }) {
  const token = process.env.EXPO_PUBLIC_GALLI_MAPS_TOKEN;
  const user = toPoint(userLocation);
  const selected = toPoint(selectedLocation);
  const responders = (responderLocations && responderLocations.length > 0
    ? responderLocations
    : responderLocation
      ? [{ location: responderLocation, label: responderLabel }]
      : []
  )
    .map((item) => ({
      point: toPoint(item.location),
      label: escapeHtml(item.label),
    }))
    .filter((item): item is { point: { latitude: number; longitude: number }; label: string } => Boolean(item.point));

  if (!token || token === 'dummy' || !user) {
    return '';
  }

  const routeJs = JSON.stringify(
    routeCoordinates
      ?.map(toPoint)
      .filter((point): point is { latitude: number; longitude: number } => Boolean(point))
      .map((point) => [point.longitude, point.latitude]) || []
  );
  const responderJs = JSON.stringify(responders.map((item) => [item.point.longitude, item.point.latitude]));
  const selectedJs = selected ? `[${selected.latitude}, ${selected.longitude}]` : 'null';
  const routePoints = responders.map((item) => item.point);
  const center = routePoints.length > 0
    ? {
        latitude: (routePoints.reduce((sum, point) => sum + point.latitude, user.latitude) / (routePoints.length + 1)),
        longitude: (routePoints.reduce((sum, point) => sum + point.longitude, user.longitude) / (routePoints.length + 1)),
      }
    : selected || user;
  const zoom = routePoints.length > 0 ? Math.min(fitMaxZoom, 13) : selected ? 15 : 14;
  const styleUrl = `https://map-init.gallimap.com/styles/light/style.json?accessToken=${encodeURIComponent(token)}`;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
    <style>
      html, body, #map { background: #eef6f7; height: 100%; margin: 0; width: 100%; }
      .load-state {
        align-items: center;
        color: #1A365D;
        display: flex;
        font: 700 13px Arial, sans-serif;
        inset: 0;
        justify-content: center;
        position: absolute;
      }
      .trip-marker {
        align-items: center;
        border: 3px solid #fff;
        border-radius: 999px;
        box-shadow: 0 8px 18px rgba(15,23,42,0.2);
        color: #fff;
        display: flex;
        font: 900 12px Arial, sans-serif;
        height: 32px;
        justify-content: center;
        width: 32px;
      }
      .trip-marker.user { background: ${userMarkerColor}; }
      .trip-marker.responder { background: ${responderMarkerColor}; }
      .trip-marker.selected { background: #00A86B; }
      .maplibregl-control-container { display: none; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <div class="load-state" id="load-state">Loading Galli Maps...</div>
    <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
    <script>
      const user = [${user.longitude}, ${user.latitude}];
      const responders = ${responderJs};
      const roadRoute = ${routeJs};
      const selected = ${selectedJs};
      const canSelectLocation = ${Boolean(onLocationSelect)};
      const canZoom = ${zoomEnabled};

      const postSelection = (lngLat) => {
        const message = JSON.stringify({
          mapId: '${mapId}',
          type: 'leaflet-location-select',
          latitude: lngLat.lat.toString(),
          longitude: lngLat.lng.toString()
        });

        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(message);
        } else {
          window.parent.postMessage(message, '*');
        }
      };

      const createMarkerEl = (className, label) => {
        const el = document.createElement('div');
        el.className = 'trip-marker ' + className;
        el.textContent = label;
        return el;
      };

      if (typeof maplibregl !== 'object') {
        document.getElementById('load-state').textContent = 'Map engine unavailable';
      } else {
        const map = new maplibregl.Map({
          container: 'map',
          style: '${styleUrl}',
          center: [${center.longitude}, ${center.latitude}],
          zoom: ${zoom},
          attributionControl: false,
          interactive: canZoom || canSelectLocation
        });

        if (!canZoom) {
          map.scrollZoom.disable();
          map.boxZoom.disable();
          map.doubleClickZoom.disable();
          map.dragRotate.disable();
          map.keyboard.disable();
          map.touchZoomRotate.disableRotation();
        }

        map.on('load', () => {
          document.getElementById('load-state').style.display = 'none';

          new maplibregl.Marker({ element: createMarkerEl('user', '${escapeHtml(userMarkerText)}') }).setLngLat(user).addTo(map);

          responders.forEach((point) => {
            new maplibregl.Marker({ element: createMarkerEl('responder', '${escapeHtml(responderMarkerText)}') }).setLngLat(point).addTo(map);
          });

          if (selected) {
            new maplibregl.Marker({ element: createMarkerEl('selected', 'P') }).setLngLat([selected[1], selected[0]]).addTo(map);
          }

          if (responders.length > 0) {
            map.addSource('trip-route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: roadRoute.length > 1 ? roadRoute : [responders[0], user]
                },
                properties: {}
              }
            });

            map.addLayer({
              id: 'trip-route-glow',
              type: 'line',
              source: 'trip-route',
              paint: {
                'line-color': '#FFFFFF',
                'line-width': 9,
                'line-opacity': 0.9
              }
            });

            map.addLayer({
              id: 'trip-route',
              type: 'line',
              source: 'trip-route',
              paint: {
                'line-color': '#3182CE',
                'line-width': 5,
                'line-opacity': 0.95
              }
            });

            const bounds = new maplibregl.LngLatBounds(user, user);
            responders.forEach((point) => bounds.extend(point));
            roadRoute.forEach((point) => bounds.extend(point));
            map.fitBounds(bounds, {
              padding: { top: 82, bottom: 120, left: 54, right: 54 },
              maxZoom: ${fitMaxZoom}
            });
          }

          setTimeout(() => map.resize(), 80);
          setTimeout(() => map.resize(), 300);
        });

        map.on('error', () => {
          document.getElementById('load-state').textContent = 'Galli map failed to load';
        });

        if (canSelectLocation) {
          let selectedMarker = null;

          map.on('click', (event) => {
            if (selectedMarker) {
              selectedMarker.remove();
            }

            selectedMarker = new maplibregl.Marker({ element: createMarkerEl('selected', 'P') }).setLngLat(event.lngLat).addTo(map);
            postSelection(event.lngLat);
          });
        }
      }
    </script>
  </body>
</html>`;
}

export function LeafletMap(props: LeafletMapProps) {
  const mapId = useMemo(() => `map-${Math.random().toString(36).slice(2)}`, []);
  const latestSelectHandler = useRef(props.onLocationSelect);

  latestSelectHandler.current = props.onLocationSelect;

  const srcDoc = buildGalliHtml({ ...props, mapId }) || buildLeafletHtml({ ...props, mapId });

  useEffect(() => {
    if (Platform.OS !== 'web' || !props.onLocationSelect) {
      return undefined;
    }

    const handleMessage = (event: MessageEvent) => {
      try {
        const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (payload?.type !== 'leaflet-location-select' || payload.mapId !== mapId) {
          return;
        }

        latestSelectHandler.current?.({
          latitude: payload.latitude,
          longitude: payload.longitude,
        });
      } catch {
        return;
      }
    };

    window.addEventListener('message', handleMessage);

    return () => window.removeEventListener('message', handleMessage);
  }, [mapId, props.onLocationSelect]);

  if (!srcDoc) {
    return <>{props.fallback}</>;
  }

  const height = props.height || 190;

  if (Platform.OS !== 'web') {
    return (
      <WebView
        originWhitelist={['*']}
        source={{ html: srcDoc }}
        style={{ backgroundColor: '#eef6f7', height, width: '100%' }}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(event) => {
          if (!props.onLocationSelect) {
            return;
          }

          try {
            const payload = JSON.parse(event.nativeEvent.data);

            if (payload?.type !== 'leaflet-location-select' || payload.mapId !== mapId) {
              return;
            }

            props.onLocationSelect({
              latitude: payload.latitude,
              longitude: payload.longitude,
            });
          } catch {
            return;
          }
        }}
      />
    );
  }

  return React.createElement('iframe', {
    srcDoc,
    title: 'Emergency live route map',
    style: {
      border: 0,
      display: 'block',
      backgroundColor: '#eef6f7',
      height,
      width: '100%',
    },
  });
}
