cimport cython
cimport numpy as np
import numpy as np
from contextlib import contextmanager

cdef extern from "hdf/hdf.h":
    cdef enum:
        FAIL = -1
        DFACC_READ = 1
        MAX_VAR_DIMS = 32
        FIELDNAMELENMAX = 128
        
    cdef enum:
        DFNT_INT32 = 24
        DFNT_FLOAT32 = 5
        DFNT_FLOAT64 = 6
        
    ctypedef np.npy_int32 int32
    ctypedef int intn
    
    int32 SDstart(char *, int32)
    int32 SDnametoindex(int32, char *)
    int32 SDselect(int32, int32)
    intn SDgetinfo(int32, char *, int32 *, int32 [], int32 *, int32 *)
    intn SDreaddata(int32, int32 *, int32 *, int32 *, void *)
    intn SDendaccess(int32)
    intn SDend(int32)
    intn SDattrinfo(int32, int32, char *, int32 *, int32 *)
    intn SDreadattr(int32, int32, void *)
    int32 SDfindattr(int32, char *)

DTYPE = {
    DFNT_INT32: np.int32,
    DFNT_FLOAT32: np.float32,
    DFNT_FLOAT64: np.float64,
}

class Attributes(object):
    def __init__(self, hdf, dataset):
        self.hdf = hdf
        self.dataset = dataset
    
    def __getitem__(self, key):
        return self.hdf._readattr(self.dataset, key)


class Dataset(object):
    def __init__(self, hdf, name):
        self.hdf = hdf
        self.name = name
        info = self.hdf._getinfo(name)
        self.shape = info['shape']
        self.rank = len(self.shape)
        self.attributes = Attributes(self.hdf, name)
        
    def __getitem__(self, key):
        starta = np.zeros(self.rank, dtype=np.int32)
        edgesa = self.shape.copy()
        
        if type(key) != tuple:
            key = (key,)
        
        if len(key) > self.rank:
            raise IndexError('too many indices')
        
        dims = np.ones(self.rank, dtype=np.bool)
        for i, s, n in zip(range(self.rank), key, self.shape):
            if type(s) != slice:
                if s < 0: s += n
                if s < 0 or s >= n: raise IndexError('index out of bounds')
                starta[i] = s
                edgesa[i] = 1
                dims[i] = False
            else:
                if s.step is not None:
                    raise IndexError('stride not supported')
                start, stop = s.start, s.stop
                if start is None: start = 0
                if stop is None: stop = n
                if start < 0: start += n
                if stop < 0: stop += n
                start = min(max(0, n-1), max(0, start))
                stop = min(n, max(0, stop))
                starta[i] = start
                edgesa[i] = max(0, stop - start)
        
        data = self.hdf._read(self.name, starta, edgesa)
        shape = []
        for n, d in zip(data.shape, dims):
            if d: shape.append(n)
        if len(shape) == 0: return data.ravel()[0]
        else: return data.reshape(shape)

class HDF(object):
    def __init__(self, filename):
        self.filename = filename
        self.sd = SDstart(filename, DFACC_READ);
        if self.sd == FAIL:
            raise IOError('%s: Failed to open file' % filename)
    
    def __enter__(self):
        pass
    
    def __exit__(self):
        SDend(self.sd)

    def __getitem__(self, key):
        sds = self._sds(key)
        self._sds_close(sds)
        return Dataset(self, key)

    def _sds(self, name):
        index = SDnametoindex(self.sd, name)
        if index == FAIL:
            raise KeyError('%s: %s: No such dataset' % (self.filename, name))
        sds = SDselect(self.sd, index)
        if sds == FAIL:
            raise IOError('%s: %s: Failed to open dataset' % (self.filename, name))
        return sds
    
    def _sds_close(self, sds):
        SDendaccess(sds)
        
    def _getinfo(self, name):
        cdef int32 rank, data_type
        cdef np.ndarray[int32, ndim=1] dims
        dims = np.zeros(MAX_VAR_DIMS, dtype=np.int32)
        sds = self._sds(name)
        res = SDgetinfo(sds, NULL, &rank, <int32 *>dims.data, &data_type, NULL)
        self._sds_close(sds)
        if res == FAIL:
            raise IOError('%s: %s: Failed to read dataset' % (self.filename, name))
        try: dtype = DTYPE[data_type]
        except KeyError: raise NotImplementedError('%s: %s: Data type %s not implemented'
                                              % (self.filename, name, data_type))
        return dict(shape=dims[:rank], dtype=dtype)
    
    def _normalize(self, index, dims, default=0, incl=False):
        if len(index) > len(dims):
            raise IndexError('too many indices')
        r = len(index)
        newindex = np.ones(len(dims), dtype=np.int32)*default
        newindex[:r] = index
        for i in range(len(dims)):
            if newindex[i] < 0: newindex[i] += dims[i]
            if newindex[i] < 0 or newindex[i] > dims[i] or \
               (newindex[i] == dims[i] and not incl):
                raise IndexError('index out of bounds')
        return newindex
    
    def _read(self, name, start, edges):
        info = self._getinfo(name)
        shape = info['shape']
        dtype = info['dtype']
        
        if len(start) != len(shape) or len(edges) != len(shape):
            raise IndexError('invalid number of indices')
        
        if np.any(np.logical_or(start < 0, start >= shape)) or\
           np.any(np.logical_or(edges < 0, edges - start > shape)):
            raise IndexError('index out of bounds')
        
        cdef np.ndarray[int32, ndim=1] cstart = np.array(start, dtype=np.int32)
        cdef np.ndarray[int32, ndim=1] cedges = np.array(edges, dtype=np.int32)
        data = np.zeros(edges, dtype=dtype)
        cdef np.ndarray[char, ndim=1] buf = data.view(dtype=np.int8).ravel()
        sds = self._sds(name)
        res = SDreaddata(sds, <int32 *>cstart.data, NULL, <int32 *>cedges.data, <void *>buf.data);
        self._sds_close(sds)
        data = buf.view(dtype=dtype).reshape(edges)
        return data
    
    def _readattr(self, dataset, name):
        cdef int32 data_type, count
        
        sds = self._sds(dataset)
        index = SDfindattr(sds, name)
        self._sds_close(sds)
        if index == FAIL:
            raise KeyError('%s: %s has no attribute %s' % (self.filename, dataset, name))
        sds = self._sds(dataset)
        cdef np.ndarray[char, ndim=1] tmp = np.zeros(FIELDNAMELENMAX, dtype=np.byte)
        res = SDattrinfo(sds, index, <char *>tmp.data, &data_type, &count)
        self._sds_close(sds)
        if res == FAIL:
            raise IOError('%s: %s: Failed to read attribute %s' % (self.filename, dataset, name))        
        
        try: dtype = DTYPE[data_type]
        except KeyError: raise NotImplementedError('%s: %s: Data type %s not implemented'
                                              % (self.filename, name, data_type))
        
        data = np.zeros(count, dtype=dtype)
        cdef np.ndarray[char, ndim=1] buf = data.view(dtype=np.int8).ravel()
        sds = self._sds(dataset)
        res = SDreadattr(sds, index, <void *>buf.data);
        self._sds_close(sds)
        
        if res == FAIL:
            raise IOError('%s: %s: Failed to read attribute %s' % (self.filename, dataset, name))
        
        return data[0] if count == 1 else data
