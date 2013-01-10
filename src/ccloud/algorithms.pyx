cimport cython
cimport numpy as np
import numpy as np

cdef extern from "math.h":
    double floor(double)
    double ceil(double)
    double round(double)
    bint isnan(double x)

@cython.boundscheck(False)
@cython.wraparound(False)
@cython.cdivision(True)
def interp2d(np.ndarray[float, ndim=2, mode="c"] data not None,
             np.ndarray[float, ndim=1, mode="c"] N not None,
             np.ndarray[float, ndim=1, mode="c"] M not None):
    """Interpolate 2D data on given points.
    
    data is a two-dimensional array of data to be interpolated.
    N and M are one-dimensional arrays giving indices of interpolation
    points in the first and second dimension, resp. The indices can be
    floating-point numbers. The value at an interpolation point (N[i],M[j]) is
    computed as an average of data points lying in a square
    spanning the area between half-way to the previous interpolation point
    and half-way to the next interpolation point in both directions. That is:
    
        {n} = round((N[i-1]+N[i])/2), ..., round((N[i]+N[i+1])/2)
        {m} = round((M[j-1]+M[j])/2), ..., round((M[j]+M[j+1])/2)
    
        value = avg(data[{n},{m])
    
    Boundaries of the square are rounded to the nearest interger. When the
    width (height) of the square is less than 1 (density of interpolation
    points is higher than of data points), nearest-neighbor interpolation
    is performed in that direction. When both width and height of the square
    are less than one, ordinary nearest-neighbor interpolation is performed.
    That is:
    
        if max({n}) - min({n}) < 1: {n} = round(N[i])
        if max({m}) - min({m}) < 1: {m} = round(M[j])
    
    data, N and M are expected to be C-contiguous float32 numpy arrays
    with no mask and no transformation (such as transposition) applied.
    """
    cdef int i, j, n, m
    cdef int q
    cdef float n1, n2
    cdef float m1, m2
    cdef int lenM, lenN
    cdef int w, h
    lenM = M.shape[0]
    lenN = N.shape[0]
    w = data.shape[0]
    h = data.shape[1]
    
    output = np.zeros((lenN, lenM), dtype=np.float32)
    cdef np.ndarray[float, ndim=2] out = output
    
    for i in range(lenN):
        for j in range(lenM):
            n1 = (N[i-1]+N[i])/2 if i-1 >= 0 else floor(N[i])
            n2 = (N[i+1]+N[i])/2 if i+1 < lenN else ceil(N[i])
            
            m1 = (M[j-1]+M[j])/2 if j-1 >= 0 else floor(M[j])
            m2 = (M[j+1]+M[j])/2 if j+1 < lenM else ceil(M[j])
            
            if n2 - n1 < 1: n1 = n2 = N[i]
            if m2 - m1 < 1: m1 = m2 = M[j]
            
            q = 0
            for n in range(<int>(n1+0.5), <int>(n2+0.5+1)):
                for m in range(<int>(m1+0.5), <int>(m2+0.5+1)):
                    if n < 0 or n >= w: continue
                    if m < 0 or m >= h: continue
                    if isnan(data[n,m]): continue
                    out[i,j] += data[n,m]
                    q += 1
            # Assumption: q != 0.
            out[i,j] /= q
    
    return output
