import sqlite3
import re
import os
import logging

from ccbrowse import utils
from .driver import Driver

class SQLiteDriver(Driver):
    def __init__(self, config, *args, **kwargs):
        def require(field):
            if field not in config:
                raise ValueError('SQLite driver: "%s" configuraiton field is required' % field)
        require('src')
        require('insert')
        require('select')
        require('init') 
        self.config = config
        Driver.__init__(self, config, *args, **kwargs)
    
    def store(self, obj):
        if self.on_store: self.on_store(obj)
        filename = utils.substitute(self.config['src'], obj)
        exists = os.path.exists(filename)
        
        # Make directories.
        try: os.makedirs(os.path.dirname(filename))
        except os.error: pass
        
        # Connect.
        try:
            conn = sqlite3.connect(filename)
            c = conn.cursor()
        except sqlite3.Error as e:
            raise RuntimeError('%s: %s' % (filename, e))
       
        q = 'PRAGMA synchronous = OFF'
        try: c.execute(q)
        except sqlite3.Error as e:
            raise RuntimeError('%s: %s: %s' % (filename, q, e))
        
        # Initialize database.
        if not exists:
            for query in self.config['init']:
                q, params = utils.substitute_sql(query, obj)
                c.execute(q, params)
        
        # Insert query.
        q, params = utils.substitute_sql(self.config['insert'], obj)
        try: c.execute(q, params)
        except sqlite3.Error as e:
            raise RuntimeError('%s: %s: %s' % (filename, q, e))
        
        # Commit & close.
        try:
            conn.commit()
            conn.close()
        except sqlite3.Error as e:
            raise RuntimeError('%s: %s' % (filename, e))
    
    def retrieve(self, obj, exclude):
        filename = utils.substitute(self.config['src'], obj)
        if not os.path.exists(filename): return None
        conn = sqlite3.connect(filename)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        q, params = utils.substitute_sql(self.config['select'], obj)
        try: rows = c.execute(q, params)
        except sqlite3.Error as e: raise RuntimeError("%s: %s" % (q, e))
        row = rows.fetchone()
        if row is None: return None
        o = obj.copy()
        o.update(dict(list(zip(list(row.keys()), row))))
        conn.close()
        return Driver.retrieve(self, o, exclude)
    