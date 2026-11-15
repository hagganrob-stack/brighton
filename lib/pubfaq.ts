// Profile-page extras for every pub: "getting there" and an FAQ, built only from the pub's data.
import { type Pub, areaName, streetName, nearestStation, nearbyPubs, formatDistance, addressLines } from './data';
import { latestClose, listJoin } from './guides';

export type Faq = { q: string; a: string };
const walk = (m: number) => Math.max(1, Math.round(m / 80));

export function gettingThere(p: Pub) {
  const st = nearestStation(p);
  const { town, postcode } = addressLines(p);
  const lines = [`${p.name} is on ${streetName(p)} in ${areaName(p.area)}, ${town} ${postcode}.`];
  lines.push(
    st.m <= 2000
      ? `The nearest railway station is ${st.name}, about ${formatDistance(st.m)} away (roughly ${walk(st.m)} minutes' walk in a straight line).`
      : `There is no railway station close by: the nearest is ${st.name}, about ${formatDistance(st.m)} away, so a bus or taxi is easier.`,
  );
  return { lines, station: st };
}

export function pubFaqs(p: Pub): Faq[] {
  const f = p.features;
  const out: Faq[] = [];
  const st = nearestStation(p);
  out.push({
    q: `Where is ${p.name}?`,
    a: `${p.name} is at ${p.address?.replace(/, Brighton and Hove/g, '')}, in the ${areaName(p.area)} area of Brighton & Hove. The nearest railway station is ${st.name}, about ${formatDistance(st.m)} away.`,
  });
  const late = latestClose(p);
  if (late) out.push({ q: `What time does ${p.name} close?`, a: `Its Google listing gives the latest closing time as ${late.label} on ${late.day}s. Full opening hours for every day are on this page. Hours can change, especially on bank holidays, so check with the pub before you go.` });
  if (f.food.value !== 'unknown' || f.sundayRoast.value === 'yes')
    out.push({
      q: `Does ${p.name} serve food?`,
      a: f.food.value === 'no' ? `Its own website says it doesn't serve food. Check the pub's website for any changes.` : `Yes, according to its own website${f.sundayRoast.value === 'yes' ? ', including Sunday roasts' : ''}${f.veganOptions?.value === 'yes' ? ', with vegan options' : ''}. Menus and kitchen hours change, so check before you go.`,
    });
  if (f.dogFriendly.value !== 'unknown')
    out.push({ q: `Is ${p.name} dog friendly?`, a: f.dogFriendly.value === 'yes' ? `Yes, its own website says dogs are welcome. Some pubs limit dogs to certain areas or times, so check with the pub before you go.` : `Its own website says dogs aren't allowed. Assistance dogs are usually an exception; check with the pub.` });
  const near = nearbyPubs(p, 3);
  if (near.length) out.push({ q: `What pubs are near ${p.name}?`, a: `The nearest pubs in this guide are ${listJoin(near.map((n) => `${n.pub.name} (about ${formatDistance(n.distanceM)})`))}, measured in a straight line.` });
  return out;
}
