/**
 * Bot jeeps for demos and testing — the movement model, shared by the dashboard's
 * "Simulate jeeps" panel and scripts/simulate-fleet.ts. Pure: no Firebase, no DOM.
 *
 * Each bot drives the same road the commuter apps draw (Mapbox Directions through the
 * stops in order), eases between 15 and 35 km/h, pauses at some stops, rests at the
 * terminal and turns around. Bot 2 never sends a direction, so the apps have to infer
 * it from heading. Positions carry a few metres of GPS noise.
 */

/** The driver app sends a position every 5 s. */
export const SIMULATION_TICK_S = 5;
export const MAX_BOTS = 5;

/** driver_locations/bot-0N — never a real driver's uid. */
export const botId = (n: number) => `bot-0${n}`;
/** jeepneys/sim-0N, plate SIM-0N. */
export const botJeepneyId = (n: number) => `sim-0${n}`;

export type LngLat = [number, number];

/** A direction's road and stops, as fetched on the server (plain JSON). */
export interface RoadLine {
  directionId: string;
  line: LngLat[];
  stops: { name: string; lng: number; lat: number }[];
}

export interface RoadPath {
  directionId: string;
  coords: LngLat[];
  /** Metres from the start to each vertex. */
  along: number[];
  length: number;
  /** Stops in order, as metres along the road. */
  stops: { name: string; at: number }[];
}

export interface Bot {
  n: number;
  dir: number;
  at: number;
  /** m/s */
  speed: number;
  target: number;
  heading: number;
  nextStop: number;
  /** Paused (at a stop or the terminal) until this time. */
  pausedUntil: number;
  turnAround: boolean;
  sendsDirection: boolean;
  /** No signal until this time (the script's --flaky). */
  offlineUntil: number;
}

/** What the driver app would write for a bot right now. */
export interface BotReading {
  n: number;
  lat: number;
  long: number;
  heading: number;
  /** m/s, 0 while stopped. */
  speed: number;
  /** null when the bot leaves direction to the apps' heading inference. */
  directionId: string | null;
}

// ─── Geometry ────────────────────────────────────────────────────────────────

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export function metres([aLng, aLat]: LngLat, [bLng, bLat]: LngLat) {
  const h =
    Math.sin(rad(bLat - aLat) / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLng - aLng) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

function bearing([aLng, aLat]: LngLat, [bLng, bLat]: LngLat) {
  const y = Math.sin(rad(bLng - aLng)) * Math.cos(rad(bLat));
  const x =
    Math.cos(rad(aLat)) * Math.sin(rad(bLat)) -
    Math.sin(rad(aLat)) * Math.cos(rad(bLat)) * Math.cos(rad(bLng - aLng));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

/** Position and travel bearing `at` metres along the road. */
function pointAt(path: RoadPath, at: number): { position: LngLat; heading: number } {
  const d = Math.min(Math.max(at, 0), path.length);
  let i = path.along.findIndex((a) => a >= d);
  if (i <= 0) i = 1;
  const a = path.coords[i - 1];
  const b = path.coords[i];
  const span = path.along[i] - path.along[i - 1] || 1;
  const t = (d - path.along[i - 1]) / span;
  return {
    position: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
    heading: bearing(a, b),
  };
}

/** Metres along the road of the point nearest to `p`. */
function project(path: RoadPath, p: LngLat) {
  let best = { at: 0, dist: Infinity };
  const kx = Math.cos(rad(p[1]));
  for (let i = 1; i < path.coords.length; i++) {
    const a = path.coords[i - 1];
    const b = path.coords[i];
    const dx = (b[0] - a[0]) * kx;
    const dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy || 1e-12;
    const t = Math.min(1, Math.max(0, ((p[0] - a[0]) * kx * dx + (p[1] - a[1]) * dy) / len2));
    const q: LngLat = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const dist = metres(p, q);
    if (dist < best.dist) best = { at: path.along[i - 1] + metres(a, q), dist };
  }
  return best.at;
}

/** Moves a point by metres east / north. */
function offset([lng, lat]: LngLat, east: number, north: number): LngLat {
  return [lng + east / (111320 * Math.cos(rad(lat))), lat + north / 110540];
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 0.5;
const KMH = 1 / 3.6;

// ─── Model ───────────────────────────────────────────────────────────────────

export function buildRoadPath({ directionId, line, stops }: RoadLine): RoadPath {
  const along = [0];
  for (let i = 1; i < line.length; i++) along.push(along[i - 1] + metres(line[i - 1], line[i]));
  const path: RoadPath = {
    directionId,
    coords: line,
    along,
    length: along[along.length - 1],
    stops: [],
  };
  path.stops = stops.map((s) => ({ name: s.name, at: project(path, [s.lng, s.lat]) }));
  return path;
}

/** Alternates directions and spaces each direction's bots out along the road. */
export function placeBots(paths: RoadPath[], count: number): Bot[] {
  return Array.from({ length: count }, (_, i) => {
    const dir = i % paths.length;
    const path = paths[dir];
    const sameDirection = Math.ceil((count - dir) / paths.length);
    const slot = Math.floor(i / paths.length);
    const at = path.length * (0.08 + (0.8 * (slot + rand(0, 0.4))) / sameDirection);
    return {
      n: i + 1,
      dir,
      at,
      speed: rand(15, 30) * KMH,
      target: rand(15, 35) * KMH,
      heading: pointAt(path, at).heading,
      nextStop: path.stops.findIndex((s) => s.at > at),
      pausedUntil: 0,
      turnAround: false,
      sendsDirection: i + 1 !== 2,
      offlineUntil: 0,
    };
  });
}

/** Moves a bot one tick: eases toward its speed, pauses at some stops, turns at the end. */
export function step(bot: Bot, paths: RoadPath[], now: number) {
  if (now < bot.pausedUntil) {
    bot.speed = 0;
    return;
  }
  if (bot.turnAround) {
    bot.turnAround = false;
    bot.dir = (bot.dir + 1) % paths.length;
    bot.at = 0;
    bot.nextStop = 0;
  }
  const path = paths[bot.dir];

  if (Math.random() < 0.15) bot.target = rand(15, 35) * KMH;
  // About 0.5 m/s² either way, like traffic.
  bot.speed += Math.max(-2.5, Math.min(2.5, bot.target - bot.speed));
  let next = bot.at + bot.speed * SIMULATION_TICK_S;

  const stop = path.stops[bot.nextStop];
  if (stop && next >= stop.at) {
    next = stop.at;
    bot.nextStop += 1;
    if (Math.random() < 0.6) bot.pausedUntil = now + rand(10, 40) * 1000;
  }
  if (next >= path.length) {
    next = path.length;
    bot.pausedUntil = now + rand(30, 90) * 1000; // rest at the terminal, then head back
    bot.turnAround = true;
  }
  bot.at = next;
}

/** What the driver app would write now: a few metres of GPS noise, heading kept while still. */
export function reading(bot: Bot, paths: RoadPath[]): BotReading {
  const path = paths[bot.dir];
  const { position, heading } = pointAt(path, bot.at);
  const moving = bot.speed > 0.5;
  if (moving) bot.heading = (heading + gauss() * 4 + 360) % 360;
  const [lng, lat] = offset(position, gauss() * 4, gauss() * 4);
  return {
    n: bot.n,
    lat,
    long: lng,
    heading: Math.round(bot.heading * 10) / 10,
    speed: moving ? Math.max(0, Math.round((bot.speed + gauss() * 0.3) * 10) / 10) : 0,
    directionId: bot.sendsDirection ? path.directionId : null,
  };
}

/** One line per bot for logs and the dashboard. */
export function describeBot(bot: Bot, paths: RoadPath[], now: number) {
  const path = paths[bot.dir];
  const state =
    now < bot.offlineUntil
      ? 'no signal'
      : now < bot.pausedUntil
        ? 'stopped'
        : `${Math.round(bot.speed * 3.6)} km/h`;
  return `S0${bot.n} ${path.directionId} ${(bot.at / 1000).toFixed(1)}/${(path.length / 1000).toFixed(1)} km ${state}`;
}

/** The road request the commuter apps make (src/api/directions.ts), so bots stay on their line. */
export function directionsUrl(stops: { lng: number; lat: number }[], token: string) {
  const coords = stops.map((s) => `${s.lng},${s.lat}`).join(';');
  return `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?alternatives=false&geometries=geojson&overview=full&access_token=${token}`;
}
