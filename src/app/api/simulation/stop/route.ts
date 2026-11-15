import { NextResponse } from 'next/server';
import { stopSimulation } from '@/actions/simulation';

/**
 * Called with fetch(…, { keepalive: true }) when the tab running the simulation closes,
 * so the bots leave the map instead of lingering as "last seen".
 */
export async function POST() {
  try {
    await stopSimulation();
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not stop the simulation';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
