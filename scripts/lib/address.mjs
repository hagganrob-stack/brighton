// Pick the street line out of a Google Maps address, which sometimes starts with a
// building/business name, a what3words link or a unit number.
const STREET =
  /\b(rd|road|st|street|ave|avenue|pl|place|sq|square|terrace|terr|ter|ln|lane|dr|drive|parade|pde|gardens|gdns|hill|row|way|crescent|cres|grove|gr|arches|mews|villas|close|walk|gate|esplanade|promenade|court|ct)\b\.?$/i;
const SKIP = /^(https?:|brighton and hove$|brighton$|hove$|city centre$|unit\b)/i;

export function streetLine(address, name = '') {
  const parts = (address || '').split(',').map((s) => s.trim()).filter((s) => s && !SKIP.test(s));
  const bareName = name.replace(/^the\s+/i, '').toLowerCase();
  for (let part of parts) {
    if (bareName && part.toLowerCase().startsWith(bareName + ' ')) part = part.slice(bareName.length + 1);
    // "Cleveland Road 27A" -> "27A Cleveland Road"
    const trailing = part.match(/^(.*\D)\s+(\d+[A-Z]?)$/);
    if (trailing && STREET.test(trailing[1])) part = `${trailing[2]} ${trailing[1]}`;
    if (STREET.test(part)) return part;
  }
  return parts[0] || '';
}
