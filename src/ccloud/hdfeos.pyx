cimport cython
cimport numpy as np
import numpy as np
from contextlib import contextmanager

cdef extern from "errno.h":
    cdef extern int errno
    
    cdef enum:
        EIO = 5

cdef extern from "string.h":
    char *strerror(int)
    
cdef extern from "hdf/hntdefs.h":
    cdef enum:
        DFNT_UCHAR = 3
        DFNT_CHAR = 4
        DFNT_FLOAT32 = 5
        DFNT_FLOAT64 = 6
        DFNT_INT8 = 20
        DFNT_UINT8 = 21
        DFNT_INT16 = 22
        DFNT_UINT16 = 23
        DFNT_INT32 = 24
        DFNT_UINT32 = 25
        DFNT_INT64 = 26
        DFNT_UINT64 = 27

cdef extern from "hdf/hdf.h":
    cdef enum:
        FAIL = -1
        DFACC_READ = 1
        MAX_VAR_DIMS = 32
        FIELDNAMELENMAX = 128
        DFACC_RDONLY = 1
    
    ctypedef np.npy_int16 int16
    ctypedef np.npy_int32 int32
    ctypedef int intn
    ctypedef int hdf_err_code_t
    ctypedef void * VOIDP
    
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
    int16 HEvalue(int32)
    char *HEstring(hdf_err_code_t)
    
cdef extern from "hdf/HdfEosDef.h":
    int32 SWopen(char *, intn)
    int32 SWattach(int32, char *)
    intn SWfieldinfo(int32, char *, int32 *, int32 [], int32 *, char *)
    intn SWreadattr(int32, char *, VOIDP)
    intn SWattrinfo(int32, char *attrname, int32 *numbertype, int32 *count)
    intn SWreadfield(int32, char *, int32 [], int32 [], int32 [], VOIDP)
    intn SWgetfillvalue(int32, char *, VOIDP)
    intn SWdetach(int32)
    intn SWclose(int32)

DTYPE = {
    DFNT_UCHAR: np.ubyte,
    DFNT_CHAR: np.byte,
    DFNT_FLOAT32: np.float32,
    DFNT_FLOAT64: np.float64,
    DFNT_INT8: np.int8,
    DFNT_UINT8: np.uint8,
    DFNT_INT16: np.int16,
    DFNT_UINT16: np.uint16,
    DFNT_INT32: np.int32,
    DFNT_UINT32: np.uint32,
    DFNT_INT64: np.int64,
    DFNT_UINT64: np.uint64,
}


class Attributes(object):
    def __init__(self, hdfeos, swath, dataset=None):
        self.hdfeos = hdfeos
        self.swath = swath
        self.dataset = dataset
    
    def __getitem__(self, key):
        try:
            return self.hdfeos._readattr(self.swath, self.dataset, key)
        except IOError: raise KeyError(key)


class Dataset(object):
    def __init__(self, hdfeos, swath, name):
        self.hdfeos = hdfeos
        self.swath = swath
        self.name = name
        info = self.hdfeos._getinfo(swath, name)
        self.shape = info['shape']
        self.rank = len(self.shape)
        self.attributes = Attributes(self.hdfeos, swath, name)
        
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
        
        data = self.hdfeos._read(self.swath, self.name, starta, edgesa)
        shape = []
        for n, d in zip(data.shape, dims):
            if d: shape.append(n)
        if len(shape) == 0: return data.ravel()[0]
        else: return data.reshape(shape)


class Swath(object):
    def __init__(self, hdfeos, name):
        self.hdfeos = hdfeos
        self.name = name
        self.attributes = Attributes(self.hdfeos, self.name)
    
    def __getitem__(self, key):
        return Dataset(self.hdfeos, self.name, key)


class HDFEOS(object):
    def __init__(self, filename):
        self.filename = filename
        self.id = SWopen(filename, DFACC_RDONLY);
        if self.id == -1:
            raise IOError(EIO, 'Cannot open file', self.filename)
    
    def __enter__(self):
        pass
    
    def __exit__(self):
        SWclose(self.id)

    def __getitem__(self, key):
        try:
            sw = self._sw(key)
            self._sw_close(sw)
            return Swath(self, key)
        except IOError: raise KeyError(key)
    
    def _sw(self, name):
        sw = SWattach(self.id, name)
        if sw == -1:
            raise IOError(EIO, 'Failed to attach swath "%s"' % name, self.filename)
        return sw
    
    def _sw_close(self, sw):
        res = SWdetach(sw)
        if res == -1:
            raise IOError(EIO, 'Failed to detach swath %d' % sw, self.filename)
        
    def _getinfo(self, swath, name):
        cdef int32 rank, data_type
        cdef np.ndarray[int32, ndim=1] dims
        dims = np.zeros(MAX_VAR_DIMS, dtype=np.int32)
        sw = self._sw(swath)
        res = SWfieldinfo(sw, name, &rank, <int32 *>dims.data, &data_type, NULL)
        self._sw_close(sw)
        if res == FAIL:
            raise IOError(EIO, 'Failed to read field "%s/%s"' % (swath, name), self.filename)
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
    
    def _read(self, swath, name, start, edges):
        info = self._getinfo(swath, name)
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
        sw = self._sw(swath)
        res = SWreadfield(sw, name, <int32 *>cstart.data, NULL, <int32 *>cedges.data, <void *>buf.data)
        self._sw_close(sw)
        data = buf.view(dtype=dtype).reshape(edges)
        return data
    
    def _readattr(self, swath, dataset, name):
        cdef int32 data_type, count
        cdef np.ndarray[char, ndim=1] tmp
        
        attrname = name if dataset is None else '%s.%s' % (dataset, name)
        
        tmp = np.zeros(FIELDNAMELENMAX, dtype=np.byte)
        sw = self._sw(swath)
        res = SWattrinfo(sw, attrname, &data_type, &count)
        self._sw_close(sw)
        if res == FAIL:
            raise IOError(EIO, 'Cannot read attribute "%s/%s"' %
                          (swath, attrname), self.filename)
        
        try: dtype = DTYPE[data_type]
        except KeyError: raise NotImplementedError('%s: %s: Data type %s not implemented'
                                              % (self.filename, attrname, data_type))
        count = count/dtype().itemsize
        
        data = np.zeros(count, dtype=dtype)
        cdef np.ndarray[char, ndim=1] buf = data.view(dtype=np.int8).ravel()
        sw = self._sw(swath)
        res = SWreadattr(sw, attrname, <void *>buf.data)
        self._sw_close(sw)
        if res == FAIL:
            self._error(EIO, 'Cannot read attribute "%s/%s"' %
                        (swath, dataset), self.filename)
        
        if data_type == DFNT_CHAR: data = bytearray(data).decode('ascii')
        
        return data[0] if count == 1 else data
