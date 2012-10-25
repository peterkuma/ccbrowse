import sys
import os
import Image
import numpy as np
import json
import ImageColor, PngImagePlugin
from contextlib import closing


def coerce(x, low, high):
    if x < low: return low
    if x > high: return high
    return x


def substitute(s, variables):
    for (key, value) in variables.items():
        placeholder = '{'+key+'}'
        value = unicode(value)
        i = s.find(placeholder)
        j = 0
        while i >= 0:
            j = i+len(placeholder)
            s = s[:i] + value + s[j:]
            start = i + len(value)
            i = s.find(placeholder, start)
    return s


def pngpack(data, filename):    
    #nbytes = data.dtype.itemsize
    w, h = data.shape
    
    try:
        im = Image.open(filename)
        #if im.size != (w, h): raise IOError
        out = np.zeros((w, h), dtype=np.float32)
        out.data = np.array(im).data
    except IOError, AttributeError:
        try: os.makedirs(os.path.dirname(filename))
        except OSError: pass
        out = None
    
    if out != None:
        mask = np.logical_not(np.isnan(data))
        out[mask] = data[mask]
    else:
        out = data
    
    tmp = np.zeros((w, h*4), dtype=np.uint8)
    tmp.data = out.data
    im = Image.fromarray(tmp)
    
    meta = PngImagePlugin.PngInfo()
    meta.add_text('type', 'float32')
    
    im.save(filename, 'png', pnginfo=meta)


def pngunpack(filename):
    im = Image.open(filename)
    typ = im.info.get('type', 'float32')
    try: dtype = np.dtype(typ)
    except TypeError: dtype = np.float32
    nbytes = dtype.itemsize
    w, h = im.size
    if w % nbytes != 0:
        raise IOError('Invalid PNG packing')
    raw = np.array(im)
    data = np.zeros((h, w/nbytes), dtype=dtype)
    data.data = raw.data
    return data
    

def geojsonpack(data, filename):
    try: os.makedirs(os.path.dirname(filename))
    except OSError: pass
    
    with open(filename, 'w') as fp:
        json.dump({
            'type': 'FeatureCollection',
            'properties': {},
            'features': [{
                'type': 'Feature',
                'geometry': data,
            }]
        }, fp, indent=True)


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
    for u in ['B','KB','MB','GB']:
        if size < 1024: return '%.1f %s' % (size, u)
        size /= 1024.0
    return "%.1f TB" % size


def download(url, name=None, progress=False):
    if name == None: name = os.path.basename(url)
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
