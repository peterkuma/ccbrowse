import numpy as np
import json
from datetime import datetime
import pytz
import dateutil
import os

import ccloud
import ccloud.config
from ccloud.storage import MemCacheDriver
from ccloud.ccimport import PRODUCTS
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
    
    def get_root(self):
        return os.path.abspath(self.config['root'])+'/'
    
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

        if str(obj['raw_data']).startswith('ref: '):
            obj['ref'] = utils.parse_ref(str(obj['raw_data']))
        else:
            layer = self.layer_for(obj)
            if layer['format'] == 'png':
                obj['data'] = utils.pngunpack(obj['raw_data'])
            elif layer['format'] == 'json':
                obj['data'] = json.loads(str(obj['raw_data']))
            else:
                obj['data'] = obj['raw_data']
        
    def serialize(self, obj):
        """Serialize obj.data to obj.raw_data by a format-specific method."""
        if obj.has_key('raw_data'): return
        
        if obj.has_key('ref') and obj.has_key('data'):
            # We have no option but to dereference.
            self.dereference(obj)

        if obj.has_key('ref'):
            obj['raw_data'] = utils.dump_ref(obj['ref'])
        
        if obj.has_key('data'):
            if obj['format'] == 'png':
                obj['raw_data'] = utils.pngpack(obj['data'])
            elif obj['format'] == 'json':
                obj['raw_data'] = json.dumps(obj.get('data'), {})
            else:
                obj['raw_data'] = json.dumps(obj.get('data'), {})
        
    def dereference(self, obj):
        if not obj.has_key('ref'): return
        for ref in obj['ref']:
            filename = ref['filename']
            if not filename.startswith('/'):
                filename = os.path.join(self.get_root(), filename)
            try:
                cls = PRODUCTS[ref['product']]
            except KeyError:
                raise RuntimeError('Unknown product type "%s"' % ref['product'])
            if ref.has_key('offset'):
                product = cls(ref['filename'], self, offset=ref['offset'])
            else:
                product = cls(ref['filename'], self)
            tile = product.tile(obj['layer'], obj['zoom'], obj['x'], obj['z'])
            if obj.has_key('data'):
                if obj['format'] == 'png':
                    utils.array_update(obj['data'], tile['data'])
                elif obj['format'] == 'json' and obj['type'] == 'geojson':
                    utils.geojson_update(obj['data'], tile['data'])
            else:
                obj['data'] = tile['data']
            if obj.has_key('raw_data'): del obj['raw_data']
        del obj['ref']
    
    def save(self, obj, append=True):
        """Save object to profile.
        
        Object is a dictionary with the following mandatory and optional fields:
        
            layer   layer name [required]
            data    numpy array (format: png) or dictionary (format: json)
            ref     list of references to product files
            zoom    zoom level
            x       x-coordinate (type: x or xz)
            z       z-coordinate (type: xz)
        
        If append is True, object is merged with the original object.
        Return the object augmented with layer fields.
        """
        # Insert layer properties to obj.
        layer = self.layer_for(obj)
        o = layer.copy()
        o.update(obj)
        obj = o
        
        if append:
            orig_obj = self.load(obj, dereference=False)
            if orig_obj is not None:
                # Update data.
                if orig_obj.has_key('data') and obj.has_key('data'):
                    orig_obj['data']
                    if layer['format'] == 'png':
                        utils.array_update(orig_obj['data'], obj['data'])
                    elif layer['format'] == 'json' and layer['type'] == 'geojson':
                        utils.geojson_update(orig_obj['data'], obj['data'])
                elif obj.has_key('data'):
                    orig_obj['data'] = obj['data']
                
                # Update ref.
                if orig_obj.has_key('ref') and obj.has_key('ref'):
                    utils.ref_update(orig_obj['ref'], obj['ref'])
                elif obj.has_key('ref'):
                    orig_obj['ref'] = obj['ref']
                
                obj = orig_obj
                del obj['raw_data']
        
        #self.cache.store(obj)
        self.storage.store(obj)
        
        if obj.has_key('zoom') and obj.has_key('x'):
            self.update_availability(obj['layer'], obj['zoom'], (obj['x'], obj['x']+1))
        
        return obj
    
    def load(self, obj, exclude=[], dereference=True):
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
                if dereference and o.has_key('ref'):
                    self.dereference(o)
                    self.save(o, append=False)
                o2 = layer.copy()
                o2.update(o)
                self.cache.store(o2, dirty=False)
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
