import os
import sqlite3

from ccbrowse import utils
from ccbrowse.products import PRODUCTS
from .driver import Driver


INIT = [
    'CREATE TABLE files (filename TEXT, product TEXT, offset INT, t1 REAL, t2 REAL, h1 REAL, h2 REAL, modified INT)',
    'CREATE UNIQUE INDEX files_filename_idx ON files (filename)',
    'CREATE INDEX files_time_idx ON files (t1, t2)',
    'CREATE INDEX files_modified_idx ON files (modified)',
]

INSERT = 'INSERT OR REPLACE INTO files (filename, product, offset, t1, t2, h1, h2, modified) VALUES ({filename}, {product}, {offset}, {t1}, {t2}, {h1}, {h2}, strftime(\'%s\'))'

SELECT = 'SELECT filename, offset, modified from files WHERE \
          product = {product} AND \
          ((t1 < {ts1} AND t2 > {ts1}) OR (t1 >= {ts1} AND t1 < {ts2})) AND \
          ((h1 < {hs1} AND h2 > {hs1}) OR (h1 >= {hs1} AND h1 < {hs2}))'


class FilerefDriver(Driver):
    """Fileref driver class.

    This driver does not store tiles but references to whole files. This can be
    much faster than storing tiles. The tiles are retrieved on-demand from the
    referenced files. The file references are stored in an SQLite database.
    """
    def __init__(self, config, profile, *args, **kwargs):
        if 'src' not in config:
            ValueError('File driver: "src" configuration field is required')
        self._config = config
        self._profile = profile
        self._filename = self._config['src']
        Driver.__init__(self, config, *args, **kwargs)

    def _connect(self):
        try:
            self._conn = sqlite3.connect(self._filename)
            self._conn.row_factory = sqlite3.Row
            self._c = self._conn.cursor()
        except sqlite3.Error as e:
            raise RuntimeError('%s: %s' % (self._filename, e))

    def _disconnect(self):
        try:
            self._conn.commit()
            self._conn.close()
        except sqlite3.Error as e:
            raise RuntimeError('%s: %s' % (self._filename, e))
        self._c = None
        self._conn = None

    def _execute(self, query, parameters=None):
        q, params = utils.substitute_sql(query, parameters)
        try:
            return self._c.execute(q, params)
        except sqlite3.Error as e:
            raise RuntimeError('%s: %s: %s' % (self._filename, q, e))

    def store(self, obj):
        super()
        if 'ref' not in obj: return False
        exists = os.path.exists(self._filename)
        try: os.makedirs(os.path.dirname(self._filename))
        except os.error: pass
        self._connect()
        self._execute('PRAGMA synchronous = OFF')
        if not exists:
            for q in INIT:
                self._execute(q)
        for ref in obj['ref']:
            self._execute(INSERT, {
                'filename': ref['filename'],
                'product': ref['product'],
                'offset': ref['offset'],
                't1': ref['bounds'][0],
                't2': ref['bounds'][1],
                'h1': ref['bounds'][2],
                'h2': ref['bounds'][3],
            })
        self._disconnect()
        return True

    def retrieve(self, obj, exclude=[]):
        layer = obj['layer']
        zoom = obj['zoom']
        w = self._profile['zoom'][zoom]['width']
        h = self._profile['zoom'][zoom]['height']
        origin = self._profile['origin']
        ts1 = obj['x']*w
        ts2 = ts1 + w
        hs1 = obj['z']*h
        hs2 = hs1 + h
        self._connect()
        rows = self._execute(SELECT, {
            'product': obj['product'],
            'ts1': ts1,
            'ts2': ts2,
            'hs1': hs1,
            'hs2': hs2,
        })
        o = obj.copy()
        ref = []
        modified = 0
        for row in rows:
            ref += [{
                'product': obj['product'],
                'filename': row['filename'],
                'offset': row['offset'],
            }]
            modified = max(modified, row['modified'])
        self._disconnect()
        o['ref'] = ref
        o['modified'] = modified
        if len(ref) == 0:
            o = None
        return super().retrieve(o, exclude)
