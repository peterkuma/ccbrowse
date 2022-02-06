import numpy as np
import json
from datetime import datetime
import pytz
import dateutil
import os

import ccbrowse
import ccbrowse.config
from ccbrowse.storage import MemCacheDriver
from ccbrowse.ccimport import PRODUCTS
from ccbrowse import utils
from .rangelist import RangeList, RangeListEncoder

class ProfileJSONDecoder(json.JSONDecoder):
    def __init__(self, *args, **kwargs):
        kwargs.update(object_hook=self.object_hook)
        json.JSONDecoder.__init__(self, *args, **kwargs)

    def object_hook(self, d):
        if type(d) == dict: i = list(d.items())
        else: i = enumerate(d)
        for k, v in i:
            if type(v) == list:
                self.object_hook(v)
            if type(v) == str:
                try: d[k] = datetime.strptime(v, '%Y-%m-%d %H:%M:%S').replace(tzinfo=pytz.utc)
                except ValueError: pass
        else: return d


class Profile(object):
    def __init__(self, config, cache_size=4*1024*1024):
        self.config = ccbrowse.config.default_config
        self.config.update(config)

        self.storage = ccbrowse.storage.Router(
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
        return item in self.json

    def __getitem__(self, key):
        return self.json[key]

    def __setitem__(self, key, value):
        self.json[key] = value

    def has_key(self, key):
        return self.__contains__(key)

    def get_root(self):
        return os.path.abspath(self.config['root'])+'/'

    def layer_for(self, obj):
        if 'layer' not in obj:
            raise ValueError('Missing object field: "layer"')
        name = obj['layer']
        if name not in self['layers']:
            raise ValueError('No such layer %s' % name)
        return self['layers'][name]

    def deserialize(self, obj):
        """Deserialize obj.raw_data to obj.data by a format-specific method."""
        if not ('raw_data' in obj or 'data' in obj):
            return

        if str(obj['raw_data']).startswith('ref: '):
            obj['ref'] = utils.parse_ref(str(obj['raw_data']))
        else:
            layer = self.layer_for(obj)
            format = obj.get('format', layer.get('format', None))
            if format == 'png':
                obj['data'] = utils.pngunpack(obj['raw_data'])
            elif format == 'json':
                obj['data'] = json.loads(str(obj['raw_data']))
            else:
                obj['data'] = obj['raw_data']

    def serialize(self, obj):
        """Serialize obj.data to obj.raw_data by a format-specific method."""
        if 'raw_data' in obj:
            return

        if 'ref' in obj and 'data' in obj:
            # We have no option but to dereference.
            self.dereference(obj)

        if 'ref' in obj:
            obj['raw_data'] = utils.dump_ref(obj['ref'])

        if 'data' in obj:
            if obj['format'] == 'png':
                obj['raw_data'] = utils.pngpack(obj['data'])
            elif obj['format'] == 'json':
                obj['raw_data'] = json.dumps(obj.get('data'))
            else:
                obj['raw_data'] = json.dumps(obj.get('data'))

    def dereference(self, obj):
        if 'ref' not in obj: return
        for ref in obj['ref']:
            filename = ref['filename']
            if not filename.startswith('/'):
                filename = os.path.join(self.get_root(), filename)
            try:
                cls = PRODUCTS[ref['product']]
            except KeyError:
                raise RuntimeError('Unknown product type "%s"' % ref['product'])
            if 'offset' in ref:
                product = cls(ref['filename'], self, offset=ref['offset'])
            else:
                product = cls(ref['filename'], self)
            tile = product.tile(obj['layer'], obj['zoom'], obj['x'], obj['z'])
            if 'data' in obj:
                if obj['format'] == 'png':
                    utils.array_update(obj['data'], tile['data'])
                elif obj['format'] == 'json' and obj['type'] == 'geojson':
                    utils.geojson_update(obj['data'], tile['data'])
            else:
                obj['data'] = tile['data']
            if 'raw_data' in obj: del obj['raw_data']
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
                if 'data' in orig_obj and 'data' in obj:
                    orig_obj['data']
                    if layer['format'] == 'png':
                        utils.array_update(orig_obj['data'], obj['data'])
                    elif layer['format'] == 'json' and layer['type'] == 'geojson':
                        utils.geojson_update(orig_obj['data'], obj['data'])
                elif 'data' in obj:
                    orig_obj['data'] = obj['data']

                # Update ref.
                if 'ref' in orig_obj and 'ref' in obj:
                    utils.ref_update(orig_obj['ref'], obj['ref'])
                elif 'ref' in obj:
                    orig_obj['ref'] = obj['ref']

                obj = orig_obj
                del obj['raw_data']

        #self.cache.store(obj)
        self.storage.store(obj)

        if 'zoom' in obj and 'x' in obj:
            self.update_availability(obj['layer'], obj['zoom'], (obj['x'], obj['x']+1))

        return obj

    def load(self, obj, exclude=[], dereference=True):
        """Load object from profile."""
        try: layer = self.layer_for(obj)
        except ValueError: return None

        o = layer.copy()
        o.update(obj)
        obj = o
        if 'data' in obj: del obj['data']

        o = self.cache.retrieve(obj, exclude=exclude)
        if o is None:
            o = self.storage.retrieve(obj, exclude=exclude)
            if o != None:
                if dereference and 'ref' in o:
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
            filename = os.path.join(ccbrowse.config.sharepath, self.config['colormaps'], name)
        with open(filename) as fp:
            colormap = json.load(fp)
        return colormap

    def get_availability(self, layer):
        if layer in self.availability:
            return self.availability[layer]

        if not 'availability' in self['layers'][layer]:
            return {}

        obj = {
            'layer': layer,
            'name': 'availability',
            'format': 'json',
        }
        obj = self.storage.retrieve(obj)

        if obj is not None:
            self.availability[layer] = self.parse_availability(obj['data'])
        else:
            self.availability[layer] = {}

        return self.availability[layer]

    def parse_availability(self, availability):
        if type(availability) is not dict:
            raise ValueError('Invalid availability data: dictionary expected')

        return dict([
            (k, RangeList(v))
            for k, v
            in list(availability.items())
        ])

    def write_availability(self):
        for layer, a in list(self.availability.items()):
            if not 'availability' in self['layers'][layer]:
                continue
            obj = {
                'layer': layer,
                'name': 'availability',
                'format': 'json',
                'raw_data': json.dumps(a, cls=RangeListEncoder, indent=True)
            }
            self.storage.store(obj)

    def update_availability(self, layer, level, xxx_todo_changeme):
        (start, stop) = xxx_todo_changeme
        availability = self.get_availability(layer)
        if level in availability:
            availability[level].append(start, stop)
        else:
            availability[level] = RangeList([(start, stop)])
