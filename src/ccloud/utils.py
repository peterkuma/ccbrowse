import sys
import os
import Image
import numpy as np
import json
import io
import ImageColor, PngImagePlugin
from contextlib import closing
import re


def coerce(x, low, high):
    if x < low: return low
    if x > high: return high
    return x


#def substitute(s, variables):
#    for (key, value) in variables.items():
#        placeholder = '{'+key+'}'
#        value = unicode(value)
#        i = s.find(placeholder)
#        j = 0
#        while i >= 0:
#            j = i+len(placeholder)
#            s = s[:i] + value + s[j:]
#            start = i + len(value)
#            i = s.find(placeholder, start)
#    return s


def substitute(s, variables):
    """Substitute variables in string s.
    
    Variables are in format "{var}", where var is a key in the dictionary
    variables. Substitution is performed by eval(var, variables).
    Unrecognized variables are replaced by an empty string.
    """
    params = []
    def repl(m):
        try: return unicode(eval(m.group(1), variables))
        except: return ''
    return re.sub('\{(.+?)\}', repl, s)


def substitute_sql(s, variables):
    """Substitute variables in SQL query s.
    
    Variables are in format "{var}", where var is a key in the dictionary
    variables. Substitution is performed by eval(var, variables).
    Returns tuple (q, params), where q is a parametric query derived from s
    with variables replaced by '?', and params is a corresponding list of
    parameters taken from the dictionary variables.
    """
    params = []
    def repl(m):
        try:
            params.append(eval(m.group(1), variables))
            return '?'
        except: return 'NULL'
    
    q = re.sub('\{(.+?)\}', repl, s)
    return q, params


def pngpack(data):
    nbytes = data.dtype.itemsize
    w, h = data.shape
    tmp = np.zeros((w, h*nbytes), dtype=np.uint8)
    tmp.data = data.data
    im = Image.fromarray(tmp)
    meta = PngImagePlugin.PngInfo()
    meta.add_text('type', data.dtype.name)
    buf = io.BytesIO()
    im.save(buf, 'png', pnginfo=meta)
    return buffer(buf.getvalue())


def pngunpack(raw_data):
    buf = io.BytesIO()
    buf.write(raw_data)
    buf.seek(0)
    im = Image.open(buf)
    typ = im.info.get('type', 'float32')
    try: dtype = np.dtype(typ)
    except TypeError: dtype = np.float32
    nbytes = dtype.itemsize
    w, h = im.size
    if w % nbytes != 0:
        raise IOError('Invalid PNG packing')
    tmp = np.array(im)
    data = np.zeros((h, w/nbytes), dtype=dtype)
    data.data = tmp.data
    return data


def array_update(a, b):
    """Update numpy array a with values of b where b is not NaN."""
    if a.shape != b.shape:
        raise ValueError('Shape of arrays not matching: "%s" vs. "%s"' % (a.shape, b.shape))
    mask = np.logical_not(np.isnan(b))
    a[mask] = b[mask]


def geojson_update(a, b, feature_index=None):
    """Update GeoJSON a with features of b.
    
    Features with matching "type" and "name" properties are overwritten.
    
    feature_index is a dictionary mapping (type,name) pairs of a's features
    to the feature objects. If supplied, the operation can be done significantly
    faster. feature_index, if present, is updated to reflect the new state of a.
    """
    if not b.has_key('features'): return
    if feature_index is None:
        # Build a temporary index.
        feature_index = {}
        for f in a['features']:
            try:
                key = (f['properties']['type'],f['properties']['name'])
                feature_index[key] = f
            except KeyError: pass
    
    for f in b['features']:
        try:
            key = (f['properties']['type'],f['properties']['name'])            
            if not feature_index.has_key(key):
                a['features'].append(f)
            feature_index[key] = f
        except KeyError: pass


def colorize(data, colormap):
    #data = np.zeros((256, 256), dtype=np.float32)
    #data.data = raw.data
    out = np.zeros((256, 256, 4), dtype=np.uint8)
    tmp = np.zeros((256, 256), dtype=np.uint32)
    tmp.data = out.data
    
    c = np.zeros(4, dtype=np.uint8)
    d = np.zeros(1, dtype=np.uint32)
    d.data = c.data
    
    if colormap['missing']: c[0:3] = ImageColor.getrgb(colormap['missing'])
    else: c[0:3] = 0
    c[3] = 255
    tmp[...] = d
    
    n = 0
    for b in colormap['bounds']:
        step = 1.0*(b['end'] - b['start'])/b['steps']
        for i in range(b['steps']):
            low = b['start'] + i*step
            high = low + step
            mask = np.logical_and(data > low, data < high)
            c[0:3] = ImageColor.getrgb(colormap['colors'][n + i])
            tmp[mask] = d
        n += b['steps']
    
    return out


def humanize_size(size):
    for u in ['B','kB','MB','GB']:
        if size < 1024: return '%.1f %s' % (size, u)
        size /= 1024.0
    return "%.1f TB" % size


def dehumanize_size(s):
    if type(s) == int: return s
    m = re.match(r'^(\d+(?:\.\d*)?)\s*(B|kB|MB|GB|TB)?$', s)
    if m is None: return ValueError('Invalid size literal: "%s"' % s)
    units = m.group(2)
    if units is None: return int(m.group(1))
    mult = 1
    for u in ['B', 'kB', 'MB', 'GB', 'TB']:
        if u == units: break
        mult *= 1024
    return int(float(m.group(1))*mult)


def download(url, name=None, progress=False):
    if name is None: name = os.path.basename(url)
    if name == '': raise ValueError
    
    # Only output progress if attached to a terminal.
    progress = progress and sys.stderr.isatty()
    
    import urllib2
    with closing(urllib2.urlopen(url)) as f:
        size = int(f.info()['Content-Length'])
        
        with open(name, 'w') as g:
            if not progress: # Take a shortcut.
                import shutil
                shutil.copyfileobj(f, g)
                return
            
            sys.stderr.write('%s [0B/%s] 0%%' % (humanize_size(size), name))
            
            buf = f.read(65536)
            i = 0
            while buf != '':
                g.write(buf)
                i += len(buf)
                sys.stderr.write('\r\033[K%s [%s/%s] %.f%%' % (
                    name,
                    humanize_size(i),
                    humanize_size(size),
                    100.0*i/size,
                ))
                sys.stderr.flush()
                buf = f.read(16384)
    
    print >> sys.stderr, '\r\033[K%s' % name
