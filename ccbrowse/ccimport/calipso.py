import datetime as dt
import pytz
import numpy as np
import math
from scipy.interpolate import interp1d
from netCDF4 import Dataset

import ccbrowse
from . import calipso_constants
from ccbrowse.hdf import HDF
from ccbrowse.algorithms import interp2d

from .product import Product

class Calipso(Product):
    DATASETS = {
        'calipso532': ['Total_Attenuated_Backscatter_532'],
        'calipso532p': ['Perpendicular_Attenuated_Backscatter_532'],
        'calipso1064': ['Attenuated_Backscatter_1064'],
        'latitude': ['Latitude'],
        'longitude': ['Longitude'],
        'trajectory': ['Latitude', 'Longitude'],
    }

    LIDAR_ALTITUDES = calipso_constants.LIDAR_ALTITUDES
    MET_DATA_ALTITUDES = calipso_constants.MET_DATA_ALTITUDES

    def __init__(self, filename, profile, offset=None):
        Product.__init__(self, filename, profile, offset)
        try:
            self.hdf = HDF(filename)
        except OSError:
            self.hdf = Dataset(filename)
            self.hdf.set_auto_mask(False)
            self.hdf.set_always_mask(False)

    def layers(self):
        layers = list(self.profile['layers'].keys())
        return set(layers).intersection(list(self.DATASETS.keys()))

    def xrange(self, layer, level):
        w = self.profile['zoom'][level]['width']
        time = self.hdf['Profile_UTC_Time']
        t_origin = self.profile['origin'][0]
        t1 = self._dt2ms(self._time2dt(time[0,0]) - t_origin) + self.offset()
        t2 = self._dt2ms(self._time2dt(time[-1,0]) - t_origin) + self.offset()
        x1 = int(math.floor(t1 / w))
        x2 = int(math.floor(t2 / w))
        return list(range(x1, x2+1))

    def zrange(self, layer, level):
        # One-dimensional layer.
        if self.profile['layers'][layer]['dimensions'] == 'x':
            return [0]

        # Two-dimensional layer.
        h = self.profile['zoom'][level]['height']
        z1 = int(math.floor((self.LIDAR_ALTITUDES[-1] - self.profile['origin'][1]) / h))
        z2 = int(math.floor((self.LIDAR_ALTITUDES[0] - self.profile['origin'][1]) / h))
        return list(range(z1, z2+1))

    def tile(self, layer, level, x, z):
        #
        #    z ^
        #      |
        #  mm  +     +----------------------------------------+
        #      |     |                                        |
        #      |     |                PRODUCT                 |
        #      |     |                                        |
        #  z2  + - - + - - - - - +---------+                  |
        # (m2) |     |           |         |                  |
        #      |     |           |  tile   h                  |
        #      |     |           |         |                  |
        #  z1  + - - + - - - - - +----w----+                  |
        # (m1) |     |                                        |
        #      |     |                                        |
        #  m0  +-----+-----------+---------+------------------+------------->
        #           t0          t1 (n1)   t2 (n2)            tn (nn)       t

        tile = {
            'layer': layer,
            'zoom': level,
            'x': x,
            'z': z,
        }

        datasets = [self.hdf[name] for name in self.DATASETS[layer]]
        dataset = datasets[0]
        height = self.LIDAR_ALTITUDES

        w = self.profile['zoom'][level]['width']
        h = self.profile['zoom'][level]['height']
        t_origin = self.profile['origin'][0]
        z_origin = self.profile['origin'][1]
        n0 = 0
        nn = dataset.shape[0]
        m0 = 0
        mm = dataset.shape[1]
        time = self.hdf['Profile_UTC_Time']
        t0 = self._dt2ms(self._time2dt(time[0,0]) - t_origin)
        tn = self._dt2ms(self._time2dt(time[-1,0]) - t_origin)
        sampling_interval = (tn - t0)/(nn - n0)
        t1 = x*w
        t2 = t1 + w
        z1 = z*h + z_origin
        z2 = z1 + h
        n1 = (t1 - t0)/sampling_interval
        n2 = (t2 - t0)/sampling_interval
        n1_ = ccbrowse.utils.coerce(int(math.floor(n1)), n0, nn-1)
        n2_ = ccbrowse.utils.coerce(int(math.ceil(n2)+1), n0, nn-1)
        m1 = len(height) - np.searchsorted(height[::-1], z2) - 1
        m1 = ccbrowse.utils.coerce(m1, m0, mm-1)
        m2 = len(height) - np.searchsorted(height[::-1], z1) + 1
        m2 = ccbrowse.utils.coerce(m2, m0, mm-1)

        # Trajectory - special case.
        if layer == 'trajectory':
            raw_data_lat = datasets[0][n1_:n2_, 0]
            raw_data_lon = datasets[1][n1_:n2_, 0]
            lat = np.interp(np.arange(n1, n2, (n2-n1)/256.0),
                            np.arange(n1_, n2_, dtype=np.float32),
                            raw_data_lat)
            lon = np.interp(np.arange(n1, n2, (n2-n1)/256.0),
                            np.arange(n1_, n2_, dtype=np.float32),
                            raw_data_lon)
            tile['data'] = {
                'type': 'FeatureCollection',
                'properties': {},
                'features': [{
                    'type': 'Feature',
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': list(zip(lon, lat))
                    },
                }]
            }
            return tile

        # One-dimensional layer.
        if self.profile['layers'][layer]['dimensions'] == 'x':
            raw_data = dataset[n1_:n2_, 0]
            tile['data'] = np.interp(np.arange(n1, n2, (n2-n1)/256.0),
                                     np.arange(n1_, n2_, dtype=np.float32),
                                     raw_data).astype(np.float32).reshape(1, 256)
            return tile

        # Two-dimensional layer.
        raw_data = dataset[n1_:n2_,m1:m2]
        interpolation = self.profile['layers'][layer].get('interpolation', 'smart')

        raw_data = np.ma.masked_array(raw_data)
        raw_data.set_fill_value(np.nan)

        try:
            fillvalue = dataset.attributes['fillvalue']
            raw_data = np.ma.masked_equal(raw_data, fillvalue, copy=False)
        except (KeyError, AttributeError): pass

        if interpolation == 'smart':
            N = np.arange(n1, n2, (n2-n1)/256.0)
            N = np.round(N).astype(int) - n1_
            f = interp1d(height[m1:m2][::-1], np.arange(m1, m2)[::-1], 'nearest',
                         bounds_error=False, fill_value=m1-1)
            M = f(np.arange(z1, z2, (z2-z1)/256.0)[::-1])
            M = np.round(M).astype(int) - m1
            data = interp2d(raw_data.astype(np.float32).filled(),
                            N.astype(np.float32),
                            M.astype(np.float32))
            tile['data'] = data.T.copy()

        elif interpolation == 'nearest':
            N = np.arange(n1, n2, (n2-n1)/256.0)
            N = np.round(N).astype(np.int) - n1_
            N = np.ma.masked_outside(N, 0, raw_data.shape[0]-1, copy=False)
            N.set_fill_value(0)

            f = interp1d(height[m1:m2][::-1], np.arange(m1, m2)[::-1], 'nearest',
                         bounds_error=False, fill_value=m1-1)
            M = f(np.arange(z1, z2, (z2-z1)/256.0)[::-1])
            M = np.round(M).astype(np.int) - m1
            M = np.ma.masked_outside(M, 0, raw_data.shape[1]-1, copy=False)
            M.set_fill_value(0)

            Mmask = M.mask if M.mask.ndim else np.zeros(M.shape, dtype=np.bool)
            Nmask = N.mask if N.mask.ndim else np.zeros(N.shape, dtype=np.bool)
            mask = ~(np.asmatrix(~Mmask).T*np.asmatrix(~Nmask))
            mesh = np.meshgrid(N.filled(), M.filled())
            data = np.ma.masked_where(mask, raw_data[mesh], copy=False)
            tile['data'] = data.filled(np.nan)

        else:
            raise RuntimeError('Unknown interpolation %s' % interpolation)

        return tile

    def _dt2ms(self, td):
        return 1.0 * (td.microseconds + (td.seconds + td.days * 24 * 3600) * 10**6) / 10**3

    def _time2dt(self, time):
        """Convert time, a floating-point number in format yymmdd.ffffffff
        to a instance of python datetime class."""

        d = int(time % 100)
        m = int((time-d) % 10000)
        y = int(time-m-d)
        return dt.datetime(2000 + y//10000, m//100, d, tzinfo=pytz.utc) + dt.timedelta(time % 1)
