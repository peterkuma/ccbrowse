# This file is a template for your product importer. Copy the entire content
# excluding the save method, and provide your own implementation of methods
# as described in comments. Give your class a suitable name and make it
# inherit from Product.
# When finished, add handling of the product type to ccimport.

import numpy as np

import ccbrowse
import ccbrowse.utils as utils

class Product(object):
    """Import a product file into ccbrowse profile.

    This is an abstract class. All product importers should inherit from this
    class and implement the following functions:

        layers
        xrange
        zrange
        tile

    This class is instantized from ccimport and the save method is called
    for every layer, x, z returned by the aforementioned functions.
    In turn, the save method calls your tile method.
    """

    NAME = None

    DATASETS = {}
    DATASETS_PRIMARY = {}

    OFFSET_LEVEL = 2
    OFFSET_LOW = -120 # s
    OFFSET_HIGH = 120 # s

    def __init__(self, filename, profile):
        """Product initialization."""
        self.profile = profile
        self.filename = filename
        self._primary = self.profile['primary'] == self.NAME
        self._offset = 0
        if self._primary:
            self._datasets = {k: v for k, v
                in (list(self.DATASETS.items()) + \
                    list(self.DATASETS_PRIMARY.items()))}
        else:
            self._datasets = self.DATASETS
            self._offset = self._calculate_offset(self.OFFSET_LEVEL)
        # Open the file and save the handler to a member variable.

    def layers(self):
        """Return a list of all layers contained within the file."""
        layers = list(self.profile['layers'].keys())
        return set(layers).intersection(list(self._datasets.keys()))

    def xrange(self, layer, level):
        """Return a list of valid x coordinates."""
        pass

    def zrange(self, layer, level):
        """Return a list of valid z coordinates."""

    def tile(self, layer, level, x, z):
        """
        Read data from the file, interpolate on the regular grid specified
        in the profile and return an instance of tile.
        """

        tile = ccbrowse.Tile()
        tile.level = level
        tile.x = x
        tile.z = z
        tile.data = None

        # Your implementation here.

        return tile

    #
    # NOTE: You do not have to copy the following methods.
    #

    def save(self, layer, zoom, x, z):
        """Save tile (x, z) of layer at specified zoom level to profile."""
        tile = self.tile(layer, zoom, x, z)
        self.profile.save(l, tile)

    def offset(self):
        return self._offset

    def _calculate_offset(self, level):
        w = self.profile['zoom'][repr(level)]['width']

        traj1 = []
        traj2 = []

        for x in self.xrange('longitude', repr(level)):
            lon2 = self.tile(self.NAME+'-longitude', repr(level), x, 0)['data']
            lat2 = self.tile(self.NAME+'-latitude', repr(level), x, 0)['data']

            obj = self.profile.load({
                'layer': 'longitude',
                'zoom': repr(level),
                'x': x,
                'z': 0,
            })
            if obj is None: continue
            lon1 = obj['data']

            obj = self.profile.load({
                'layer': 'latitude',
                'zoom': repr(level),
                'x': x,
                'z': 0,
            })
            if obj is None: continue
            lat1 = obj['data']
            traj1 += list(zip(lon1[0,::8], lat1[0,::8]))
            traj2 += list(zip(lon2[0,::8], lat2[0,::8]))

        if len(traj1) == 0:
            raise ValueError('cannot calculate time offset: primary satellite data not available')

        def d(n):
            if n == 0: return utils.trajectories_distance(traj1, traj2)
            if n < 0: return utils.trajectories_distance(traj1[:n], traj2[-n:])
            return utils.trajectories_distance(traj1[n:], traj2[:-n])

        low = int(256.0*self.OFFSET_LOW*1000/w)
        high = int(256.0*self.OFFSET_HIGH*1000/w)

        res = utils.intoptim_convex(d, low, high)
        if not np.isfinite(res):
            raise ValueError('cannot calculate time offset: time offset is outside of the bounds [%.3f, %.3f] seconds' % \
                (self.OFFSET_LOW, self.OFFSET_HIGH))
        n = res*8
        offset = n*w/256
        return offset
