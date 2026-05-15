import React from 'react';
import { Platform } from 'react-native';
import { EmergencyLocation } from '@/src/lib/auth';

type LeafletMapProps = {
  userLocation: EmergencyLocation;
  responderLocation?: EmergencyLocation | null;
  userLabel?: string;
  responderLabel?: string;
  fallback: React.ReactNode;
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
  userLabel = 'User',
  responderLabel = 'Responder',
}: Omit<LeafletMapProps, 'fallback'>) {
  const user = toPoint(userLocation);
  const responder = toPoint(responderLocation);

  if (!user) {
    return '';
  }

  const escapedUserLabel = escapeHtml(userLabel);
  const escapedResponderLabel = escapeHtml(responderLabel);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { height: 100%; margin: 0; width: 100%; }
      .leaflet-control-attribution { font: 10px/1.2 Arial, sans-serif; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const user = [${user.latitude}, ${user.longitude}];
      const responder = ${responder ? `[${responder.latitude}, ${responder.longitude}]` : 'null'};
      const map = L.map('map', { zoomControl: false }).setView(user, 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      L.circleMarker(user, {
        radius: 9,
        color: '#FFFFFF',
        weight: 3,
        fillColor: '#1A365D',
        fillOpacity: 1
      }).addTo(map).bindPopup('${escapedUserLabel}');

      if (responder) {
        L.circleMarker(responder, {
          radius: 9,
          color: '#FFFFFF',
          weight: 3,
          fillColor: '#E63946',
          fillOpacity: 1
        }).addTo(map).bindPopup('${escapedResponderLabel}');

        L.polyline([responder, user], {
          color: '#3182CE',
          weight: 5,
          opacity: 0.75
        }).addTo(map);

        map.fitBounds([responder, user], { padding: [36, 36], maxZoom: 16 });
      }
    </script>
  </body>
</html>`;
}

export function LeafletMap(props: LeafletMapProps) {
  if (Platform.OS !== 'web') {
    return <>{props.fallback}</>;
  }

  const srcDoc = buildLeafletHtml(props);

  if (!srcDoc) {
    return <>{props.fallback}</>;
  }

  return React.createElement('iframe', {
    srcDoc,
    title: 'OpenStreetMap live route',
    style: {
      border: 0,
      display: 'block',
      height: 190,
      width: '100%',
    },
  });
}
