from .driver import Driver

class NullDriver(Driver):
    def store(self, obj):
        pass
        
    def retrieve(self, obj, exclude=[]):
        return None
