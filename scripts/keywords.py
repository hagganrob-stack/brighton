import json, csv, re
import os
D=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..') + '/'
pubs=json.load(open(D+'data/pubs.json')); areas={a['slug']:a for a in json.load(open(D+'data/areas.json'))}
SITE='https://brightonbeerguide.co.uk'
# How each area is searched: add the town where the name alone is ambiguous.
AQ={'kemptown':'kemptown','the-lanes':'the lanes brighton','north-laine':'north laine','hanover':'hanover brighton',
 'seven-dials':'seven dials brighton','london-road':'london road brighton','preston-park':'preston park brighton',
 'fiveways':'fiveways brighton','lewes-road':'lewes road brighton','brunswick':'brunswick hove','hove':'hove',
 'seafront':'brighton seafront','rottingdean':'rottingdean'}
ROUND=[('sunday-roasts','sundayRoast',['sunday roast brighton','best sunday roast brighton','sunday lunch brighton'],'sunday roast {a}'),
 ('pub-quizzes','pubQuiz',['pub quiz brighton','brighton pub quizzes','quiz night brighton'],'pub quiz {a}'),
 ('beer-gardens','beerGarden',['beer gardens brighton','best beer gardens brighton','pubs with beer gardens brighton'],'beer garden {a}'),
 ('dog-friendly','dogFriendly',['dog friendly pubs brighton','dog friendly bars brighton'],'dog friendly pubs {a}'),
 ('live-music','liveMusic',['live music pubs brighton','pubs with live music brighton'],'live music pubs {a}'),
 ('live-sport','liveSport',['pubs showing football brighton','sports bars brighton','pubs showing sport brighton'],'pubs showing sport {a}')]
rows=[]
add=lambda k,u,g: rows.append((k,SITE+u,g))
for k in ['brighton beer guide','pubs in brighton','brighton pubs','best pubs in brighton','pubs in brighton and hove','brighton pub guide','best pubs brighton and hove']: add(k,'/','Core')
for k in ['all pubs in brighton','list of pubs in brighton']: add(k,'/pubs','Core')
for slug,q in AQ.items():
  if not any(p['area']==slug for p in pubs): continue
  base=q.replace(' brighton','').replace(' hove','') if slug not in ('hove','brunswick') else q
  ks={f'pubs in {q}', f'{base} pubs' if slug!='hove' else 'hove pubs'}
  if slug=='brunswick': ks={'pubs in brunswick hove','brunswick pubs hove'}
  for k in sorted(ks): add(k,f'/areas/{slug}','Areas')
combos=0
for rs,key,cores,tpl in ROUND:
  for k in cores: add(k,f'/best/{rs}','Best of')
  for slug,q in AQ.items():
    if sum(1 for p in pubs if p['area']==slug and p['features'][key]['value']=='yes')>=3:
      add(tpl.format(a=q),f'/best/{rs}/{slug}','Area + feature'); combos+=1
def town(p): return 'hove' if (p['postcode'] or '').startswith('BN3') else ('rottingdean' if p['area']=='rottingdean' else 'brighton')
PLACE=r'\b(brighton|hove|rottingdean|kemptown|saltdean)\b'
used=set()
for p in pubs:
  full=p['name'].lower().replace('&','and')
  parts=[x.strip() for x in re.split(r'\s[|@–-]\s|:|\s/\s|,',full) if x.strip()]
  n=parts[0]
  m=re.search(PLACE,full)
  place=m.group(1) if m else town(p)
  if n in used and len(parts)>1: n=parts[1]          # e.g. two Bison Beer venues
  n=re.sub(r"[^a-z0-9' ]",' ',n); n=re.sub(r'\s+',' ',n).strip()
  used.add(parts[0])
  k=n if re.search(PLACE,n) else f'{n} {place}'
  add(k,f"/pubs/{p['slug']}",'Pubs')
# dedupe keeping first
seen=set(); out=[]
for r in rows:
  if r[0] not in seen: seen.add(r[0]); out.append(r)
with open(D+'seo/keywords.csv','w',newline='') as f:
  w=csv.writer(f); w.writerow(['Keyword','Target URL','Group']); w.writerows(out)
core=[r for r in out if r[2]!='Pubs']; pubk=[r for r in out if r[2]=='Pubs']
open(D+'seo/keywords-core.txt','w').write('\n'.join(r[0] for r in core)+'\n')
open(D+'seo/keywords-pubs.txt','w').write('\n'.join(r[0] for r in pubk)+'\n')
from collections import Counter
print(Counter(r[2] for r in out), 'total',len(out),'combos',combos)
