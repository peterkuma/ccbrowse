#!/usr/bin/env python3

import os
import sys
import io
import getopt
import re
import bottle
from bottle import route, request, abort
import io
import json
import numpy as np
from PIL import Image
from datetime import datetime
import shapely.geometry
import socket
import logging

import ccbrowse
from ccbrowse.config import sharepath


RFC822_TIME = '%a, %d %b %Y %H:%M:%S GMT'


def init(conf):
    """Initialize server."""
    global config
    global cache
    global profile

    config = conf

    bottle.debug(config['debug'])

    profile = ccbrowse.Profile(config)

    try: driver = ccbrowse.storage.DRIVERS[config['cache']['driver']]
    except KeyError: driver = ccbrowse.storage.NullDriver
    cache = driver(config.get('cache'))


def app(config):
    """Return WSGI application."""
    init(config)
    return bottle.default_app()


def run(config):
    """Run server."""
    init(config)
    try:
        sys.argv = ['bottle']
        bottle.run(
            server=config['server'],
            workers=config['workers'],
            errorlog=config['log'],
            loglevel=config['loglevel'],
            accesslog=config['accesslog'],
            host=config['host'],
            port=config['port'],
            timeout=300,
        )
    except socket.error as e:
        raise RuntimeError('[%s:%s]: %s' % (config['host'], config['port'], e.strerror))
    global cache
    del cache


def last_modified(modified):
    if type(modified) == int: modified = datetime.utcfromtimestamp(modified)
    modified_since = bottle.request.get_header('If-Modified-Since')
    if modified_since != None:
        try:
            m = datetime.strptime(modified_since, RFC822_TIME)
            if m >= modified: abort(304, 'Not Modified')
        except ValueError:pass

    bottle.response.set_header('Last-Modified', modified.strftime(RFC822_TIME))


# Index.
@route('/')
@route('/about/')
def index():
    return bottle.static_file('index.html', root=os.path.realpath(os.path.join(sharepath, 'www')))


# Profile.
@route('<filename:re:/profile\.json>')
def profile(filename):
    return bottle.static_file(filename, root=os.path.realpath(config['root']))


# Colormaps
@route('/colormaps/<name>')
def colormap(name):
    profile.colormap(name)

    if os.path.exists(os.path.join(config['colormaps'], name)):
        return bottle.static_file(name, root=os.path.realpath(config['colormaps']))
    return bottle.static_file(name, root=os.path.realpath(os.path.join(sharepath, 'colormaps')))


# Places.
@route('/layers/places/<zoom>/<x>,<z>.json')
def places(zoom, x, z):
    trajectory = profile.load({
        'layer': 'trajectory',
        'zoom': zoom,
        'x': x,
    })
    geography = profile.load({'layer': 'geography'})

    if trajectory is None or geography is None:
        return json.dumps({'places': []})

    points = np.array(trajectory['data']['features'][0]['geometry']['coordinates'])

    # Downsample.
    if request.query.reduce:
        try: factor = int(request.query.reduce)
        except ValueError: factor = 1
        if factor <= 0: factor = 1
        points = points[np.arange(0, points.shape[0]) % factor == 0,:]

    t = shapely.geometry.shape({
        'type': 'LineString',
        'coordinates': points,
    })

    out = np.zeros(points.shape[0], np.int)

    for i in range(len(geography['data']['features'])):
        s = shapely.geometry.shape(geography['data']['features'][i]['geometry'])
        intersection = s.intersection(t)
        if type(intersection) != shapely.geometry.LineString: continue
        for point in intersection.coords:
            for j in range(len(points)):
                if points[j][0] == point[0] and points[j][1] == point[1]:
                    out[j] = i

    return json.dumps({'places': list(out)}, indent=True)


# Geocoding.
@route('/layers/geocoding/<zoom>/<x>,<z>.json')
def geocoding(zoom, x, z):
    try:
        x = int(x)
    except ValueError: abort(404)

    trajectory = profile.load({
        'layer': 'trajectory',
        'zoom': zoom,
        'x': x,
        'z': 0,
    })
    geography = profile.load({'layer': 'geography'})

    if trajectory is None or geography is None:
        abort(404, 'Geocoding support not available')

    geom = {}
    geom['type'] = trajectory['data']['features'][0]['geometry']['type']
    geom['coordinates'] = trajectory['data']['features'][0]['geometry']['coordinates']

    # Downsample.
    if request.query.reduce:
        try: factor = int(request.query.reduce)
        except ValueError: factor = 1
        if factor <= 0: factor = 1
        n = len(geom['coordinates'])
        coords = np.array(geom['coordinates'])
        coords = coords[np.arange(0, n) % factor == 0,:]
        geom['coordinates'] = coords

    t = shapely.geometry.shape(geom)

    features = []

    for f in geography['data']['features']:
        s = shapely.geometry.shape(f['geometry'])
        i = s.intersection(t)
        if type(i) != shapely.geometry.linestring.LineString or i.is_empty:
            continue

        features.append({
            'type': 'Feature',
            'properties': f['properties'],
            'geometry': {
                'type': 'LineString',
                'coordinates': list(i.coords),
            },
        })

    return json.dumps({
        'type': 'FeatureCollection',
        'features': features,
    }, indent=True)


@route('/layers/<layer>/availability.json')
def availability(layer):
    return json.dumps(profile.get_availability(layer),
                      cls=ccbrowse.rangelist.RangeListEncoder)


@route('/layers/<layer>.<fmt>')
@route('/layers/<layer>/<zoom>/<x>,<z>.<fmt>')
def serve(layer, zoom=None, x=None, z=None, fmt=None):
    try:
        obj = {}
        obj['layer'] = layer
        if zoom != None: obj['zoom'] = zoom
        if x != None: obj['x'] = int(x)
        if z != None: obj['z'] = int(z)
        if fmt != None: obj['format'] = fmt
    except ValueError: abort(404)

    try:
        if obj['format'] == 'json':
            return serve_json(obj)
        elif obj['format'] == 'png':
            return serve_tile(obj)
        else:
            obj = profile.load(obj)
            if obj != None and 'raw_data' in obj:
                return obj['raw_data']
    except RuntimeError as e:
        logging.error(e)
    except IOError as e:
        if e.filename is not None and e.strerror is not None:
            logging.error('%s: %s' % (e.filename, e.strerror))
        else:
            logging.error(e)

    abort(404, 'Object not found')


# Everything else.
@route('<filename:path>')
def default(filename):
    return bottle.static_file(filename, root=os.path.realpath(os.path.join(sharepath, 'www')))


def serve_json(obj):
    obj = profile.load(obj)
    if obj is None: abort(404, 'Object not found')

    if not request.query.q:
        bottle.response.content_type = 'application/json'
        if 'data' in obj: return obj['data']
        else: abort(404, 'Object has no data')

    q = request.query.q
    m = re.match('^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$', q)
    if not m: abort(404, 'Invalid query coordinates')
    try:
        lat = float(m.group(1))
        lon = float(m.group(2))
    except ValueError: abort(404, 'Invalid query coordinates')

    point = shapely.geometry.Point(lon, lat)

    for f in obj['data']['features']:
        s = shapely.geometry.shape(f['geometry'])
        if s.contains(point):
            bottle.response.content_type = 'application/json'
            return json.dumps(f['properties'])

    bottle.response.content_type = 'application/json'
    return json.dumps({})


def serve_tile(obj):
    if not request.query.q:
        # Retrieve date of last modification.
        obj = profile.load(obj, exclude=['data'])
        if obj is None: abort(404, 'Object not found')

        last_modified(obj['modified'])

        # Attempt to retrieve from cache.
        o = cache.retrieve(obj)
        if o != None and o['modified'] >= obj['modified']:
            #print 'Cache hit'
            buf = io.BytesIO()
            buf.write(bytes(o['raw_data']))
            bottle.response.content_type = 'image/png'
            return buf.getvalue()

    #print 'Cache miss'
    if 'data' not in obj:
        obj = profile.load(obj)
        if obj is None: abort(404, 'Object not found')
    data = obj['data']

    if request.query.q:
        q = request.query.q
        m = re.match('^(\d+),(\d+)$', q)
        if m:
            x, y = int(m.group(1)), int(m.group(2))
            bottle.response.content_type = 'text/plain'
            try: return str(data[y, x])
            except ValueError: pass
        abort(404, 'Invalid query coordinates')

    m = re.match('colormaps/(.+)', profile['layers'][obj['layer']]['colormap'])
    colormap = profile.colormap(m.group(1))
    img = Image.fromarray(ccbrowse.algorithms.colorize(data, colormap))
    buf = io.BytesIO()
    img.save(buf, 'png')
    out = buf.getvalue()
    cache.store(dict(obj, raw_data=out))
    bottle.response.content_type = 'image/png'
    return out


def usage():
    sys.stderr.write('''Usage: {program_name} [-d] [-c FILE] [[HOST:]PORT]
       {program_name} --help
Try `{program_name} --help' for more information.
'''.format(program_name=program_name))


def print_help():
    sys.stderr.write('''Usage: {program_name} [-d] [-c FILE] [[HOST:]PORT]
       {program_name} --help

Run the ccbrowse HTTP server.

Positional arguments:
  HOST              hostname (default: localhost)
  PORT              port (default: 8080)

Optional arguments:
  -c FILE           configuration file (default: config.json)
  -d                print debugging information
  --help            print this help information

Report bugs to <ccplot-general@lists.sourceforge.net>.
'''.format(program_name=program_name))


if __name__ == "__main__":
    program_name = sys.argv[0]
    logging.basicConfig(format=program_name+': %(message)s', level=logging.INFO)
    os.setpgrp()
