from .driver import Driver


class NullDriver(Driver):
    def store(self, obj):
        return False

    def retrieve(self, obj, exclude=[]):
        return None
