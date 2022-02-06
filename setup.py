#!/usr/bin/python3

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
        #self.run_command('build_js')
        self.run_command('build_scss')


class build_js(Command):
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        try:
            with open(os.devnull, 'w') as fp:
                proc = subprocess.Popen(['browserify', '-v'], stdout=fp, stderr=fp)
                proc.communicate()
        except OSError:
            print('warning: browserify not available, will not rebuild javascript', file=sys.stderr)
            return
        cmd = [
            'browserify',
            '-o', 'www/js/bundle.js',
            '-t', '[',
                'babelify',
                '--optional', 'runtime',
                '--optional', 'es7.asyncFunctions',
            ']',
            'node_modules/whatwg-fetch',
        ] + glob('www/js/*.js')
        print(' '.join(cmd))
        try:
            ret = call(cmd)
            if ret != 0:
                sys.exit(1)
        except OSError as e:
            print(e.strerror, file=sys.stderr)
            sys.exit(1)


class build_scss(Command):
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        try:
            with open(os.devnull, 'w') as fp:
                proc = subprocess.Popen(['sass', '-v'], stdout=fp, stderr=fp)
                proc.communicate()
        except OSError:
            print('warning: sass not available, will not rebuild stylesheets', file=sys.stderr)
            return
        cmd = ['sass', '--update', 'ccbrowse.scss', 'ccbrowse.css']
        print(' '.join(cmd))
        try:
            ret = call(cmd, cwd='www/css')
            if ret != 0:
                sys.exit(1)
        except OSError as e:
            print(e.strerror, file=sys.stderr)
            sys.exit(1)


setup(
    name='ccbrowse',
    version='0.1',
    author='Peter Kuma',
    author_email='peterkuma@waveland.org',
    url='https://github.com/peterkuma/ccbrowse',
    license = "MIT",
    platforms='any',
    classifiers = [
        "Programming Language :: Python",
        "Programming Language :: Python :: 3 :: Only",
        "Programming Language :: Python :: 3",
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
        'ccbrowse.storage',
    ],
    scripts=[
        'src/bin/ccfetch',
        'src/bin/ccimport',
        'src/bin/ccinfo',
        'src/bin/ccbrowse',
        'src/bin/ccserver',
        'src/bin/cchtree-clean',
        'src/bin/ccload',
    ],
    cmdclass = {
        'build': build,
        'build_ext': build_ext,
        'build_scss': build_scss,
        'build_js': build_js,
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
