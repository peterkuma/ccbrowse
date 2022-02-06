class Driver(object):
    """Storage driver class.
    
    This is an abstract class for storage drivers. It defines a simple
    interface for storing and retrieving objects. Objects are represented
    as an arbitrary dictionary. It is up to the specific driver and its
    configuration to provide a meaningful method of storing and retrieving
    objects quickly, and may support lookups only by a restricted number
    of properties for that reason.
    """
    
    def __init__(self, config=None, on_store=None, on_retrieve=None):
        """Initialize driver.
        
        config is a dictionary containing configuration options specific
        to the driver. Unrecognized options are ignored.
        
        Optionally, on_store and on_retrieve are a functions called when object
        is stored and retrieved, respectively. Object is passed to the functions
        as a single argument. No return value is expected.
        
            on_store(obj)
            on_retireve(obj)
        """
        self.on_store = on_store
        self.on_retrieve = on_retrieve
    
    def store(self, obj):
        """Store object obj.
        
        obj is a dictionary defining the object.
        """
        if self.on_store: self.on_store(obj)

    def retrieve(self, obj, exclude=[]):
        """Retrieve object.
        
        obj is a dictionary containing a subset of object properties
        that are used to lookup the object. Return object or None if not found.
        Retrieved object is combined with obj, overwriting any keys
        already present in obj.
        
        exclude is a list of fields to be excluded from the lookup,
        which can make the retrieval significantly faster for some type of
        drivers.
        """
        if obj is None: return None
        o = obj.copy()
        for field in exclude:
            if field in o: del o[field]
        if self.on_retrieve: self.on_retrieve(o)
        return o
