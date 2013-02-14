import os
from distutils.core import setup, Extension
from glob import glob
from Cython.Distutils import build_ext

def find(prefix, path):
    l = []
    for dirpath, dirnames, filenames in os.walk(path):
        fl = [os.path.join(dirpath, f) for f in filenames]
        l.append((os.path.join(prefix, dirpath[len(path):].lstrip('/')), fl))
    return l

data_files = [
    ('share/doc/ccloud/', ['README.md']),
]

data_files += find('share/ccloud/template/', 'template')
data_files += find('share/ccloud/www/', 'www')
data_files += find('share/ccloud/colormaps/', 'colormaps')

setup(
    name='ccloud',
    version='0.1',
    author='Peter Kuma',
    author_email='peterkuma@waveland.org',
    url='https://github.com/peterkuma/ccloud',
    license = "MIT",
    platforms='any',
    requires=['numpy', 'bottle', 'suds'],
    package_dir={'': 'src'},
    packages=[
        'ccloud',
        'ccloud.fetch',
        'ccloud.ccimport',
        'ccloud.storage'
    ],
    scripts=[
        'src/bin/ccfetch',
        'src/bin/ccimport',
        'src/bin/ccinfo',
        'src/bin/ccloud',
        'src/bin/ccserver',
        'src/bin/cchtree-clean',
    ],
    cmdclass = {'build_ext': build_ext},
    ext_modules=[
        Extension('ccloud.algorithms',
                  ['src/ccloud/algorithms.pyx'],
                  extra_compile_args=['-march=native'],
        ),
        Extension('ccloud.hdf',
                  ['src/ccloud/hdf.pyx'],
                  libraries=['mfhdf', 'df', 'jpeg', 'z'],
                  extra_compile_args=['-march=native'],
        ),
        Extension('ccloud.hdfeos',
                  ['src/ccloud/hdfeos.pyx'],
                  libraries=['hdfeos', 'mfhdf', 'df', 'jpeg', 'z'],
                  extra_compile_args=['-I/usr/include/hdf', '-march=native'],
        ),
    ],
    data_files=data_files,
)
