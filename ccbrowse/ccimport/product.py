# This file is a template for your product importer. Copy the entire content
# excluding the save method, and provide your own implementation of methods
# as described in comments. Give your class a suitable name and make it
# inherit from Product.
# When finished, add handling of the product type to ccimport.

import ccbrowse

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

    def __init__(self, filename, profile, offset=None):
        """Product initialization."""
        self.profile = profile
        self.filename = filename
        self._offset = offset
        # Open the file and save the handler to a member variable.

    def layers(self):
        """Return a list of all layers contained within the file."""
        layers = list(self.profile['layers'].keys())
        return set(layers).intersection(list(self.DATASETS.keys()))

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
        return self._offset if self._offset is not None else 0
