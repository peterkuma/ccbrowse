import numpy as np
import json
from datetime import datetime
import pytz
import dateutil
import os

import ccloud
import ccloud.config
from ccloud.storage import MemCacheDriver
from ccloud import utils
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


class Profile(object):
    def __init__(self, config, cache_size=4*1024*1024):
        self.config = ccloud.config.default_config
        self.config.update(config)
        
        self.storage = ccloud.storage.Router(
            self.config['storage'],
            root=self.config['root'],
            on_store=lambda obj: self.serialize(obj),
            on_retrieve=lambda obj: self.deserialize(obj),
        )
        
        filename = os.path.join(self.config['root'], self.config['profile'])
        try:
            with open(filename) as fp:
                self.json = json.load(fp, cls=ProfileJSONDecoder)
        except ValueError as e:
            raise RuntimeError('%s: %s' % (filename, e))
        
        self.cache = MemCacheDriver({
            'size': cache_size,
            'key': ['layer', 'zoom', 'x', 'z'],
        }, backing_store=self.storage)
        self.availability = {}

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.write_availability()
        self.cache.empty()

    def __contains__(self, item):
        return self.json.has_key(item)    

    def __getitem__(self, key):
        return self.json[key]
    
    def __setitem__(self, key, value):
        self.json[key] = value

    def has_key(self, key):
        return self.__contains__(key)
    
    def layer_for(self, obj):
        if not obj.has_key('layer'):
            raise ValueError('Missing object field: "layer"')
        name = obj['layer']
        if not self['layers'].has_key(name):
            raise ValueError('No such layer %s' % name)
        return self['layers'][name]
    
    def deserialize(self, obj):
        """Deserialize obj.raw_data to obj.data by a format-specific method."""
        if not obj.has_key('raw_data') or obj.has_key('data'): return
        
        # Nothing to do if data matches raw_data.
        #if obj.has_key('_data_from') and obj['_data_from'] == obj['raw_data']:
        #    return
        
        layer = self.layer_for(obj)
        if layer['format'] == 'png':
            obj['data'] = utils.pngunpack(obj['raw_data'])
        elif layer['format'] == 'json':
            obj['data'] = json.loads(obj['raw_data'])
        
        #obj['_data_from'] = obj['raw_data']
        
    def serialize(self, obj):
        """Serialize obj.data to obj.raw_data by a format-specific method."""
        if not obj.has_key('data') or obj.has_key('raw_data'): return
        
        # Nothing to do if raw_data matches data.
        #if obj.has_key('_raw_data_from') and obj['_raw_data_from'] == data:
        #    return
        
        layer = self.layer_for(obj)
        if layer['format'] == 'png':
            obj['raw_data'] = utils.pngpack(obj['data'])
        elif layer['format'] == 'json':
            obj['raw_data'] = json.dumps(obj['data'])
            
        #obj['_raw_data_from'] = obj['data']
    
    def save(self, obj, append=True):
        """Save object to profile.
        
        Object is a dictionary with the following mandatory and optional fields:
        
            layer   layer name
            data    numpy array (format: png) or dictionary (format: json)
            zoom    zoom level [optional]
            x       x-coordinate (type: x or xz), [optional]
            z       z-coordinate (type: xz) [optional]
        
        If append is True, object is merged with the original object.
        """
        if not obj.has_key('data'): raise ValueError('Missing object field: "data"')
        layer = self.layer_for(obj)
        
        # Insert layer properties to obj.
        o = layer.copy()
        o.update(obj)
        obj = o
        from repr import repr
        if append:
            o = self.load(obj) # Original object.
            if o != None and o.has_key('data'):
                # Update all properties but data.
                data = o['data']
                o.update(obj)
                o['data'] = data
                
                # Update data.
                if layer['format'] == 'png':
                    utils.array_update(o['data'], obj['data'])
                elif layer['format'] == 'json' and layer['type'] == 'geojson':
                    utils.geojson_update(o['data'], obj['data'])
                else:
                    # We don't know how to merge, overwrite the old object data.
                    pass
                obj = o
                del obj['raw_data']
        
        self.cache.store(obj)
        if obj.has_key('zoom') and obj.has_key('x'):
            self.update_availability(obj['layer'], obj['zoom'], (obj['x'], obj['x']+1))
    
    def load(self, obj, exclude=[]):
        """Load object from profile."""
        try: layer = self.layer_for(obj)
        except ValueError: return None
        
        o = layer.copy()
        o.update(obj)
        obj = o
        if obj.has_key('data'): del obj['data']
        
        o = self.cache.retrieve(obj, exclude=exclude)
        if o is None:
            o = self.storage.retrieve(obj, exclude=exclude)
            if o != None:
                o2 = layer.copy()
                o2.update(o)
                self.cache.store(o, dirty=False)
        return o
    
    def colormap(self, name):
        try:
            filename = os.path.join(self.config['root'], self.config['colormaps'], name)
            with open(filename) as fp:
                colormap = json.load(fp)
        except IOError:
            filename = os.path.join(ccloud.config.sharepath, self.config['colormaps'], name)
        with open(filename) as fp:
            colormap = json.load(fp)
        return colormap
    
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
