"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Globe2, MapPin } from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const W = 800;
const H = 380;

function project(lat: number, lon: number) {
  const x = ((lon + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return { x, y };
}

const dots: { lat: number; lon: number }[] = (() => {
  const arr: { lat: number; lon: number }[] = [];
  const land = (lat: number, lon: number) => {
    if (lat > 70 || lat < -58) return false;
    if (lon > -170 && lon < -50 && lat > 14 && lat < 70) return true;
    if (lon > -85 && lon < -35 && lat > -55 && lat < 15) return true;
    if (lon > -10 && lon < 40 && lat > 36 && lat < 70) return true;
    if (lon > -18 && lon < 52 && lat > -35 && lat < 36) return true;
    if (lon > 26 && lon < 60 && lat > 12 && lat < 45) return true;
    if (lon > 60 && lon < 145 && lat > 8 && lat < 60) return true;
    if (lon > 95 && lon < 142 && lat > -10 && lat < 25) return true;
    if (lon > 110 && lon < 155 && lat > -40 && lat < -10) return true;
    if (lon > 165 && lon < 180 && lat > -47 && lat < -34) return true;
    if (lon > 130 && lon < 145 && lat > 30 && lat < 46) return true;
    return false;
  };
  for (let lat = -55; lat <= 70; lat += 4) {
    for (let lon = -170; lon <= 175; lon += 4) {
      if (land(lat, lon)) arr.push({ lat, lon });
    }
  }
  return arr;
})();

type Region =
  | "All"
  | "North America"
  | "Latin America"
  | "Europe"
  | "Africa"
  | "Middle East"
  | "Asia Pacific";

type Loc = { name: string; country: string; region: Exclude<Region, "All">; lat: number; lon: number; clients: number };

const locations: Loc[] = [
  { name: "San Francisco", country: "USA", region: "North America", lat: 37.77, lon: -122.42, clients: 14 },
  { name: "New York", country: "USA", region: "North America", lat: 40.71, lon: -74.0, clients: 22 },
  { name: "Toronto", country: "Canada", region: "North America", lat: 43.65, lon: -79.38, clients: 6 },
  { name: "Mexico City", country: "Mexico", region: "Latin America", lat: 19.43, lon: -99.13, clients: 4 },
  { name: "São Paulo", country: "Brazil", region: "Latin America", lat: -23.55, lon: -46.63, clients: 5 },
  { name: "Buenos Aires", country: "Argentina", region: "Latin America", lat: -34.6, lon: -58.38, clients: 3 },
  { name: "London", country: "United Kingdom", region: "Europe", lat: 51.5, lon: -0.12, clients: 11 },
  { name: "Berlin", country: "Germany", region: "Europe", lat: 52.52, lon: 13.4, clients: 7 },
  { name: "Lisbon", country: "Portugal", region: "Europe", lat: 38.72, lon: -9.14, clients: 4 },
  { name: "Cape Town", country: "South Africa", region: "Africa", lat: -33.92, lon: 18.42, clients: 3 },
  { name: "Lagos", country: "Nigeria", region: "Africa", lat: 6.52, lon: 3.38, clients: 2 },
  { name: "Dubai", country: "UAE", region: "Middle East", lat: 25.2, lon: 55.27, clients: 8 },
  { name: "Mumbai", country: "India", region: "Asia Pacific", lat: 19.07, lon: 72.87, clients: 6 },
  { name: "Dhaka", country: "Bangladesh", region: "Asia Pacific", lat: 23.81, lon: 90.41, clients: 4 },
  { name: "Singapore", country: "Singapore", region: "Asia Pacific", lat: 1.35, lon: 103.82, clients: 9 },
  { name: "Tokyo", country: "Japan", region: "Asia Pacific", lat: 35.68, lon: 139.69, clients: 7 },
  { name: "Sydney", country: "Australia", region: "Asia Pacific", lat: -33.87, lon: 151.21, clients: 5 },
  { name: "Auckland", country: "New Zealand", region: "Asia Pacific", lat: -36.85, lon: 174.76, clients: 2 },
];

const regions: Region[] = [
  "All",
  "North America",
  "Latin America",
  "Europe",
  "Africa",
  "Middle East",
  "Asia Pacific",
];

const arcs: [number, number][] = [
  [0, 6],
  [0, 16],
  [6, 11],
  [6, 14],
  [4, 8],
  [11, 15],
  [16, 14],
  [9, 11],
  [12, 17],
  [2, 7],
];

function arcPath(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const lift = Math.min(120, dist * 0.4);
  return `M ${a.x} ${a.y} Q ${mx} ${my - lift} ${b.x} ${b.y}`;
}

export function WorldMap() {
  const [region, setRegion] = useState<Region>("All");
  const filtered = region === "All" ? locations : locations.filter((l) => l.region === region);
  const activeIndices = new Set(filtered.map((l) => locations.indexOf(l)));

  return (
    <Section id="reach" className="overflow-hidden">
      <Container>
        <SectionHeading
          eyebrow="Areas we've served"
          title={
            <>
              We work where <span className="text-brand-ink">your team works</span> — anywhere.
            </>
          }
          description="Remote-first by design. We've shipped projects across 38 countries and six continents, with weekly cadence and time-zone coverage that fits your team."
        />

        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {regions.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                region === r
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/30"
              )}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-8">
            <div className="relative rounded-3xl border border-border bg-card p-4 md:p-8 overflow-hidden h-full">
              <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand/5 to-transparent" aria-hidden />
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-auto"
                role="img"
                aria-label="World map showing locations served by WebSyner"
              >
                <defs>
                  <linearGradient id="arc-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity="0" />
                    <stop offset="50%" stopColor="var(--brand)" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {dots.map((d, i) => {
                  const { x, y } = project(d.lat, d.lon);
                  return (
                    <circle key={i} cx={x} cy={y} r={1.2} className="text-foreground/40" fill="currentColor" />
                  );
                })}

                {arcs.map(([a, b], i) => {
                  if (region !== "All" && (!activeIndices.has(a) || !activeIndices.has(b))) return null;
                  const A = project(locations[a].lat, locations[a].lon);
                  const B = project(locations[b].lat, locations[b].lon);
                  return (
                    <motion.path
                      key={`arc-${i}-${region}`}
                      d={arcPath(A, B)}
                      fill="none"
                      stroke="url(#arc-grad)"
                      strokeWidth={1.4}
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1.4, delay: 0.1 * i, ease: "easeInOut" }}
                    />
                  );
                })}

                {locations.map((loc, i) => {
                  const { x, y } = project(loc.lat, loc.lon);
                  const active = region === "All" || activeIndices.has(i);
                  return (
                    <g key={loc.name} opacity={active ? 1 : 0.18}>
                      {active && (
                        <motion.circle
                          cx={x}
                          cy={y}
                          r={6}
                          fill="var(--brand)"
                          opacity={0.25}
                          initial={{ scale: 0 }}
                          animate={{ scale: [0, 2, 1] }}
                          transition={{
                            duration: 2,
                            delay: 0.05 * i,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "easeOut",
                          }}
                          style={{ transformOrigin: `${x}px ${y}px` }}
                        />
                      )}
                      <circle cx={x} cy={y} r={3} fill="var(--brand)" stroke="var(--background)" strokeWidth={1.5} />
                    </g>
                  );
                })}
              </svg>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
                {[
                  "North America",
                  "South America",
                  "Europe",
                  "Africa",
                  "Middle East",
                  "South Asia",
                  "Southeast Asia",
                  "Oceania",
                ].map((r) => (
                  <Badge key={r} variant="outline">
                    <Globe2 className="size-3" />
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-3xl border border-border bg-card overflow-hidden h-full flex flex-col">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-secondary/40">
                <div className="text-sm font-semibold">
                  {region === "All" ? "All locations" : region}
                </div>
                <div className="text-xs text-muted-foreground">{filtered.length} cities</div>
              </div>
              <ul className="max-h-[420px] overflow-y-auto divide-y divide-border">
                {filtered.map((l) => (
                  <li
                    key={l.name}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand-ink">
                      <MapPin className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{l.name}</div>
                      <div className="text-xs text-muted-foreground">{l.country}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                      {l.clients} {l.clients === 1 ? "client" : "clients"}
                    </Badge>
                  </li>
                ))}
                {filtered.length === 0 ? (
                  <li className="px-5 py-8 text-sm text-center text-muted-foreground">No locations in this region yet.</li>
                ) : null}
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
