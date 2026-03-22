/** GeoJSON helpers for map overlays (no external deps). */

export function circlePolygon(
  lat: number,
  lng: number,
  radiusKm: number,
  steps = 64,
): { type: 'Polygon'; coordinates: [number, number][][] } {
  const coords: [number, number][] = [];
  const dist = radiusKm / 111.32;
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * 2 * Math.PI;
    const dy = dist * Math.cos(theta);
    const dx = (dist * Math.sin(theta)) / Math.cos((lat * Math.PI) / 180);
    coords.push([lng + dx, lat + dy]);
  }
  return {
    type: 'Polygon',
    coordinates: [coords],
  };
}

type LineFC = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: { ringIndex: number };
    geometry: { type: 'LineString'; coordinates: [number, number][] };
  }>;
};

export function contourRings(lat: number, lng: number, radiiKm: number[]): LineFC {
  const features = radiiKm.map((r, i) => {
    const ring: [number, number][] = [];
    const steps = 48;
    const dist = r / 111.32;
    for (let j = 0; j <= steps; j++) {
      const theta = (j / steps) * 2 * Math.PI;
      const dy = dist * Math.cos(theta);
      const dx = (dist * Math.sin(theta)) / Math.cos((lat * Math.PI) / 180);
      ring.push([lng + dx, lat + dy]);
    }
    return {
      type: 'Feature' as const,
      properties: { ringIndex: i },
      geometry: {
        type: 'LineString' as const,
        coordinates: ring,
      },
    };
  });
  return { type: 'FeatureCollection', features };
}
