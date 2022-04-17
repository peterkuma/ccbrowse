#!/usr/bin/python3

import os
import sys
from glob import glob
from setuptools import setup, Extension, Command
from setuptools.command.build_py import build_py

import subprocess
from subprocess import call


class build(build_py):
    def run(self):
        self.run_command('build_scss')
        build_py.run(self)


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
        cmd = ['sass', '--update', 'ccbrowse.scss:ccbrowse.css']
        print(' '.join(cmd))
        try:
            ret = call(cmd, cwd='ccbrowse/www/css')
            if ret != 0:
                sys.exit(1)
        except OSError as e:
            print(e.strerror, file=sys.stderr)
            sys.exit(1)


setup(
    name='ccbrowse',
    version='0.2.0',
    description='Web application for browsing data from active Earth observation satellites',
    author='Peter Kuma',
    author_email='peter@peterkuma.net',
    url='https://github.com/peterkuma/ccbrowse',
    license = "MIT",
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
    python_requires='>=3.0.0',
    setup_requires=[
        'cython',
    ],
    install_requires=[
        'pytz>=2021.3',
        'python-dateutil>=2.8.2',
        'pillow>=9.0.1',
        'numpy>=1.16.2',
        'scipy>=1.1.0',
        'shapely>=1.5.13',
        'bottle>=0.12.19',
        'bintrees>=2.2.0',
        'jinja2>=3.0.3',
        'boto>=2.49.0',
        'gunicorn>=20.1.0',
        'netCDF4>=1.5.5',
    ],
    packages=[
        'ccbrowse',
        'ccbrowse.fetch',
        'ccbrowse.ccimport',
        'ccbrowse.storage',
    ],
    scripts=[
        'bin/ccfetch',
        'bin/ccimport',
        'bin/ccinfo',
        'bin/ccbrowse',
        'bin/ccserver',
        'bin/cchtree-clean',
        'bin/ccload',
    ],
    include_package_data=True,
    zip_safe=False,
    cmdclass = {
        'build_py': build,
        'build_scss': build_scss,
    },
    ext_modules=[
        Extension('ccbrowse.algorithms',
            ['ccbrowse/algorithms.pyx'],
            extra_compile_args=['-march=native'],
        ),
        Extension('ccbrowse.hdf',
            ['ccbrowse/hdf.pyx'],
            libraries=['mfhdf', 'df', 'jpeg', 'z'],
            extra_compile_args=[
                '-I/usr/include/hdf',
                '-I/usr/include/x86_64-linux-gnu/hdf',
                '-march=native'
            ],
        ),
        Extension('ccbrowse.hdfeos',
            ['ccbrowse/hdfeos.pyx'],
            libraries=['hdfeos', 'mfhdf', 'df', 'jpeg', 'z'],
            extra_compile_args=[
                '-I/usr/include/hdf',
                '-I/usr/include/x86_64-linux-gnu/hdf',
                '-march=native'
            ],
        ),
    ],
)
