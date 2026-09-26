from urllib.request import urlopen
from pathlib import Path
import re,json
base='https://www.sherwin-williams.com'
api='https://api.sherwin-williams.com/shared-color-service/color/'
records={};sources=[]
for section in ['exterior-house-colors','exterior-accent-colors','front-door-paint-colors']:
 url=base+'/en-us/color/exterior-paint-colors/'+section
 html=urlopen(url,timeout=30).read().decode()
 match=re.search(r'data-resource-path="([^"]+)"[^>]*class="cmp-color-grid-v2"',html)
 model=json.load(urlopen(base+match[1]+'.model.json',timeout=30))
 group=json.load(urlopen(api+'group/identifier/'+model['groupId'],timeout=30))
 subgroup=next(g for g in group['subgroups'] if g['groupDescription']['name'].startswith('All '))
 endpoint=api+'byGroup/identifier/'+subgroup['identifier']
 colors=json.load(urlopen(endpoint,timeout=30))
 added=0
 for c in colors:
  if not c.get('isExterior') or c.get('status')!='Active':continue
  attrs={a['identifier']:a['attributeValues'][0]['value'] for a in c.get('attributes',[]) if a.get('attributeValues')}
  slug=attrs.get('ATT_Color_URL_Keywords')
  family=c['colorFamilyNames'][0]
  assert slug and re.fullmatch(r'[0-9a-fA-F]{6}',c['hex'])
  entry=records.setdefault(c['colorNumber'],{'name':c['name'],'code':c['colorNumberDisplay'],'hex':'#'+c['hex'].lower(),'family':family.lower(),'url':base+'/en-us/color/color-family/'+family.lower()+'-paint-colors/'+slug.lower(),'collections':[]})
  entry['collections'].append(section);added+=1
 sources.append({'title':group['groupDescription']['name'],'url':url,'dataUrl':endpoint,'exteriorColors':added})
 print(section,len(colors),'listed,',added,'marked exterior')
output={'colors':list(records.values())}
output['colors'].sort(key=lambda c: (['green','blue','neutral','white','yellow','orange','red','purple'].index(c['family']), -sum(int(c['hex'][i:i+2],16)*w for i,w in [(1,.2126),(3,.7152),(5,.0722)])))
root=Path(__file__).resolve().parents[1]
(root/'dist'/'paint-colors.js').write_text('// Official Sherwin-Williams exterior collection data.\n// Digital representations; verify final paint with physical samples.\nexport const paintSources = '+json.dumps(sources,indent=2)+';\nexport const paintColors = '+json.dumps(output['colors'],indent=2)+';\n')
print('Wrote',len(records),'exterior colors to dist/paint-colors.js')
