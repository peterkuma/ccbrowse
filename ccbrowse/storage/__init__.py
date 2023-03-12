from .driver import *
from .null import *
from .filesystem import *
from .sqlite import *
from .memcache import *
from .htree import *
from .s3 import *
from .fileref import *

DRIVERS = {
    'null': NullDriver,
    'filesystem': FilesystemDriver,
    'sqlite': SQLiteDriver,
    'memcache': MemCacheDriver,
    'htree': HtreeDriver,
    's3': S3Driver,
    'fileref': FilerefDriver,
}

from .router import *
