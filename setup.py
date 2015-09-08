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
    ('share/doc/ccbrowse/', ['README.md']),
]

data_files += find('share/ccbrowse/template/', 'template')
data_files += find('share/ccbrowse/www/', 'www')
data_files += find('share/ccbrowse/colormaps/', 'colormaps')


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
        cmd = ['scss', '--compass', '--update', 'ccbrowse.scss']
        print ' '.join(cmd)
        try:
            call(cmd, cwd='www/css')
        except OSError as e:
            print >>sys.stderr, e.strerror


setup(
    name='ccbrowse',
    version='0.1',
    author='Peter Kuma',
    author_email='peterkuma@waveland.org',
    url='https://github.com/peterkuma/ccbrowse',
    license = "MIT",
    platforms='any',
    requires=['numpy', 'bottle', 'suds'],
    classifiers = [
        "Programming Language :: Python",
        "Programming Language :: Cython",
        "License :: OSI Approved :: MIT License",
        "Operating System :: POSIX",
        "Development Status :: 4 - Beta",
        "Environment :: Console",
        "Environment :: Web Environment",
        "Intended Audience :: Science/Research",
        "Topic :: Scientific/Engineering :: Atmospheric Science",
    ],
    package_dir={'': 'src'},
    packages=[
        'ccbrowse',
        'ccbrowse.fetch',
        'ccbrowse.ccimport',
        'ccbrowse.storage'
    ],
    scripts=[
        'src/bin/ccfetch',
        'src/bin/ccimport',
        'src/bin/ccinfo',
        'src/bin/ccbrowse',
        'src/bin/ccserver',
        'src/bin/cchtree-clean',
    ],
    cmdclass = {
        'build': build,
        'build_ext': build_ext,
        'build_scss': build_scss,
    },
    ext_modules=[
        Extension('ccbrowse.algorithms',
            ['src/ccbrowse/algorithms.pyx'],
            extra_compile_args=['-march=native'],
        ),
        Extension('ccbrowse.hdf',
            ['src/ccbrowse/hdf.pyx'],
            libraries=['mfhdf', 'df', 'jpeg', 'z'],
            extra_compile_args=[
                '-I/usr/include/hdf',
                '-I/usr/include/x86_64-linux-gnu/hdf',
                '-march=native'
            ],
        ),
        Extension('ccbrowse.hdfeos',
            ['src/ccbrowse/hdfeos.pyx'],
            libraries=['hdfeos', 'mfhdf', 'df', 'jpeg', 'z'],
            extra_compile_args=[
                '-I/usr/include/hdf',
                '-I/usr/include/x86_64-linux-gnu/hdf',
                '-march=native'
            ],
        ),
    ],
    data_files=data_files,
)
