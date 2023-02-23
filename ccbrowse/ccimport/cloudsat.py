import datetime as dt
import pytz
import numpy as np
import scipy.optimize
import math

import ccbrowse
from ccbrowse.hdfeos import HDFEOS
from ccbrowse.algorithms import interp2d_12

from .product import Product

class CloudSat(Product):
    NAME = 'cloudsat'

    DATASETS = {
        'cloudsat-reflec': ['Radar_Reflectivity'],
        'cloudsat-latitude': ['Latitude'],
        'cloudsat-longitude': ['Longitude'],
        'cloudsat-trajectory': ['Latitude', 'Longitude'],
    }

    DATASETS_PRIMARY = {
        'latitude': ['Latitude'],
        'longitude': ['Longitude'],
        'trajectory': ['Latitude', 'Longitude'],
    }

    def __init__(self, filename, profile):
        self.hdfeos = HDFEOS(filename)
        self.swath = self.hdfeos['2B-GEOPROF']
        Product.__init__(self, filename, profile)

    def xrange(self, layer, level):
        w = self.profile['zoom'][level]['width']
        start = self.swath.attributes['start_time']
        time = self.swath['Profile_time'][:].astype(np.float64)
        start = dt.datetime.strptime(start, "%Y%m%d%H%M%S").replace(tzinfo=pytz.utc)
        origin = self.profile['origin'][0]
        origin_to_start = (start - origin).total_seconds()
        t = (origin_to_start + time) * 1000 + self.offset()
        quality = self.swath['Data_quality'][:]
        mask = (quality & 0x40) == 0
        x = np.unique((t[mask] / w).astype(int))
        return x.tolist()

    def zrange(self, layer, level):
        # One-dimensional layer.
        if self.profile['layers'][layer]['dimensions'] == 'x':
            return [0]

        # Two-dimensional layer.
        h = self.profile['zoom'][level]['height']
        height = self.swath['Height']
        low = min(height[:,-1])
        high = max(height[:,0])
        z1 = int(math.floor((low - self.profile['origin'][1])/h))
        z2 = int(math.floor((high - self.profile['origin'][1])/h))
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

        datasets = [self.swath[name] for name in self._datasets[layer]]
        dataset = datasets[0]
        height = self.swath['Height']
        start = self.swath.attributes['start_time']
        start = dt.datetime.strptime(start, "%Y%m%d%H%M%S").replace(tzinfo=pytz.utc)

        w = self.profile['zoom'][level]['width']
        h = self.profile['zoom'][level]['height']
        t_origin = self.profile['origin'][0]
        z_origin = self.profile['origin'][1]
        n0 = 0
        nn = dataset.shape[0]
        m0 = 0
        mm = dataset.shape[1] if len(dataset.shape) == 2 else 0
        time = self.swath['Profile_time']
        t0 = self._dt2ms(self._time(time[0], start) - t_origin) + self.offset()
        tn = self._dt2ms(self._time(time[-1], start) - t_origin) + self.offset()
        sampling_interval = (tn - t0)/(nn - n0)
        t1 = x*w
        t2 = t1 + w
        z1 = z*h + z_origin
        z2 = z1 + h
        n1 = (t1 - t0)/sampling_interval
        n2 = (t2 - t0)/sampling_interval
        n1_ = ccbrowse.utils.coerce(int(math.floor(n1)), n0, nn-1)
        n2_ = ccbrowse.utils.coerce(int(math.ceil(n2)+1), n0, nn-1)

        # Trajectory - special case.
        if layer in ('trajectory', self.NAME+'-trajectory'):
            raw_data_lat = datasets[0][n1_:n2_]
            raw_data_lon = datasets[1][n1_:n2_]
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
        if len(dataset.shape) == 1:
            raw_data = dataset[n1_:n2_]
            tile['data'] = np.interp(np.arange(n1, n2, (n2-n1)/256.0),
                                     np.arange(n1_, n2_, dtype=np.float32),
                                     raw_data).astype(np.float32).reshape(1, 256)
            return tile

        factor = height.attributes['factor']
        offset = height.attributes['offset']
        height = (height[n1_:n2_,:] - offset)/factor
        height_max = height.max(0)
        height_min = height.min(0)
        m1 = len(height_max) - np.searchsorted(height_max[::-1], z2) - 1
        m1 = ccbrowse.utils.coerce(m1, m0, mm-1)
        m2 = len(height_min) - np.searchsorted(height_min[::-1], z1) + 1
        m2 = ccbrowse.utils.coerce(m2, m0, mm-1)
        height = height[:,m1:m2]

        # Two-dimensional layer.
        raw_data = dataset[n1_:n2_,m1:m2].astype(np.float32)

        raw_data = np.ma.masked_array(raw_data)


        try:
            fillvalue = dataset.attributes['_FillValue']
            raw_data = np.ma.masked_equal(raw_data, fillvalue, copy=False)
        except KeyError as IndexError: pass

        try:
            valid_range = dataset.attributes['valid_range']
            low = valid_range[0]
            high = valid_range[1]
            raw_data = np.ma.masked_outside(raw_data, low, high, copy=False)
        except KeyError as IndexError: pass

        factor = dataset.attributes['factor']
        offset = dataset.attributes['offset']
        raw_data = (raw_data - offset)/factor

        raw_data.set_fill_value(np.nan)

        interpolation = self.profile['layers'][layer].get('interpolation', 'smart')
        if interpolation == 'smart':
            X = np.arange(n1_, n2_, dtype=np.float32)
            Z = height.copy()
            data = interp2d_12(raw_data.filled(), X, Z, n1, n2, 256, z2, z1, 256)
            tile['data'] = data.T.copy()
        else:
            raise RuntimeError('Unknown interpolation %s' % interpolation)

        return tile

    def _dt2ms(self, td):
        return 1.0 * (td.microseconds + (td.seconds + td.days * 24 * 3600) * 10**6) / 10**3

    def _time(self, time, start):
        return start + dt.timedelta(0, float(time))
