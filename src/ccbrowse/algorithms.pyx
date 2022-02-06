cimport cython
cimport numpy as np
import numpy as np
from PIL import ImageColor

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


#@cython.boundscheck(False)
#@cython.wraparound(False)
#@cython.cdivision(True)
def interp2d_12(np.ndarray[float, ndim=2, mode="c"] data not None,
                np.ndarray[float, ndim=1, mode="c"] X not None,
                np.ndarray[float, ndim=2, mode="c"] Z not None,
                float x1, float x2, int nx,
                float z1, float z2, int nz):
    """Interpolate 2D data with coordinates given by 1D and 2D arrays.

    data is a two-dimensional array of data to be interpolated.
    X and Z are one- and two-dimensional arrays, giving coordinates
    of data points along the first and second axis, resp.

    data, X and Z are expected to be C-contiguous float32 numpy arrays
    with no mask and no transformation (such as transposition) applied.
    """
    cdef int i, j, n, m
    cdef float n1, n2
    cdef float m1, m2
    cdef float xs, zs
    cdef int w, h

    xs = (x2 - x1)/nx
    zs = (z2 - z1)/nz
    w = data.shape[0]
    h = data.shape[1]

    output = np.zeros((nx, nz), dtype=np.float32)
    cdef np.ndarray[float, ndim=2] out = output
    cdef np.ndarray[int, ndim=2] q = np.zeros((nx, nz), dtype=np.int32)

    for i in range(w):
        n1 = ((X[i-1] + X[i])/2 - x1)/xs if i-1 >= 0 else -1
        n2 = ((X[i+1] + X[i])/2 - x1)/xs if i+1 < w else nx
        if n2 - n1 < 1: n1 = n2 = (X[i] - x1)/xs

        for j in range(h):
            m1 = ((Z[i,j-1] + Z[i,j])/2 - z1)/zs if j-1 >= 0 else -1
            m2 = ((Z[i,j+1] + Z[i,j])/2 - z1)/zs if j+1 < h else nz
            if m2 - m1 < 1: m1 = m2 = (Z[i,j] - z1)/zs

            for n in range(<int>(n1+0.5), <int>(n2+0.5+1)):
                for m in range(<int>(m1+0.5), <int>(m2+0.5+1)):
                    if n < 0 or n >= nx: continue
                    if m < 0 or m >= nz: continue
                    if isnan(data[i,j]): continue
                    out[n,m] += data[i,j]
                    q[n,m] += 1

    for n in range(nx):
        for m in range(nz):
            out[n,m] /= q[n,m]

    return output


#@cython.boundscheck(False)
#@cython.wraparound(False)
def colorize(np.ndarray[float, ndim=2, mode="c"] data not None,
             colormap):

    cdef int i, j, k, l

    cdef np.ndarray[unsigned char, ndim=1] missing, under, over
    cdef np.ndarray[unsigned char, ndim=2] colors
    cdef np.ndarray[float, ndim=2] bounds
    cdef np.ndarray[int, ndim=1] cindex
    cdef np.ndarray[unsigned char, ndim=3] out

    cdef int w = data.shape[0]
    cdef int h = data.shape[1]
    cdef int n = len(colormap['bounds'])

    out = np.zeros((w, h, 4), np.uint8)

    missing = np.zeros(4, np.uint8)
    over = np.zeros(4, np.uint8)
    under = np.zeros(4, np.uint8)

    if 'missing' in colormap:
        missing = np.array(ImageColor.getrgb(colormap['missing'])+(255,), np.uint8)

    if 'under' in colormap:
        under = np.array(ImageColor.getrgb(colormap['under'])+(255,), np.uint8)

    if 'over' in colormap:
        over = np.array(ImageColor.getrgb(colormap['over'])+(255,), np.uint8)

    colors = np.array([ImageColor.getrgb(c)+(255,) for c in colormap['colors']],
                      np.uint8)

    bounds = np.array(
        [(b['start'], b['end'], 1.0*(b['end'] - b['start'])/b['steps'])
         for b in colormap['bounds']],
        np.float32
    )

    cindex = np.zeros(n, np.int32)
    i = 0
    for b in colormap['bounds'][:-1]:
        cindex[i+1] = cindex[i] + b['steps']
        i += 1

    for i in range(w):
        for j in range(h):
            for k in range(n):
                if data[i,j] >= bounds[k,0] and data[i,j] < bounds[k,1]:
                    l = <int>(cindex[k]+(data[i,j]-bounds[k,0])/bounds[k,2])
                    out[i,j,0] = colors[l,0]
                    out[i,j,1] = colors[l,1]
                    out[i,j,2] = colors[l,2]
                    out[i,j,3] = colors[l,3]
                    break

    for i in range(w):
        for j in range(h):
            if isnan(data[i,j]):
                out[i,j,0] = missing[0]
                out[i,j,1] = missing[1]
                out[i,j,2] = missing[2]
                out[i,j,3] = missing[3]

    if n == 0: return out

    for i in range(w):
        for j in range(h):
            if data[i,j] < bounds[0,0]:
                out[i,j,0] = under[0]
                out[i,j,1] = under[1]
                out[i,j,2] = under[2]
                out[i,j,3] = under[3]

    for i in range(w):
        for j in range(h):
            if data[i,j] >= bounds[n-1,1]:
                out[i,j,0] = over[0]
                out[i,j,1] = over[1]
                out[i,j,2] = over[2]
                out[i,j,3] = over[3]

    return out
