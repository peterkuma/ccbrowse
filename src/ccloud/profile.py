import numpy as np
import json
from datetime import datetime
import pytz
import dateutil
import os

import ccloud
from .rangelist import RangeList, RangeListEncoder

class ProfileJSONDecoder(json.JSONDecoder):
    def __init__(self, *args, **kwargs):
        kwargs.update(object_hook=self.object_hook)
        json.JSONDecoder.__init__(self, *args, **kwargs)
    
    def object_hook(self, d):
        if type(d) == dict: i = d.items()
        else: i = enumerate(d)
        for k, v in i:
            if type(v) == list:
                self.object_hook(v)
            if type(v) == unicode:
                try: d[k] = datetime.strptime(v, '%Y-%m-%d %H:%M:%S').replace(tzinfo=pytz.utc)
                except ValueError: pass
        else: return d


class Tile(object):
    level = None
    x = 0
    z = 0
    type = 'array'
    data = np.ndarray((0,0))
    
    
class Profile(object):
    def __init__(self, filename=None, root=''):
        if filename: self.from_json(filename)
        self.root = root
        self.cache = {}
        self.availability = {}

    def __enter__(self, filename=None, root=''):
        if filename: self.from_json(filename)
        self.root = root
        self.cache = {}
        self.availability = {}
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        if not hasattr(self, 'json'): return # The class failed to initialize.
        self.sync_cache()
        self.write_availability()

    def from_json(self, filename):
        fp = open(filename)
        self.json = json.load(fp, cls=ProfileJSONDecoder)
    
    def __contains__(self, item):
        return self.json.has_key(item)    

    def __getitem__(self, key):
        return self.json[key]
    
    def __setitem__(self, key, value):
        self.json[key] = value

    def has_key(self, key):
        return self.__contains__(key)
        
    def transform_x(self, x, level):
        return x*self['zoom'][level]['width'] + self['origin'][0]
    
    def transform_z(self, z, level):
        return z*self['zoom'][level]['height'] + self['origin'][1]
    
    def save(self, layer, element):
        if type(element) == Tile:
            self.save_tile(layer, element)
        elif type(element) == dict:
            self.save_feature(layer, element)
        else:
            raise ValueError('Invalid element type %s' % type(element))
    
    def save_feature(self, layer, feature):
        src = self['layers'][layer]['src']
        if src[0] != '/': src = self.root + '/' + src
        
        # Emty cache - initialize with existing geojson data.
        if not self.cache.has_key(layer):
            self.cache[layer] = {}
            try:
                with open(src) as fp:
                    geojson = json.load(fp)
                    for f in geojson['features']:
                        p = f['properties']
                        self.cache[layer][(p['type'], p['name'])] = f
            except (IOError, ValueError): pass
        
        p = feature['properties']
        self.cache[layer][(p['type'], p['name'])] = feature
    
    def sync_cache(self):
        for (layer, c) in self.cache.items():
            if self['layers'][layer]['format'] == 'geojson':
                self.sync_geojson(layer, c)
    
    def sync_geojson(self, layer, cache):
        src = self['layers'][layer]['src']
        if src[0] != '/': src = self.root + '/' + src
        
        geojson = {
            'type': 'FeatureCollection',
            'features': cache.values()
        }
        with open(src, 'w') as fp:
            json.dump(geojson, fp, indent=True)
    
    def save_tile(self, layer, tile):
        src = ccloud.utils.substitute(self['layers'][layer]['src'], {
            'layer': layer,
            'zoom': tile.level,
            'x': tile.x,
            'z': tile.z,
        })
        if src[0] != '/': src = os.path.join(self.root, src)
        
        if tile.type == 'array':
            ccloud.utils.pngpack(tile.data, src)
        elif tile.type == 'geometry':
            ccloud.utils.geojsonpack(tile.data, src)
        else:
            raise ValueError('Invalid tile type %s' % tile.type)
        
        self.update_availability(layer, tile.level, (tile.x, tile.x+1))
        
    def get_availability(self, layer):
        if self.availability.has_key(layer):
            return self.availability[layer]
        
        if not self['layers'][layer].has_key('availability'): return {}
        filename = self['layers'][layer]['availability']
        try:
            with open(filename) as fp:
                self.availability[layer] = self.parse_availability(json.load(fp))
        except IOError:
            self.availability[layer] = {}
        return self.availability[layer]
    
    def parse_availability(self, availability):
        return dict([(k, RangeList(v)) for k,v in availability.items()])
    
    def write_availability(self):        
        for layer, a in self.availability.items():
            if not self['layers'][layer].has_key('availability'): continue
            with open(self['layers'][layer]['availability'], 'w') as fp:
                json.dump(a, fp, cls=RangeListEncoder, indent=True)
    
    def update_availability(self, layer, level, (start, stop)):
        availability = self.get_availability(layer)
        
        if availability.has_key(level): availability[level].append(start, stop)
        else: availability[level] = RangeList([(start, stop)])

    def load(self, name, zoom=0, x=0, z=0):
        key = (name,zoom,x,z)
        if self.cache.has_key(key): return self.cache[key]
        
        layer = self['layers'][name]
        src = ccloud.utils.substitute(layer['src'], {
            'zoom': zoom,
            'x': x,
            'z': z,
        })
        if src[0] != '/': src = os.path.join(self.root, src)
        
        f = layer.get('format', 'png')
        
        if f == 'png':
            return pngunpack(src)
        elif f == 'geojson':
            with open(src) as fp:
                self.cache[key] = json.load(fp)
                return self.cache[key]
        else:
            raise NotImplementedError('Format "%s" is not supported' % f)

    def __del__(self):
        if not hasattr(self, 'json'): return # The class failed to initialize.
        self.sync_cache()
    