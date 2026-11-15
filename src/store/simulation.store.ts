import { create } from 'zustand';

/** The bot simulation running in this browser tab (see src/hooks/use-fleet-simulation.ts). */
interface SimulationState {
  running: boolean;
  /** Starting up: fetching the road and creating the bot units. */
  starting: boolean;
  botCount: number;
  organizationId: string | null;
  routeName: string | null;
  /** Stops by itself at this time (epoch ms). */
  endsAt: number | null;
  /** Last time positions reached Firestore. */
  lastWriteAt: number | null;
  error: string | null;
  set: (patch: Partial<Omit<SimulationState, 'set'>>) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  running: false,
  starting: false,
  botCount: 0,
  organizationId: null,
  routeName: null,
  endsAt: null,
  lastWriteAt: null,
  error: null,
  set: (patch) => set(patch),
}));
