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
            args = ['ogr2ogr', '-f', 'geoJSON', tmpfile, filename]
            print ' '.join(args)
            subprocess.call(args)
            with codecs.open(tmpfile, encoding='cp1252') as fp:
                geojson = json.load(fp)
        finally:
            try: os.unlink(tmpfile)
            except: pass
            os.rmdir(tmpdir)
        
        self.geojson = geojson
    
    def save(self, layer=None):
        for feature in self.geojson['features']:
            p = feature['properties']
            if p['FeatureCla'] == 'Admin-0 countries':
                f = {
                    'type': 'Feature',
                    'properties': {
                        'type': 'country',
                        'name': p['NAME'],
                        'code': p['ISO_A3'],
                    },
                    'geometry': feature['geometry'],
                }
            elif p['FeatureCla'] in ('ocean', 'sea', 'bay', 'gulf'):
                name = p['Name']
                
                # Ocan names are uppercase, capitalize words instead.
                if p['FeatureCla'] == 'ocean':
                    name = ' '.join([w.capitalize() for w in name.split()])
                    
                f = {
                    'type': 'Feature',
                    'properties': {
                        'type': p['FeatureCla'],
                        'name': name,
                    },
                    'geometry': feature['geometry'],
                }
            else:
                continue
            
            self.profile.save('geography', f)
    
    