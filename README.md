ccloud
======

ccloud is an open-source web application for browsing data from atmospheric
profilers. It is comprised of a web application and a backend for importing
various types of product files.
<!--You can see an example at [browse.ccplot.org](http://browse.ccplot.org).-->

In the current version, it supports importing a number of datasets from the
CALIPSO satellite, but new importing classes can be added if needed.

Installation
------------

First, make sure you have the following dependencies installed:

  * [gcc](http://gcc.gnu.org/)
  * [Python 2.x](http://www.python.org)
  * [PyNIO](http://www.pyngl.ucar.edu/Nio.shtml)
  * [Bottle](http://bottlepy.org/docs/dev/)
  * [Suds](https://fedorahosted.org/suds/)
  * [bintrees](http://pypi.python.org/pypi/bintrees/)
    (`pip install bintrees`)

To install ccloud, do:

    python setup.py build
    python setup.py install

Getting started
---------------

Begin with creating a new repository:

    ccloud create ccloud
    cd ccloud

This will create a directory containing the profile specification
and directories where layers and cache will be stored.

Because ccloud does not come with any data in the distribution,
you first have to import some. [Create a new account](https://reverb.echo.nasa.gov/reverb/users/new)
on the NASA ECHO service.
Open `echo.json`, and enter login details for the account you just created:

    {
        "login": "myrusername",
        "password": "mypassword",
    }
    
In order to import data, do:

    ccloud get calipso "2008-04-30 22:00" "2008-04-30 22:30"

The command will connect the ECHO service, and order and download
product files in the specified time interval. When done,
the files will be processed into tiles and imported into the repository.

Finally, run the server with:

    ccloud server
    
Now, open [http://localhost:8080/](http://localhost:8080/) in your browser. That's it!

If you encounter any issues, [file a bug report](https://github.com/peterkuma/ccloud/issues)
or post to the [mailing list](mailto:ccplot-general@lists.sourceforge.net).

Server options
--------------

By default, the server listens on localhost:8080 for incoming HTTP connections,
but you can change that by supplying command-line arguments, e.g.:

    ccloud server 192.168.0.1 8000
    
Use the -d switch to enable debugging output:

    ccloud server -d

Importing data
--------------

The command `ccloud get` actually performs two steps: product fetching
and importing. If you already have product files available locally,
you can import them with:

    ccloud import calipso CAL_LID_L1-ValStage1-V3-01.2008-04-30T23-57-40ZN.hdf

Similarly, if you want to fetch product files without importing, do:

    cccloud fetch calipso "2008-04-30 22:00" "2008-04-30 22:30"

The product files will be saved under the `products/calipso` directory inside
the repository.

How it works
------------

ccloud consists of two parts—the backend and the web application.
The backend is responsible for importing data files into the profile as
specified by `profile.json`. Normally, data is read from HDF files,
interpolated onto a regular grid, and saved as tiles of 256x256 px. Tiles are
saved as grayscale PNG images, with every four adjacent 8-bit pixels coding one
32-bit float value, resulting in images of 1024x256 pixels.

The web application itself consists of a python bottle server and a
javascript application running in the browser.
The server is responsible for serving static files, as well as applying a given
colormap on tiles. The javascript application uses the mapping framework
[leaflet](http://leaflet.cloudmade.com/) to display the tiles. Information for popups and location
is fetched via json files. The server performs geocoding according to geojson
data obtained from [Natural Earth](http://www.naturalearthdata.com/).

Profile explained
-----------------

At the very heart of the application is the `profile.json` file. This file
specifies physical dimensions of tiles (time x height), zoom levels
and layers. Layers correspond to datasets in data product files
of atmospheric profilers, e.g. *LIDAR Total Attenuated Backscatter*.
Every layers contains information about its title, dimensionality (`xz` or `x`),
where the tiles are located, and what colormap to use to render the data.
For example:

    "calipso532":
    {
        "type": "float32",
        "dimensions": "xz",
        "units": "km<sup>-1</sup> sr<sup>-1</sup>",
        "title": "Total Att. Backscatter 532nm",
        "src": "layers/calipso532/{zoom}/{x},{z}.png",
        "availability": "layers/calipso532/availability.json",
        "attribution": "Data courtesy <a href=\"http://eosweb.larc.nasa.gov/PRODOCS/calipso/table_calipso.html\">NASA LARC Atmospheric Science Data Center</a>",
        "colormap": "colormaps/calipso-backscatter.json"
    },
