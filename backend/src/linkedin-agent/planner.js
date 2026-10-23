import { DateTime } from 'luxon';
import crypto from 'node:crypto';

// Deterministic small time offset per slot, so posts don't all land on :00 exactly.
function jitterFor(key, maxMin) {
  if (!maxMin) return 0;
  const h = crypto.createHash('md5').update(key).digest().readUInt16BE(0);
  return (h % (2 * maxMin + 1)) - maxMin;
}

// Turns a user's weekly slots into concrete UTC times in the next `hours`.
// Respects the user's timezone (including DST) and their max-posts-per-day cap.
function computeUpcomingSlots(schedule, from = new Date(), hours = 48) {
  const zone = schedule.timezone || 'UTC';
  const start = DateTime.fromJSDate(from, { zone });
  if (!start.isValid) return [];
  const end = start.plus({ hours });
  const all = [];

  for (let d = -1; d <= Math.ceil(hours / 24) + 1; d++) {
    const day = start.startOf('day').plus({ days: d });
    (schedule.slots || []).forEach((slot, idx) => {
      if (slot.day !== day.weekday || !/^\d{2}:\d{2}$/.test(slot.time || '')) return;
      const [hh, mm] = slot.time.split(':').map(Number);
      const slotKey = `${day.toISODate()}|${idx}|${slot.time}`;
      const at = day.set({ hour: hh, minute: mm })
        .plus({ minutes: jitterFor(slotKey, schedule.jitterMinutes) });
      all.push({
        slotKey, at, localDate: day.toISODate(),
        theme: slot.theme, format: slot.format,
      });
    });
  }

  all.sort((a, b) => a.at.toMillis() - b.at.toMillis());
  const perDay = {};
  const cap = schedule.maxPostsPerDay || 2;
  return all
    .filter((s) => (perDay[s.localDate] = (perDay[s.localDate] || 0) + 1) <= cap)  // cap first
    .filter((s) => s.at > start && s.at <= end)                                     // then window
    .map((s) => ({
      slotKey: s.slotKey, scheduledFor: s.at.toUTC().toJSDate(),
      theme: s.theme, format: s.format,
    }));
}

export { computeUpcomingSlots };
export default computeUpcomingSlots;
