import os
from distutils.core import setup
from glob import glob

#def find(path):
#    return [os.path.join(i[0], f) for i in os.walk(path) for f in i[2]]

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
    url='http://www.ccplot.org/',
    license = "BSD",
    platforms='any',
    requires=['numpy', 'PyNIO', 'bottle', 'suds'],
    package_dir={'': 'src'},
    packages=[
        'ccloud',
        'ccloud.ccfetch',
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
    data_files=data_files,
)
