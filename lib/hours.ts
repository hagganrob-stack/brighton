// Parse Google-style opening hours ("12–11 pm", "2:30 pm–12 am", "Closed", "Open 24 hours").
export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export const DAY_SCHEMA: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const norm = (s: string) => s.replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();

function to24(h: number, m: number, ap: string) {
  let hh = h % 12;
  if (ap === 'pm') hh += 12;
  return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Returns [{opens, closes}] in HH:MM, [] when closed, or null when unparseable. */
export function parseRanges(raw: string | undefined): { opens: string; closes: string }[] | null {
  if (!raw) return null;
  const s = norm(raw).toLowerCase();
  if (/closed/.test(s)) return [];
  if (/24 hours/.test(s)) return [{ opens: '00:00', closes: '23:59' }];
  const out: { opens: string; closes: string }[] = [];
  for (const part of s.split(/,\s*/)) {
    const m = part.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[–-]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
    if (!m) return null;
    const endAp = m[6];
    const startAp = m[3] || endAp; // Google omits the start meridiem when it matches the end
    out.push({ opens: to24(+m[1], +(m[2] || 0), startAp), closes: to24(+m[4], +(m[5] || 0), endAp) });
  }
  return out;
}

export function displayHours(raw: string | undefined) {
  return raw ? norm(raw) : 'Not listed';
}
