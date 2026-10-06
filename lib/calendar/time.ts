/**
 * Wall-clock time in a named zone, as a UTC instant.
 *
 * Extracted from PlanConversation so it can be tested directly. Scheduling
 * correctness across time zones and daylight saving is not something a
 * screenshot can show, and it is the part most likely to be quietly wrong.
 *
 * Pure, isomorphic, no I/O.
 */

/**
 * Resolve "2027-03-14 at 02:30 in America/New_York" to the real instant.
 *
 * The naive approach applies the BROWSER's current offset, which is wrong in
 * two common cases: the organiser is in a different zone from the meeting,
 * and the meeting is on the far side of a daylight-saving change from today.
 * The second one silently moves half of everybody's March meetings by an
 * hour. So the offset is asked of Intl for that specific instant in that
 * specific zone.
 */
export function wallClockToIso(date: string, time: string, zone: string): string | null {
  if (!date || !time) return null;
  const naive = new Date(`${date}T${time}:00Z`);
  if (Number.isNaN(naive.getTime())) return null;

  /*
    Two passes. The offset depends on the instant, and the instant depends on
    the offset, so the first pass uses the offset at the naive time and the
    second corrects it. This only matters within an hour of a DST boundary,
    which is exactly where correctness is hardest and where a one-pass
    version lands an hour out.
  */
  const first = zoneOffsetMs(naive, zone);
  const candidate = new Date(naive.getTime() - first);
  const second = zoneOffsetMs(candidate, zone);
  return new Date(naive.getTime() - second).toISOString();
}

/** How far `zone` is from UTC at a given instant, in milliseconds. */
export function zoneOffsetMs(instant: Date, zone: string): number {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: zone, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const parts = Object.fromEntries(dtf.formatToParts(instant).map((p) => [p.type, p.value]));
    const asUtc = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour === '24' ? '00' : parts.hour), Number(parts.minute), Number(parts.second),
    );
    return asUtc - instant.getTime();
  } catch {
    return 0;
  }
}

/** The viewer's own zone first, then the common ones. */
export function zoneOptions(current: string): string[] {
  const common = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Singapore', 'Australia/Sydney', 'UTC',
  ];
  return [current, ...common.filter((z) => z !== current)];
}
