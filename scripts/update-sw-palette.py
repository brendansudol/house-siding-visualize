"""Refresh the exterior palette from Sherwin-Williams' complete color families."""
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path
from urllib.request import urlopen
import json
import re

BASE = 'https://www.sherwin-williams.com'
API = 'https://api.sherwin-williams.com/shared-color-service/color/'
FAMILIES = ['neutral', 'white', 'green', 'blue', 'yellow', 'orange', 'red', 'purple']


def get_json(url):
    with urlopen(url, timeout=40) as response:
        return json.load(response)


def fetch_family(family):
    url = f'{BASE}/en-us/color/color-family/{family}-paint-colors'
    with urlopen(url, timeout=40) as response:
        html = response.read().decode()
    path = next(p for p in re.findall(r'data-resource-path="([^"]+)"', html)
                if 'color_by_group_grid' in p)
    model = get_json(BASE + path + '.model.json')
    group = get_json(API + 'group/identifier/' + model['groupId'])
    all_group = next(g for g in group['subgroups']
                     if g['groupDescription']['name'].startswith('All '))
    full = get_json(API + 'group/identifier/' + all_group['identifier'])
    # "All" is a container, with Bright / Mid-Tone / Muted leaves. Also fetch
    # the sibling groups: some newer Designer colors appear only in those.
    groups = [g for g in group['subgroups'] if g != all_group]
    groups += full['subgroups'] or [full]
    entries = []
    for subgroup in groups:
        endpoint = API + 'byGroup/identifier/' + subgroup['identifier']
        colors = get_json(endpoint)
        # Some optional editorial groups are empty. Completeness is checked
        # against the full exterior catalog before the output is replaced.
        entries.append({'title': subgroup['groupDescription']['name'],
                        'url': url, 'dataUrl': endpoint, 'colors': colors})
    return {'family': family, 'groups': entries}


def write_palette(families):
    records, sources, raw = {}, [], {}
    for family in families:
        ids = set()
        endpoints = []
        for group in family['groups']:
            endpoints.append({'title': group['title'], 'url': group['dataUrl']})
            for color in group['colors']:
                if color.get('isExterior') is not True or color.get('status') != 'Active':
                    continue
                number = color['colorNumber']
                attrs = {a['identifier']: a['attributeValues'][0]['value']
                         for a in color.get('attributes', []) if a.get('attributeValues')}
                assert re.fullmatch(r'[0-9a-fA-F]{6}', color['hex']), number
                primary = color['colorFamilyNames'][0].lower()
                path = attrs.get('ATT_Color_url') or (
                    f'/en-us/color/color-family/{primary}-paint-colors/'
                    + attrs['ATT_Color_URL_Keywords'].lower())
                assert path.startswith('/en-us/color/color-family/'), path
                lrv = float(color['lrv'])
                assert 0 <= lrv <= 100, number
                entry = records.setdefault(number, {
                    'name': color['name'], 'code': color['colorNumberDisplay'],
                    'hex': '#' + color['hex'].lower(), 'family': primary,
                    'families': [], 'undertones': [], 'lrv': round(lrv, 2),
                    'url': BASE + path.rstrip('/')})
                if family['family'] not in entry['families']:
                    entry['families'].append(family['family'])
                if family['family'] == 'neutral':
                    for tone in ['Cool', 'Warm']:
                        if group['title'].startswith(tone) and tone.lower() not in entry['undertones']:
                            entry['undertones'].append(tone.lower())
                raw[number] = color
                ids.add(number)
        sources.append({'title': family['family'].title() + ' paint colors',
                        'url': family['groups'][0]['url'], 'groups': endpoints,
                        'exteriorColors': len(ids)})
        print(f"{family['family']}: {len(ids)} exterior colors")

    for number, entry in records.items():
        for field, source in [('strip', 'colorStripColors'), ('similar', 'similarColors')]:
            entry[field] = list(dict.fromkeys(
                records[c['number']]['code'] for c in raw[number].get(source, [])
                if c['number'] in records))
    colors = sorted(records.values(), key=lambda c: (FAMILIES.index(c['family']), -c['lrv'], c['code']))
    # Catch upstream errors before overwriting the usable, checked-in catalog.
    assert len(colors) >= 1500, f'Unexpectedly small exterior catalog: {len(colors)}'
    assert all(n in records for n in ['SW6207', 'SW7008', 'SW6340', 'SW7619', 'SW2839',
                                    'SW6468', 'SW7042', 'SW7508', 'SW7036', 'SW7005', 'SW7069'])
    root = Path(__file__).resolve().parents[1]
    output = ('// Official Sherwin-Williams color-family data, filtered to active exterior colors.\n'
              '// Digital representations; verify final paint with physical samples.\n'
              f'export const paletteUpdated = {json.dumps(date.today().isoformat())};\n'
              'export const paintSources = ' + json.dumps(sources, indent=2) + ';\n'
              'export const paintColors = [\n'
              + ',\n'.join('  ' + json.dumps(c, ensure_ascii=False) for c in colors) + '\n];\n')
    (root / 'dist' / 'paint-colors.js').write_text(output)
    print(f'Wrote {len(colors)} unique exterior colors to dist/paint-colors.js')


if __name__ == '__main__':
    with ThreadPoolExecutor(max_workers=4) as pool:
        families = list(pool.map(fetch_family, FAMILIES))
    write_palette(families)
