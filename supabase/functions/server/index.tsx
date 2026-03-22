import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper functions for terrain calculation
function calculateElevation(lat: number, lng: number): number {
  const base = Math.sin(lat * 0.1) * Math.cos(lng * 0.1) * 500;
  const variation = Math.sin(lat * 0.5) * Math.cos(lng * 0.3) * 300;
  const detail = Math.sin(lat * 2) * Math.cos(lng * 2) * 100;
  return Math.max(0, 500 + base + variation + detail);
}

function calculateSlope(lat: number, lng: number, elevation: number): number {
  const delta = 0.001;
  const elevNorth = calculateElevation(lat + delta, lng);
  const elevEast = calculateElevation(lat, lng + delta);
  const rise = Math.sqrt(
    Math.pow(elevation - elevNorth, 2) + 
    Math.pow(elevation - elevEast, 2)
  );
  const run = delta * 111000;
  return Math.atan(rise / run) * (180 / Math.PI);
}

function classifyTerrain(elevation: number, slope: number): string {
  if (elevation < 200) return 'plains';
  if (elevation < 500 && slope < 15) return 'plateau';
  if (elevation < 800) return slope > 25 ? 'hills' : 'plateau';
  if (elevation < 1500) return slope > 30 ? 'ridge' : 'hills';
  return slope > 40 ? 'ridge' : 'mountains';
}

function calculateRiskLevel(elevation: number, slope: number): string {
  if (slope < 10 && elevation < 500) return 'stable';
  if (slope < 20 && elevation < 1000) return 'moderate';
  if (slope < 35) return 'high';
  return 'critical';
}

// Health check endpoint
app.get("/make-server-2c510f42/health", (c) => {
  return c.json({ status: "ok" });
});

// Analyze terrain endpoint
app.post("/make-server-2c510f42/analyze-terrain", async (c) => {
  try {
    const { latitude, longitude } = await c.req.json();
    
    if (!latitude || !longitude) {
      return c.json({ error: "Latitude and longitude required" }, 400);
    }

    const elevation = calculateElevation(latitude, longitude);
    const slope = calculateSlope(latitude, longitude, elevation);
    const terrainType = classifyTerrain(elevation, slope);
    const riskLevel = calculateRiskLevel(elevation, slope);
    const stabilityIndex = Math.max(0, 100 - slope * 2 - (elevation > 1000 ? 20 : 0));

    const terrain = {
      latitude,
      longitude,
      elevation,
      terrainType,
      riskLevel,
      slope,
      geologicalAge: elevation > 1000 ? 'Mesozoic' : 'Cenozoic',
      rockType: elevation > 1000 ? 'Igneous' : 'Sedimentary',
    };

    // Store in KV
    const key = `terrain:${latitude.toFixed(4)}:${longitude.toFixed(4)}`;
    await kv.set(key, terrain);

    // Generate landmarks
    const landmarks = [];
    const radius = 0.5;
    
    for (let i = 0; i < 5; i++) {
      const lat = latitude + (Math.random() - 0.5) * radius;
      const lng = longitude + (Math.random() - 0.5) * radius;
      const elev = calculateElevation(lat, lng);

      if (elev > elevation + 200 && elev > 1000) {
        landmarks.push({
          id: `peak-${i}-${Date.now()}`,
          type: 'peak',
          name: `Peak ${String.fromCharCode(65 + i)}`,
          latitude: lat,
          longitude: lng,
          elevation: elev,
          prominence: elev - elevation,
        });
      }

      if (elev < elevation - 150 && elev < 400) {
        landmarks.push({
          id: `valley-${i}-${Date.now()}`,
          type: 'valley',
          name: `Valley ${String.fromCharCode(65 + i)}`,
          latitude: lat,
          longitude: lng,
          elevation: elev,
        });
      }
    }

    if (Math.abs(slope) > 25) {
      landmarks.push({
        id: `fault-${Date.now()}`,
        type: 'fault',
        name: 'Geological Fault Line',
        latitude: latitude + Math.random() * 0.1,
        longitude: longitude + Math.random() * 0.1,
        elevation: elevation,
        description: 'Active tectonic boundary',
      });
    }

    return c.json({
      terrain,
      landmarks: landmarks.slice(0, 8),
      stability: {
        index: Math.round(stabilityIndex),
        factors: [
          slope > 30 ? 'High slope gradient' : 'Moderate slope',
          elevation > 1000 ? 'High elevation' : 'Low to moderate elevation',
          riskLevel === 'stable' ? 'Geologically stable' : 'Potential instability',
        ],
      },
    });
  } catch (error) {
    console.error('Error analyzing terrain:', error);
    return c.json({ error: 'Failed to analyze terrain' }, 500);
  }
});

// Get all analyzed terrain
app.get("/make-server-2c510f42/terrain-history", async (c) => {
  try {
    const terrains = await kv.getByPrefix('terrain:');
    return c.json({ terrains: terrains || [] });
  } catch (error) {
    console.error('Error fetching terrain history:', error);
    return c.json({ error: 'Failed to fetch terrain history' }, 500);
  }
});

Deno.serve(app.fetch);