import os
import sqlite3
import hashlib
import subprocess
import json

from ccbrowse import utils
from .driver import Driver


class HtreeDriver(Driver):
    def __init__(self, config, *args, **kwargs):
        def require(field):
            if field not in config:
                raise ValueError('Htree driver: "%s" configuraiton field is required' % field)
        require('chunk')
        require('src')
        require('index')
        require('key')
        require('hashlen')
        require('insert')
        require('select')
        require('init')
        require('lock')
        config.setdefault('size', 0)
        self.config = config

        # Start cchtable-clean.
        cmd = ['cchtree-clean', '-dfs', json.dumps(config)]
        self.cleanup_process = subprocess.Popen(cmd)

        Driver.__init__(self, config, *args, **kwargs)

    def keyof(self, obj):
        sha1 = lambda arg: hashlib.sha1(arg).hexdigest()
        return utils.substitute(self.config['key'], dict(obj, sha1=sha1))

    def hash(self, key):
        return hashlib.sha1(key.encode('utf-8')).hexdigest()[:self.config['hashlen']]

    def hashof(self, obj):
        return self.hash(self.keyof(obj))

    def lookup(self, obj):
        filename = self.config['index']
        exists = os.path.exists(filename)

        # Connect.
        try:
            conn = sqlite3.connect(filename)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
        except sqlite3.Error as e:
            raise RuntimeError('%s: %s' % (filename, e))

        if not exists:
            # Initialize index.
            try:
                q = 'CREATE TABLE htree (id INT, bits INT, hash TEXT, size INT)'
                c.execute(q)
                q = 'CREATE INDEX htree_id_idx ON htree (id)'
                c.execute(q)
                q = 'CREATE INDEX htree_size_idx ON htree (size)'
                c.execute(q)
                q = 'INSERT INTO htree (bits, id, hash, size) VALUES (0, 0, CAST(? AS TEXT), 0)'
                c.execute(q, ('0'*self.config['hashlen'],))
            except sqlite3.Error as e:
                raise RuntimeError('%s: %s: %s' % (filename, q, e))

        hash = self.hashof(obj)

        q = 'SELECT * FROM htree WHERE id <= ? ORDER BY id DESC LIMIT 1'
        try: rows = c.execute(q, [int(hash, 16)])
        except sqlite3.Error as e:
            raise RuntimeError('%s: %s: %s' % (filename, q, e))

        row = rows.fetchone()

        if row is None:
            bits = 0
            hash = '0'*self.config['hashlen']
        else:
            bits = row['bits']
            hash = row['hash']

        try:
            conn.commit()
            conn.close()
        except sqlite3.Error as e:
            raise RuntimeError('%s: %s' % (filename, e))

        return bits, hash

    def index_update_size(self, bits, hash, size):
        filename = self.config['index']

        # Connect.
        try:
            conn = sqlite3.connect(filename)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
        except sqlite3.Error as e:
            raise RuntimeError('%s: %s' % (filename, e))

        # Update.
        q = 'UPDATE htree SET size = ? WHERE bits = ? AND hash = ?'
        try: c.execute(q, [size, bits, hash])
        except sqlite3.Error as e:
            raise RuntimeError('%s: %s: %s' % (filename, q, e))

        # Close.
        try:
            conn.commit()
            conn.close()
        except sqlite3.Error as e:
            raise RuntimeError('%s: %s' % (filename, e))

    def store(self, obj):
        if self.on_store: self.on_store(obj)
        bits, hash = self.lookup(obj)

        filename = utils.substitute(self.config['src'], dict(bits=bits, hash=hash))
        exists = os.path.exists(filename)

        # Make directories.
        try: os.makedirs(os.path.dirname(filename))
        except os.error: pass

        # Connect.
        try:
            conn = sqlite3.connect(filename)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
        except sqlite3.Error as e:
            raise RuntimeError('%s: %s' % (filename, e))

        # Initialize database.
        if not exists:
            for query in self.config['init']:
                q, params = utils.substitute_sql(query, obj)
                try: c.execute(q, params)
                except sqlite3.Error as e:
                    raise RuntimeError('%s: %s: %s' % (filename, q, e))

        # Insert query.
        hash1 = self.hashof(obj)
        q, params = utils.substitute_sql(self.config['insert'], dict(obj,
            _id=int(hash1,16),
            _hash=hash1,
            sha1=lambda arg: hashlib.sha1(arg).hexdigest(),
        ))
        try: c.execute(q, params)
        except sqlite3.Error as e:
            raise RuntimeError('%s: %s: %s' % (filename, q, e))

        # Commit & close.
        try:
            conn.commit()
            conn.close()
        except sqlite3.Error as e:
            raise RuntimeError('%s: %s' % (filename, e))

        try:
            stat = os.stat(filename)
            size = stat.st_size
        except OSError as e:
            raise RuntimeError('%s: %s' % (filename, e))

        self.index_update_size(bits, hash, size)

    def retrieve(self, obj, exclude=[]):
        bits, hash = self.lookup(obj)
        filename = utils.substitute(self.config['src'], dict(bits=bits, hash=hash))
        if not os.path.exists(filename): return None

        # Connect.
        try:
            conn = sqlite3.connect(filename)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
        except sqlite3.Error as e:
            raise RuntimeError('%s: %s' % (filename, e))

        # Select query.
        q, params = utils.substitute_sql(self.config['select'], dict(obj,
            sha1=lambda arg: hashlib.sha1(arg).hexdigest(),
        ))
        try:
            rows = c.execute(q, params)
        except sqlite3.Error as e:
            raise RuntimeError('%s: %s: %s' % (filename, q, e))
        row = rows.fetchone()

        if row is None: return None
        o = obj.copy()
        o.update(dict(list(zip(list(row.keys()), row))))

        # Close.
        try: conn.close()
        except sqlite3.Error as e: raise RuntimeError('%s: %s' % (filename, e))

        return Driver.retrieve(self, o, exclude)

    def __exit__(self):
        try: self.cleanup_process.terminate()
        except Exception: pass

    def __del__(self):
        self.__exit__()

