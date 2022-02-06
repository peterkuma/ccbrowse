from heapq import heappush, heappop
import itertools
import sys

from .driver import Driver
from ccbrowse import utils

class MemCacheDriver(Driver):
    """MemCacheDriver class.
    
    This class implements LRU cache, allowing lookup by a specified key index.
    Indexing is implemented using the python dict type (hash indexes).
    
    When cache is filled up, oldest entries are removed and stored in a
    backing store (if defined).
    """
    
    def __init__(self, config, backing_store=None, *args, **kwargs):
        """Initialize driver.
        
        config is a dictionary with the following options:
        
            size    maximum cache size
            key     list of object keys to be used as the lookup key
        
        backing_store is a instance of an arbitrary storage driver
        which is used to store oldest objects when they no longer fit
        the cache size.
        """
        self.size = 0
        self.cache = [] # heapq.
        self.counter = itertools.count()
        self.config = config
        self.config['size'] = utils.dehumanize_size(config.get('size', 0))
        self.config['key'] = config.get('key', [])
        self.index = {}
        self.backing_store = backing_store
        Driver.__init__(self, config, *args, **kwargs)
        
    def sizeof(self, obj):
        return sys.getsizeof(obj) + sum([sys.getsizeof(v) for v in list(obj.values())])
    
    def keyof(self, obj):
        return tuple([obj.get(k,None) for k in self.config['key']])

    def expire(self):
        """Expire old objects until size falls below config.size."""
        try:
            while self.size > self.config['size']:
                try: entry = heappop(self.cache)
                except IndexError: break
                obj = entry[1]
                dirty = entry[2]
                if obj is None: continue
                del self.index[self.keyof(obj)]
                self.size -= self.sizeof(obj)
                if dirty and self.backing_store:
                    self.backing_store.store(obj)
        except IndexError: pass

    def store(self, obj, dirty=True):
        if self.on_store: self.on_store(obj)

        key = self.keyof(obj)
        try: entry = self.index[key]
        except KeyError: entry = None
        
        if entry != None and entry[1] != None:
            # Existing object, update it.
            self.size -= self.sizeof(entry[1])
            entry[1].update(obj)
            entry[2] = dirty
            self.size += self.sizeof(entry[1])
        else:
            # New object.
            entry = [next(self.counter), obj, dirty]
            heappush(self.cache, entry)
            self.size += self.sizeof(obj)
            self.index[self.keyof(obj)] = entry
        
        if self.size >= self.config['size']:
            self.expire()

    def retrieve(self, obj, exclude=[]):
        key = self.keyof(obj)
        try: entry = self.index[key]
        except KeyError: return None
        o = entry[1]
        dirty = entry[2]
        # Remove reference to the object.
        entry[1] = None
        newentry = [next(self.counter), o, dirty]
        heappush(self.cache, newentry)
        self.index[key] = newentry
        obj = obj.copy()
        obj.update(o)
        return Driver.retrieve(self, obj, exclude)
   
    def empty(self):
        while True:
            try: entry = heappop(self.cache)
            except IndexError: break
            obj = entry[1]
            dirty = entry[2]
            if obj is None: continue
            del self.index[self.keyof(obj)]
            self.size -= self.sizeof(obj)
            if dirty and self.backing_store:
                self.backing_store.store(obj)
