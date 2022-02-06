from ccbrowse.storage import *
import copy
import reprlib as reprlib

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

    def storage_for(self, obj):
        for storage in self.storage:
            config, driver = storage
            if 'requires' in config:
                if not set(config['requires']).issubset(list(obj.keys())):
                    continue
            if 'predicate' in config:
                try: result = eval(config['predicate'], obj)
                except: result = False
                if not result:
                    continue
            return driver
        return None

    def store(self, obj):
        if self.on_store: self.on_store(obj)
        storage = self.storage_for(obj)
        if storage is None:
            raise RuntimeError('No suitable storage for object: %s' %
                               reprlib.repr(obj))
        storage.store(obj)

    def retrieve(self, obj, exclude=[]):
        storage = self.storage_for(obj)
        if storage is None: return None
        return Driver.retrieve(self, storage.retrieve(obj, exclude), exclude)
