/**
 * Time-zone and daylight-saving correctness for scheduling.
 *
 * Verified against real IANA data via Intl, including the exact instants
 * where US and EU clocks change in 2027 (they change on different dates,
 * which is its own class of bug). This is one of the few items on the
 * end-to-end list that can be proven without a provider.
 */
import { wallClockToIso, zoneOffsetMs } from '../lib/calendar/time';

let pass = 0, fail = 0;

function eq(name: string, got: unknown, want: unknown) {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; return; }
  fail++;
  console.error(`  FAIL ${name}\n    want ${JSON.stringify(want)}\n    got  ${JSON.stringify(got)}`);
}

/** What a given instant reads as on a wall clock in `zone`. */
function wallClockIn(iso: string, zone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: zone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

console.log('offsets');
eq('New York is UTC-5 in January', zoneOffsetMs(new Date('2027-01-15T12:00:00Z'), 'America/New_York'), -5 * 3600_000);
eq('New York is UTC-4 in July', zoneOffsetMs(new Date('2027-07-15T12:00:00Z'), 'America/New_York'), -4 * 3600_000);
eq('London is UTC+0 in January', zoneOffsetMs(new Date('2027-01-15T12:00:00Z'), 'Europe/London'), 0);
eq('London is UTC+1 in July', zoneOffsetMs(new Date('2027-07-15T12:00:00Z'), 'Europe/London'), 3600_000);
eq('Kolkata is UTC+5:30 year round', zoneOffsetMs(new Date('2027-07-15T12:00:00Z'), 'Asia/Kolkata'), 5.5 * 3600_000);

console.log('wall clock survives the round trip');
/*
  THE CORE GUARANTEE. Whatever the organiser typed must read back as exactly
  that on a clock in the zone they chose. If this holds, the instant stored
  in Mentable and sent to the provider is the one they meant.
*/
const cases: [string, string, string][] = [
  ['2027-01-20', '16:00', 'America/New_York'],
  ['2027-07-20', '16:00', 'America/New_York'],   // EDT
  ['2027-01-20', '09:30', 'Europe/London'],
  ['2027-07-20', '09:30', 'Europe/London'],      // BST
  ['2027-02-10', '14:15', 'Asia/Kolkata'],       // half-hour offset
  ['2027-11-05', '23:45', 'Australia/Sydney'],   // southern DST, next day in UTC
  ['2027-06-01', '00:00', 'UTC'],
];
for (const [d, t, z] of cases) {
  const iso = wallClockToIso(d, t, z)!;
  eq(`${d} ${t} ${z}`, wallClockIn(iso, z), `${d.slice(8)}/${d.slice(5, 7)}/${d.slice(0, 4)}, ${t}`);
}

console.log('daylight-saving boundaries');
/*
  US clocks go forward 2027-03-14 and back 2027-11-07; the EU moves on
  2027-03-28 and 2027-10-31. A meeting booked either side of one of those
  must still land on the wall clock that was chosen, and the two regions
  must be handled independently.
*/
for (const [d, t, z] of [
  ['2027-03-13', '16:00', 'America/New_York'],  // day before US spring forward
  ['2027-03-15', '16:00', 'America/New_York'],  // day after
  ['2027-11-06', '16:00', 'America/New_York'],  // day before US fall back
  ['2027-11-08', '16:00', 'America/New_York'],  // day after
  ['2027-03-27', '10:00', 'Europe/Berlin'],     // day before EU change
  ['2027-03-29', '10:00', 'Europe/Berlin'],     // day after
  // Between the two: the US has changed, the EU has not.
  ['2027-03-20', '16:00', 'America/New_York'],
  ['2027-03-20', '16:00', 'Europe/Berlin'],
] as [string, string, string][]) {
  const iso = wallClockToIso(d, t, z)!;
  eq(`${d} ${t} ${z}`, wallClockIn(iso, z), `${d.slice(8)}/${d.slice(5, 7)}/${d.slice(0, 4)}, ${t}`);
}

console.log('cross-zone agreement');
/*
  Booked from London for 4pm New York: both people must be describing the
  same instant, and each must see it correctly on their own clock.
*/
{
  const iso = wallClockToIso('2027-07-20', '16:00', 'America/New_York')!;
  eq('4pm New York reads as 4pm in New York', wallClockIn(iso, 'America/New_York'), '20/07/2027, 16:00');
  eq('…and as 9pm in London', wallClockIn(iso, 'Europe/London'), '20/07/2027, 21:00');
  eq('…and the stored instant is UTC', iso, '2027-07-20T20:00:00.000Z');
}

console.log('the hour that does not exist');
/*
  02:30 on a spring-forward morning is never on the clock. There is no right
  answer, but there IS a wrong one: returning something invalid, or silently
  landing on a different day. It must resolve to a real instant within an
  hour of the intent.
*/
{
  const iso = wallClockToIso('2027-03-14', '02:30', 'America/New_York');
  eq('resolves to a real instant', typeof iso === 'string' && !Number.isNaN(Date.parse(iso!)), true);
  const drift = Math.abs(Date.parse(iso!) - Date.parse('2027-03-14T07:30:00Z'));
  eq('within an hour of the intended time', drift <= 3600_000, true);
}

console.log('malformed input');
eq('empty date', wallClockToIso('', '16:00', 'UTC'), null);
eq('empty time', wallClockToIso('2027-01-01', '', 'UTC'), null);
eq('garbage date', wallClockToIso('not-a-date', '16:00', 'UTC'), null);
// An unknown zone must not throw; it degrades to UTC rather than crashing
// the whole scheduling panel.
eq('unknown zone degrades instead of throwing',
  typeof wallClockToIso('2027-01-01', '16:00', 'Mars/Olympus') === 'string', true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
