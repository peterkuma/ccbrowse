import subprocess
import os
import json
from tempfile import mkdtemp
import codecs

class NaturalEarth(object):
    def __init__(self, filename, profile):
        Product.__init__(self, filename, profile)
        
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
            try:
                with codecs.open(tmpfile, encoding='cp1252') as fp:
                    geojson = json.load(fp)
            except (IOError, ValueError) as e:
                raise RuntimeError('%s: %s' % (tmpfile, e))
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
            try:
                p = feature['properties']
                if 'featurecla' in p: featurecla = p['featurecla']
                else: featurecla = p['FeatureCla']
                if 'name' in p: name = p['name']
                else: name = p['Name']
                geometry = feature['geometry']
            except KeyError: continue
                
            if featurecla in ('Admin-0 country', 'Admin-0 countries'):
                geography['features'].append({
                    'type': 'Feature',
                    'properties': {
                        'type': 'country',
                        'name': name,
                        'code': p.get('ISO_A3', ''),
                    },
                    'geometry': geometry,
                })
            elif featurecla in ('ocean', 'sea', 'bay', 'gulf'):
                # Ocan names are uppercase, capitalize words instead.
                if featurecla == 'ocean':
                    name = ' '.join([w.capitalize() for w in name.split()])
                    
                geography['features'].append({
                    'type': 'Feature',
                    'properties': {
                        'type': featurecla,
                        'name': name,
                    },
                    'geometry': geometry,
                })
            else:
                continue
        
        self.profile.save({
            'layer': 'geography',
            'data': geography
        })
