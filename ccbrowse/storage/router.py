import copy
import reprlib as reprlib

from ccbrowse.exceptions import StorageNotAvailable
from ccbrowse.storage import *


class Router(Driver):
    def __init__(self, config, root='.', on_store=None, on_retrieve=None, *args, **kwargs):
        self.config = copy.deepcopy(config)
        self.storage = []
        for c in self.config:
            if 'src' in c: c['src'] = os.path.join(root, c['src'])
            driver = c.get('driver', 'filesystem')
            if driver in DRIVERS:
                d = DRIVERS[driver](c, *args, **kwargs)
                self.storage.append((c, d))
        Driver.__init__(self, config,
                        on_store=on_store, on_retrieve=on_retrieve,
                        *args, **kwargs)

    def storage_for(self, obj, method):
        storages = []
        for storage in self.storage:
            config, driver = storage
            requires = None
            for key in '%s_requires' % method, 'requires':
                try: requires = config[key]
                except KeyError: continue
                break
            if requires is not None:
                if not set(requires).issubset(list(obj.keys())):
                    continue
            if 'predicate' in config:
                try: result = eval(config['predicate'], obj)
                except: result = False
                if not result:
                    continue
            storages += [driver]
        return storages

    def store(self, obj):
        if self.on_store: self.on_store(obj)
        storages = self.storage_for(obj, 'store')
        if len(storages) == 0:
            raise StorageNotAvailable('No suitable storage for object: %s' %
                reprlib.repr(obj))
        return storages[0].store(obj)

    def retrieve(self, obj, exclude=[]):
        storages = self.storage_for(obj, 'retrieve')
        if len(storages) == 0:
            return None
        for storage in storages:
            o = super().retrieve(storage.retrieve(obj, exclude), exclude)
            if o is not None:
                return o
        return None
