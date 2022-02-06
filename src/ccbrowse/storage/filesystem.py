import os

from ccbrowse import utils
from .driver import Driver

class FilesystemDriver(Driver):
    """Filesystem driver class.
    
    Store objects in ordinary files. File path is determined by substituting
    object parameters to "src" configuration field. The object parameter
    "raw_data" is written as raw file content, and it is the only object
    parameter stored. Other parameters can only serve as file path lookup values.
    """
    
    def __init__(self, config, *args, **kwargs):
        if 'src' not in config:
            ValueError('Filesystem driver: "src" configuration field is required')
        self.config = config
        Driver.__init__(self, config, *args, **kwargs)
        
    def store(self, obj):
        if self.on_store: self.on_store(obj)
        filename = utils.substitute(self.config['src'], obj)
        try: os.makedirs(os.path.dirname(filename))
        except os.error: pass
        
        with open(filename, 'w') as f:
            f.write(obj['raw_data'])
    
    def retrieve(self, obj, exclude=[]):
        filename = utils.substitute(self.config['src'], obj)
        o = obj.copy()
        
        if not 'modified' in exclude:
            try:
                stat = os.stat(filename)
                o['modified'] = int(stat.st_mtime)
            except OSError: return None
        
        if 'raw_data' in exclude: return Driver.retrieve(self, o, exclude)
        
        try:
            with open(filename) as f:
                o['raw_data'] = f.read()
        except IOError: return None
        return Driver.retrieve(self, o, exclude)
    