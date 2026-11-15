import { useEffect } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  getSimulationRoads,
  getSimulationStatus,
  removeSimulation,
  startSimulation,
  stopSimulation,
  writeSimulatedLocations,
} from '@/actions';
import {
  SIMULATION_TICK_S,
  buildRoadPath,
  placeBots,
  reading,
  step,
  type Bot,
  type RoadPath,
} from '@/lib/fleet-simulation';
import { useSimulationStore } from '@/store';

/** Writes failing this many times in a row stop the run (e.g. the session expired). */
const MAX_FAILED_WRITES = 3;

// The run lives at module level, so it keeps going while you move between admin pages.
let timer: ReturnType<typeof setInterval> | null = null;
let bots: Bot[] = [];
let paths: RoadPath[] = [];
let writing = false;
let failedWrites = 0;
let queryClient: QueryClient | null = null;

/** Closing or reloading the tab takes the bots off the map. */
function onPageHide() {
  void fetch('/api/simulation/stop', { method: 'POST', keepalive: true });
}

function invalidate() {
  queryClient?.invalidateQueries({ queryKey: ['simulation-status'] });
  queryClient?.invalidateQueries({ queryKey: ['jeepneys'] });
}

async function tick() {
  const store = useSimulationStore.getState();
  const now = Date.now();
  if (store.endsAt && now >= store.endsAt) return stopRun();
  if (writing) return; // the last write is still in flight

  bots.forEach((b) => step(b, paths, now));
  writing = true;
  try {
    await writeSimulatedLocations(bots.map((b) => reading(b, paths)));
    failedWrites = 0;
    store.set({ lastWriteAt: Date.now(), error: null });
  } catch (err) {
    failedWrites += 1;
    store.set({ error: err instanceof Error ? err.message : 'Could not write positions' });
    if (failedWrites >= MAX_FAILED_WRITES) await stopRun();
  } finally {
    writing = false;
  }
}

async function startRun(options: {
  organizationId: string;
  routeId: string;
  routeName: string;
  count: number;
  minutes: number;
}) {
  const store = useSimulationStore.getState();
  if (store.running || store.starting) return;
  store.set({ starting: true, error: null });
  try {
    const roads = await getSimulationRoads(options.routeId);
    paths = roads.map(buildRoadPath);
    await startSimulation(options.organizationId, options.routeId, options.count);
    bots = placeBots(paths, options.count);
    failedWrites = 0;
    store.set({
      running: true,
      starting: false,
      botCount: options.count,
      organizationId: options.organizationId,
      routeName: options.routeName,
      endsAt: Date.now() + options.minutes * 60 * 1000,
    });
    window.addEventListener('pagehide', onPageHide);
    await tick();
    timer = setInterval(() => void tick(), SIMULATION_TICK_S * 1000);
    invalidate();
  } catch (err) {
    store.set({
      starting: false,
      error: err instanceof Error ? err.message : 'Could not start the simulation',
    });
    throw err;
  }
}

async function stopRun() {
  if (timer) clearInterval(timer);
  timer = null;
  window.removeEventListener('pagehide', onPageHide);
  useSimulationStore.getState().set({ running: false, endsAt: null });
  try {
    await stopSimulation();
  } finally {
    invalidate();
  }
}

async function removeBots() {
  if (useSimulationStore.getState().running) await stopRun();
  await removeSimulation();
  invalidate();
}

/**
 * Bot jeeps for demos, run by this browser tab (super admins only). The bots
 * write through server actions every 5 s and leave the map when the run stops,
 * the time is up or the tab closes.
 */
export function useFleetSimulation(enabled: boolean) {
  const qc = useQueryClient();
  useEffect(() => {
    queryClient = qc;
  }, [qc]);
  const state = useSimulationStore();

  // Bots left on the map by a run in another tab or a crashed one.
  const status = useQuery({
    queryKey: ['simulation-status'],
    queryFn: getSimulationStatus,
    enabled,
    refetchInterval: state.running ? false : 30_000,
  });

  return {
    ...state,
    status: status.data,
    start: startRun,
    stop: stopRun,
    remove: removeBots,
  };
}
