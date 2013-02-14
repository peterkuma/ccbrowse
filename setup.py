import os
import sys
from glob import glob
from distutils.core import setup, Extension, Command
import distutils.command.build
from Cython.Distutils import build_ext
import subprocess
from subprocess import call


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


class build(distutils.command.build.build):
    def run(self):
        distutils.command.build.build.run(self)
        self.run_command('build_scss')

class build_scss(Command):
    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        try:
            with open(os.devnull, 'w') as fp:
                proc = subprocess.Popen(['scss', '-v'], stdout=fp, stderr=fp)
                proc.communicate()
        except OSError:
            print >>sys.stderr, 'warning: scss not available, will not rebuild stylesheets'
            return
        cmd = ['scss', '--compass', '--update', 'ccloud.scss']
        print ' '.join(cmd)
        try:
            call(cmd, cwd='www/css')
        except OSError as e:
            print >>sys.stderr, e.strerror


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
    cmdclass = {
        'build': build,
        'build_ext': build_ext,
        'build_scss': build_scss,
    },
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
