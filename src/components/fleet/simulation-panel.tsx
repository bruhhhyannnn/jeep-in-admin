'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Bot } from 'lucide-react';
import { Button, PanelActionRow, SidePanel } from '@/components/ui';
import { FilterChips, Notice } from '@/components/common';
import { useFleetSimulation, useNow } from '@/hooks';
import { SIMULATION_TICK_S } from '@/lib/fleet-simulation';
import { timeAgo } from '@/lib';

const BOT_OPTIONS = ['3', '4', '5'] as const;
const MINUTE_OPTIONS = ['15', '30', '60'] as const;

/**
 * "Simulate jeeps": bot units that drive the organization's route like real drivers, so
 * the commuter apps and this map can be demoed and tested. Runs in this tab.
 */
export function SimulationPanel({
  isOpen,
  onClose,
  organizationId,
  routeId,
  routeName,
}: {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  routeId: string;
  routeName: string;
}) {
  const sim = useFleetSimulation(true);
  const [bots, setBots] = useState<(typeof BOT_OPTIONS)[number]>('4');
  const [minutes, setMinutes] = useState<(typeof MINUTE_OPTIONS)[number]>('30');
  const writesPerHour = Math.round((3600 / SIMULATION_TICK_S) * Number(bots));

  const start = async () => {
    try {
      await sim.start({
        organizationId,
        routeId,
        routeName,
        count: Number(bots),
        minutes: Number(minutes),
      });
      toast.success(`${bots} simulated jeeps are on the road`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start the simulation');
    }
  };

  const remove = async () => {
    try {
      await sim.remove();
      toast.success('Simulated units removed');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not remove the simulated units');
    }
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Simulate jeeps"
      subtitle={routeName}
      busy={sim.starting}
      footer={
        sim.running ? (
          <Button variant="danger-outline" onClick={() => void sim.stop()}>
            Stop simulation
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={sim.starting}>
              Cancel
            </Button>
            <Button
              onClick={() => void start()}
              isLoading={sim.starting}
              loadingText="Starting…"
              startIcon={<Bot size={16} />}
            >
              Start
            </Button>
          </>
        )
      }
    >
      <div className="space-y-6">
        <p className="text-ink-muted text-[14px] leading-relaxed">
          Bot units drive this route like drivers sharing from the app: they follow the road, pause
          at stops and turn around at the terminal. They show up here and in the commuter apps as
          SIM-01, SIM-02… with a simulated driver. Keep this tab open — closing it takes them off
          the map.
        </p>

        <div>
          <p className="text-label text-ink-muted mb-2">Jeeps</p>
          <FilterChips
            options={BOT_OPTIONS.map((v) => ({ value: v, label: `${v} jeeps` }))}
            value={bots}
            onChange={setBots}
          />
        </div>

        <div>
          <p className="text-label text-ink-muted mb-2">Run for</p>
          <FilterChips
            options={MINUTE_OPTIONS.map((v) => ({ value: v, label: `${v} min` }))}
            value={minutes}
            onChange={setMinutes}
          />
          <p className="text-ink-muted mt-2 text-[13px]">
            About {writesPerHour.toLocaleString()} Firestore writes an hour. The free plan allows
            20,000 a day.
          </p>
        </div>

        {!!sim.status?.units && !sim.running && (
          <PanelActionRow
            tone="danger"
            title="Remove simulated units"
            description={`Deletes SIM-01…SIM-0${sim.status.units} from Jeepneys. Real units are not touched.`}
            action={
              <Button variant="danger-outline" size="sm" onClick={() => void remove()}>
                Remove
              </Button>
            }
          />
        )}
      </div>
    </SidePanel>
  );
}

/** Shown on the Fleet overview while bots run, or when a run left them on the map. */
export function SimulationNotice() {
  const sim = useFleetSimulation(true);
  const now = useNow(5000);

  if (sim.running) {
    const minutesLeft = sim.endsAt ? Math.max(0, Math.ceil((sim.endsAt - now) / 60000)) : null;
    return (
      <Notice
        icon={<Bot size={17} />}
        tone={sim.error ? 'error' : 'live'}
        dashed={false}
        title={`Simulating ${sim.botCount} jeeps${sim.routeName ? ` on ${sim.routeName}` : ''}`}
        description={
          sim.error ??
          `Updated ${sim.lastWriteAt ? `${timeAgo(new Date(sim.lastWriteAt), now)} ago` : 'just now'} · stops by itself in ${minutesLeft} min · keep this tab open`
        }
        action={
          <Button variant="outline" size="sm" onClick={() => void sim.stop()}>
            Stop
          </Button>
        }
      />
    );
  }

  if (sim.status?.sharing) {
    return (
      <Notice
        icon={<Bot size={17} />}
        title="Simulated jeeps are still on the map"
        description="A simulation ended without taking them off. Commuters see them as last seen."
        action={
          <Button variant="outline" size="sm" onClick={() => void sim.stop()}>
            Take them off
          </Button>
        }
      />
    );
  }

  return null;
}
