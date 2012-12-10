import subprocess
import os
import json
from tempfile import mkdtemp
import codecs

class NaturalEarth(object):
    def __init__(self, filename, profile):
        self.profile = profile
        
        # Convert shapefile to geojson by ogr2ogr.
        tmpdir = mkdtemp()
        try:
            tmpfile = os.path.join(tmpdir, os.path.splitext(os.path.basename(filename))[0]+'.json')
            ogr2ogr = 'ogr2ogr'
            args = [ogr2ogr, '-f', 'geoJSON', tmpfile, filename]
            cmd = ' '.join(args)
            try: subprocess.check_call(args, stderr=False)
            except OSError as e:
                raise RuntimeError('%s: %s' % (ogr2ogr, e.strerror))
            except (OSError, subprocess.CalledProcessError) as e:
                try: output = e.output
                except AttributeError: output = 'Command failed'
                raise RuntimeError('%s: %s' % (cmd, output))
            with codecs.open(tmpfile, encoding='cp1252') as fp:
                geojson = json.load(fp)
        finally:
            try: os.unlink(tmpfile)
            except: pass
            os.rmdir(tmpdir)
        
        self.geojson = geojson
    
    def save(self, layer=None):
        geography = {
            'type': 'FeatureCollection',
            'features': []
        }
        
        for feature in self.geojson['features']:
            p = feature['properties']
            if p['FeatureCla'] == 'Admin-0 countries':
                geography['features'].append({
                    'type': 'Feature',
                    'properties': {
                        'type': 'country',
                        'name': p['NAME'],
                        'code': p['ISO_A3'],
                    },
                    'geometry': feature['geometry'],
                })
            elif p['FeatureCla'] in ('ocean', 'sea', 'bay', 'gulf'):
                name = p['Name']
                
                # Ocan names are uppercase, capitalize words instead.
                if p['FeatureCla'] == 'ocean':
                    name = ' '.join([w.capitalize() for w in name.split()])
                    
                geography['features'].append({
                    'type': 'Feature',
                    'properties': {
                        'type': p['FeatureCla'],
                        'name': name,
                    },
                    'geometry': feature['geometry'],
                })
            else:
                continue
        
        self.profile.save({
            'layer': 'geography',
            'data': geography
        })
