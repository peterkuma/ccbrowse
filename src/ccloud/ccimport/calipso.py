import datetime as dt
import pytz
import Nio
import numpy as np
import math
from scipy.interpolate import Rbf

import ccloud
import cctk
import calipso_constants

from .product import Product

class Calipso(Product):
    DATASETS = {
        'calipso532': 'Total_Attenuated_Backscatter_532',
        'calipso532p': 'Perpendicular_Attenuated_Backscatter_532',
        'latitude': 'Latitude',
        'longitude': 'Longitude',
        'trajectory': ('Latitude', 'Longitude'),
        #'pressure': 'Pressure',
    }
    
    LIDAR_ALTITUDES = calipso_constants.LIDAR_ALTITUDES
    MET_DATA_ALTITUDES = calipso_constants.MET_DATA_ALTITUDES

    def __init__(self, filename, profile):
        self.profile = profile
        self.nio = Nio.open_file(filename, "r", format="hdf")
    
    def layers(self):
        layers = self.profile['layers'].keys()
        return set(layers).intersection(self.DATASETS.keys())
        
    def xrange(self, layer, level):
        w = self.profile['zoom'][level]['width']
        
        time = self.nio.variables["Profile_UTC_Time"]
        t1 = self._td2ms(self._time2dt(time[0][0]) - self.profile['origin'][0])
        t2 = self._td2ms(self._time2dt(time[-1][0]) - self.profile['origin'][0])
        
        x1 = int(math.floor(t1 / w))
        x2 = int(math.ceil(t2 / w))
        return range(x1, x2)

    def zrange(self, layer, level):
        # One-dimensional layer.
        if self.profile['layers'][layer]['dimensions'] == 'x':
            return [0]
        
        # Two-dimensional layer.
        h = self.profile['zoom'][level]['height']
        z1 = int(math.floor((self.LIDAR_ALTITUDES[-1] - self.profile['origin'][1]) / h))
        z2 = int(math.ceil((self.LIDAR_ALTITUDES[0] - self.profile['origin'][1]) / h))
        return range(z1, z2)
    
    def tile(self, layer, level, x, z):
        tile = ccloud.Tile()
        tile.level = level
        tile.x = x
        tile.z = z
        
        datasets = self.DATASETS[layer]
        dataset = datasets[0] if type(datasets) == tuple else datasets
        
        w = self.profile['zoom'][level]['width']
        h = self.profile['zoom'][level]['height']
        
        t1 = x*w
        t2 = t1 + w
        
        z1 = z*h + self.profile['origin'][1]
        z2 = z1 + h
        
        time = self.nio.variables["Profile_UTC_Time"]
        
        if layer == 'pressure':
            height = self.MET_DATA_ALTITUDES
        else:
            height = self.LIDAR_ALTITUDES
        
        t0 = self._td2ms(self._time2dt(time[0][0]) - self.profile['origin'][0])
        tn = self._td2ms(self._time2dt(time[-1][0]) - self.profile['origin'][0])
        sampling_interval = (tn-t0)/time.shape[0]
        
        n1 = int(math.floor((t1 - t0)/sampling_interval))
        n2 = int(math.ceil((t2 - t0)/sampling_interval))
        
        m1 = len(height) - np.searchsorted(height[::-1], z2)
        m2 = len(height) - np.searchsorted(height[::-1], z1)
        
        n1_ = ccloud.utils.coerce(n1, 0, self.nio.variables[dataset].shape[0])
        n2_ = ccloud.utils.coerce(n2, 0, self.nio.variables[dataset].shape[0])
        
        # Trajectory - special case.
        if layer == 'trajectory':
            raw_data_lat = self.nio.variables[datasets[0]][n1_:n2_, 0]
            raw_data_lon = self.nio.variables[datasets[1]][n1_:n2_, 0]
            lat = np.interp(np.arange(n1, n2, (n2-n1)/256.0),
                            np.arange(n1_, n2_, dtype=np.float32),
                            raw_data_lat)
            lon = np.interp(np.arange(n1, n2, (n2-n1)/256.0),
                            np.arange(n1_, n2_, dtype=np.float32),
                            raw_data_lon)
            tile.type = 'geometry'
            tile.data = {
                'type': 'LineString',
                'coordinates': zip(lon, lat)
            }
            return tile
        
        # One-dimensional layer.
        if self.profile['layers'][layer]['dimensions'] == 'x':
            raw_data = self.nio.variables[dataset][n1_:n2_, 0]
            tile.data = np.interp(np.arange(n1, n2, (n2-n1)/256.0),
                                  np.arange(n1_, n2_, dtype=np.float32),
                                  raw_data).astype(np.float32).reshape(1, 256)
            return tile
        
        # Two-dimensional layer.
        raw_data = self.nio.variables[dataset][n1_:n2_,m1:m2]
        Z, N = np.meshgrid(height[m1:m2], np.arange(n1_, n2_, dtype=np.float32))
        
        interpolation = self.profile['layers'][layer].get('interpolation', 'nearest-neighbor')
        
        if interpolation == 'linear':
            raise NotImplementedError('Linear interpolation not implemented')
            #tile.data = np.zeros((256, 256), np.float32)
            #for i in range(256):
            #    tile.data[i,:] = np.interp(np.arange(z1, z2, (z2-z1)/256.0),
            #                               height[m1:m2],
            #                               raw_data[i,:])
        elif interpolation == 'rbf':
            rbf = Rbf(Z, N, raw_data)
            tile.data = rbf(np.arange(z1, z2, (z2-z1)/256.0),
                            np.arange(n1, n2, (n2-n1)/256.0))
        else:
            tile.data = cctk.interpolate2d(
                raw_data, Z, N, (z2, z1, 256),
                 (n1, n2, 256), float('nan'), 3, 3)
        
        return tile
    
    def _td2ms(self, td):
        return 1.0 * (td.microseconds + (td.seconds + td.days * 24 * 3600) * 10**6) / 10**3
    
    def _time2dt(self, time):
        """Convert time, a floating-point number in format yymmdd.ffffffff
        to a instance of python datetime class."""
        
        d = int(time % 100)
        m = int((time-d) % 10000)
        y = int(time-m-d)
        return dt.datetime(2000 + y//10000, m//100, d, tzinfo=pytz.utc) + dt.timedelta(time % 1)
