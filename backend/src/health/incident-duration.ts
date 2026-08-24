export const MINOR_SELF_RESOLVED_SECONDS = 60;

export function computeIncidentDurationSeconds(startedAt: Date, endedAt: Date): number {
  return Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
}

export function isMinorSelfResolved(fromStatus: string, durationSeconds: number): boolean {
  return fromStatus === 'degraded' && durationSeconds < MINOR_SELF_RESOLVED_SECONDS;
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${rest}s`;
  if (minutes > 0) return `${minutes}m ${rest}s`;
  return `${rest}s`;
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatIncidentRange(
  fromStatus: string,
  startedAt: Date,
  endedAt: Date,
  durationSeconds: number,
): string {
  const label = fromStatus === 'offline' ? 'Offline' : 'Degraded';
  return `${label} ${formatClock(startedAt)} → Recovered ${formatClock(endedAt)} (${formatDuration(durationSeconds)})`;
}
