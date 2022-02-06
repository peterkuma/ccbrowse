ccbrowse
======

![](screenshot.png)

ccbrowse is an open-source web application for browsing data from atmospheric
profilers. It is comprised of a web application and a backend for importing
various types of product files.

In the current version, it supports importing two datasets from the
CALIPSO satellite, but new importing classes can be added as needed.

<!--
You can see an example ccbrowse application running at
[browse.ccplot.org](http://browse.ccplot.org).
-->

Installation
------------

ccbrowse can be installed on Linux (other operating systems are currently not
supported). On Ubuntu or Debian, install system dependencies with:

```sh
apt-get install libhdf4-0 libhdf4-dev libhdfeos0 libhdfeos-dev sqlite3 \
python3 python3-dev cython3
```

Set up a Python virtual environment and Install Python dependencies with:

```sh
python3 -m venv env
. env/bin/activate
pip3 install -r requirements.txt
```

To install ccbrowse, run:

```sh
pip3 install .
```

The full list of Python dependencies is:

  * [libhdf4](http://www.hdfgroup.org/release4/obtain.html)
  * [HDF-EOS2 library](http://www.hdfeos.org/software/library.php#HDF-EOS2)
  * [SQLite](http://www.sqlite.org/)
  * [Python](http://www.python.org) >= 3.0 (incl. dev files)
  * [Cython](http://www.cython.org/)
  * [pytz](http://pytz.sourceforge.net/)
  * [python-dateutil](http://labix.org/python-dateutil)
  * [PIL](http://www.pythonware.com/products/pil/)
  * [numpy](http://numpy.scipy.org/)
  * [scipy](http://www.scipy.org/)
  * [Suds](https://fedorahosted.org/suds/)
  * [Shapely](http://pypi.python.org/pypi/Shapely/)
  * [Bottle](http://bottlepy.org/docs/dev/)
  * [bintrees](http://pypi.python.org/pypi/bintrees/)

Getting started
---------------

Begin with creating a new repository:

    ccbrowse create ccbrowse
    cd ccbrowse

This will create a directory containing the profile specification
and directories where layers and cache will be stored.

Because ccbrowse does not come with any data in the distribution,
you first have to import some. [Create a new account](https://reverb.echo.nasa.gov/reverb/users/new)
on the NASA ECHO service.
Open `config.json`, and enter login details for the account you just created
under `echo` in `providers`:

    "providers": {
        "echo": {
            "login": "myrusername",
            "password": "mypassword",
        }
    },

In order to import data, run:

    ccbrowse get calipso "2012-01-01 12:00" "2012-01-01 12:30"

The command will connect the ECHO service, and download
product files in the specified time interval. When done,
the files will be processed into tiles and imported into the repository.

Finally, run the server with:

    ccbrowse server

Now, open [http://localhost:8080/](http://localhost:8080/) in your browser. That's it!

If you encounter any issues, [file a bug report](https://github.com/peterkuma/ccbrowse/issues)
or post to the [mailing list](mailto:ccplot-general@lists.sourceforge.net).

Server options
--------------

By default, the server listens on localhost:8080 for incoming HTTP connections,
but you can change that by supplying an address and port as an argument, e.g.:

    ccbrowse server 192.168.0.1:8000

To enable debugging mode, use the -d switch:

    ccbrowse server -d

This will cause the server to respond with detailed messages should an
error occur.

Importing data
--------------

The command `ccbrowse get` actually performs two steps: product fetching
and importing. If you already have product files available locally,
you can import them with:

    ccbrowse import calipso CAL_LID_L1-ValStage1-V3-01.2008-04-30T23-57-40ZN.hdf

Similarly, if you want to fetch product files without importing, run:

    cccbrowse fetch calipso "2012-01-01 12:00" "2012-01-01 12:30"

The product files will be saved under the `products/calipso` directory inside
the repository.

You can choose to import only a certain layer or zoom level with `-l` and `-z`.

    ccbrowse import -l calipso532 -z 2 calipso CAL_LID_L1-ValStage1-V3-01.2008-04-30T23-57-40ZN.hdf

would generate tiles for the layer calipso532 and zoom level 2.

Deployment
----------

The standard server supplied with ccbrowse is only suitable for small-scale
deployment, as it is single-threaded. For production use, it is recommended
to use one of the more robust WSGI servers, such as
[gunicorn](http://gunicorn.org/). For that purpose, the repository
contains a `wsgi.py` module, containing a WSGI application `app`.
You can instruct gunicorn to run 4 application workers with:

    gunicorn -w 4 wsgi:app

Some operating systems such as Debian support placing the gunicorn configuration
in `/etc/gunicorn.d/`, so that it runs automatically on system startup.
Create a file `/etc/gunicorn.d/ccbrowse`:

    CONFIG = {
        'working_dir': '/path/to/ccbrowse/',
        'python': '/usr/bin/python3',
        'args': (
            '--log-level=DEBUG',
            '--bind=localhost:8080',
            '--user=username',
            '--group=username',
            '--workers=4',
            '--timeout=60',
            'wsgi:app',
        ),
    }

replacing path to the ccbrowse repository and username. In order to
make ccbrowse available on a public domain, you can deploy an HTTP server such as
[nginx](http://nginx.org/), and use this example virtual server configuration:

    server {
            listen 80;
            listen [::]:80 default ipv6only=on;
            server_name your.domain;
            access_log  /var/log/nginx/ccbrowse.access.log;

            location / {
                    proxy_pass http://localhost:8080;
                    proxy_set_header Host $host;
                    proxy_set_header X-Real-IP $remote_addr;
                    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            }
    }

replacing `your.domain` with the desired domain name.

Repository
----------

The ccbrowse repository is a directory that holds imported tiles, cache
and downloaded product files. Additionally, it contains information
necessary for performing operations on the repository,
such as the configuration file and profile specification. Here is a
list of files in a typical ccbrowse repository:

    cache               tile cache
    colormaps           custom colormaps
    layers              layer data
    products            raw product files
    config.json         repository configuration file
    profile.json        profile specification
    wsgi.py             WSGI module
    README              README file

When you fetch a product, it is downloaded into `products`, split
and interpolated into tiles of 256x256px and saved in `layers`. When tiles
are requested from the server, a chosen colormap is applied on them,
and the resulting images are saved in `cache`.

How tiles and images are stored is configurable. By default, tiles
are stored in a number of SQLite databases, sharded (split) by the x-coordinate,
in order to avoid overly large database files and large number of files
in file system directories. Images are stored in SQLite databases
sharded by hashing, and automatically resharded to maintain
database files of a suitable size. This should allow the repository
to grow to terabytes of data and millions of tiles, as is necessitated by the
vast amount of satellite recordings available.

Other options of storage include filesystem storage, when each tile
is stored as a standalone file. This is suitable for testing purposes,
but does not scale to more that several product files with typical file systems.


Configuration
-------------

The repository configuration is defined in `config.json`, e.g.:

    "host": "localhost",
    "port": 8080,
    "debug": false,
    "providers": {
        "echo": {
            "login": "",
            "password": ""
        }
    },
    "profile": "profile.json",
    "colormaps": "colormaps",
    "cache": {
        "driver": "htree",
        [...]
    }
    "storage": [
        {
            "requires": ["layer", "zoom", "x", "z"],
            "driver": "sqlite",
            [...]
        },
        [...]
    ]

The configuration options are:

    host                    hostname to listen on (default: localhost)
    port                    port to listen on (default: 8080)
    debug                   enable server debugging (default: false)
    providers               specification of services for fetching products
        echo                the NASA ECHO service
            login           ECHO login name
            password        ECHO password
    profile                 path to profile.json (default: profile.json)
    colormaps               directory containing colormap files (default: colormaps)
    cache                   server cache (permanent) storage configuration
        driver              storage driver name
        [option]...         storage configuration options
    storage                 list of tile storage definitions
        [storage]           storage configuration
            requires        list of required parameters
            driver          storage driver name
            [option]...     storage configuration options
        [storage]...

The storage configuration options are documented in a later section.

Profile specification
---------------------

The profile specification defines what zoom levels and layers are available
and how to access them. This information is needed by the importers, so that
they know how to cut products into tiles, and by the web application,
so that it knows how to present layers.

A sample `profile.json`:

    {
        "name": "A-Train",
        "origin": ["2006-01-01 00:00:00", 0],
        "prefix": "",
        "zoom":
        {
            "0":
            {
                "width": 131072,
                "height": 65536
            },
            [...]
        },
        "layers": {
            "calipso532":
            {
                "format": "png",
                "type": "float32",
                "dimensions": "xz",
                "units": "km<sup>-1</sup> sr<sup>-1</sup>",
                "title": "Total Att. Backscatter 532nm",
                "src": "layers/calipso532/{zoom}/{x},{z}.png",
                "availability": "layers/calipso532/availability.json",
                "attribution": "Data courtesy <a href=\"http://eosweb.larc.nasa.gov/PRODOCS/calipso/table_calipso.html\">NASA LARC Atmospheric Science Data Center</a>",
                "colormap": "colormaps/calipso-backscatter.json"
            },
            [...]
            "geography":
            {
                "format": "json",
                "type": "geojson",
                "title": "Geography",
                "src": "layers/geography.json"
            },
            [...]
        }
    }

We can see a number of things in this profile specification:

  * It defines a profile called `A-Train`.
  * The x-axis begins at midnight 1st Jan 2006, and the z-axis begins at
    an altitude of 0m.
  * The lowest zoom level (`0`) has tiles of 131072s in width and 65536m in
    height (remember that tiles always have a fixed size of 256x256px,
    so this determines the zoom factor and aspect ratio).
  * There is a two-dimensional (`xz`) layer called `calipso532`.
    Its full name is "Total Att. Backscatter 532nm" and has units of km-1 sr-1.
    Data in this layer is rendered with the `colormaps/calipso-backscatter.json`
    colormap.
  * There is a layer called `geography`, which does not have any dimensions
    (it is a single GeoJSON file). This is because it holds information
    about countires and marine areas, which is common for all x-z tiles.

The structure of the profile specification is as follows:

    name                    name of the profile
    origin                  the physical coordinates of the origin of the system
                            as time in format "year-month-day hour:minute:second"
                            and altitude in meters
    prefix                  URL prefix (when hosting on http://your.domain/prefix/)
    zoom                    list of zoom levels
        0                   zoom level 0
            width           tile width in seconds
            height          tile height in meters
        1                   zoom level 1
        [...]
    layers                  list of layers
        [layer name]        short name of the layer (without white space)
            format          tile format (png or json)
            type            tile data type (float32 or geojson)
            dimensions      layer dimensions
                            "xz" for two-dimensional layers
                            "x" for one-dimensional layers
                            "" for zero-dimensional layers (e.g. geography)
            units           physical units of data
            title           layer title
            src             source URL
            availability    layer availability
            attribution     data attribution text displayed on the map
            colormap        colormap for rendering images
        [...]

As a user, you might wish to modify zoom level and origin, whereas
you should not modify layers unless you developed you own import class,
or you are not interested in importing certain layers
(in which case you can remove them).

When modifying the profile specification, the tiles you have already imported
remain unchanged. E.g., if you modify zoom levels, the x-z coordinates
would reference the wrong tiles. To avoid the situation, you should either
modify the profile specification *before* you import any products,
or modify the tiles in storage accordingly (which may be difficult).

You can safely change `name`, `prefix`, layer `title`, `units`, and
`colormap`.

If you were to add a new layer to the profile specification,
it would not become supported by ccbrowse without additional effort.
The web application would display its name in the selection of layers,
but could not retrieve any data. For that, you have write an import
class or extend an existing one, which reads the relevant data from product
files and returns an array of data interpolated on a regular grid of 256x256
elements for each tile. You can find instructions on how to do that in
`src/ccbrowse/ccimport/product.py`, and use the existing import classes
in the same directory as an example.

Storage
-------

Internally, ccbrowse handles tiles as objects, where object
is a simple list of parameters (key-value pairs), e.g.

    {
        "layer": "calipso532",
        "zoom": 2,
        "x": 7120,
        "z": 0,
        "raw_data": [...],
        "format": "png",
        [...]
    }

The parameters include layer, zoom level, coordinates and data, in addition
to all parameters defined in the profile specification under the particular
layer.

Storing and retrieval of objects is done by storage drivers. Which storage
driver to use and its configuration is defined in the configuration file
`config.json`. You can modify the configuration in order to store tiles
in a location other that the default, or use a custom sharding.

The concept of objects is modeled after documents in document databases
such as CouchDB.

There are several storage drivers available.

### Filesystem storage

This is the simplest type of storage, when objects are stored in standalone
files.

Example:

    {
        "driver": "filesystem",
        "src": "layers/{layer}/{zoom}/{x},{z}.png"
    }

Configuration options:

    driver          "filesystem"
    src             filesystem path relative to the repository directory

### SQLite storage

Objects are stored as rows in a SQLite database table.

Example:

    {
        "driver": "sqlite",
        "src": "layers/{layer}/{zoom}/{x-x%100000}.tiles",
        "select": "SELECT raw_data, modified from tiles WHERE x={x} AND z={z}",
        "insert": "INSERT INTO tiles (x, z, raw_data, modified) VALUES ({x}, {z}, {raw_data}, strftime('%s'))",
        "init": [
            "CREATE TABLE tiles (x INT, z INT, raw_data BLOB, modified INT)",
            "CREATE INDEX tiles_x_idx ON tiles (x)"
        ]
    }

Configuration options:

    driver          "sqlite"
    src             filesystem path of the database file
    select          SQL query to retrieve object by its coordinates
    insert          SQL query to insert object
    init            list of SQL queries for initialization of an empty database

### HTree storage

Objects are stored in a number of SQLite databases (chunks) according to their
hash. Hash of an object is computed by applying SHA1 function on a key,
where key is a string based on object parameters. The number of database
files grows automatically in order to maintain a given maximum chunk size.

Example:

    {
        "driver": "htree",
        "chunk": "128MB",
        "src": "cache/chunks/{'%02d'%bits}:{hash}.tiles",
        "index": "cache/index.sqlite",
        "lock": "cache/.lock",
        "key": "{layer}/{zoom}/{x},{z};{sha1(colormap)}",
        "hashlen": 5,
        "select": "SELECT raw_data, modified from tiles WHERE layer={layer} AND zoom={zoom} AND x={x} AND z={z} AND colormap={sha1(colormap)}",
        "insert": "INSERT INTO tiles (_id, _hash, layer, zoom, x, z, colormap, modified, raw_data) VALUES ({_id}, {_hash}, {layer}, {zoom}, {x}, {z}, {sha1(colormap)}, strftime('%s'), {raw_data})",
        "init": [
            "CREATE TABLE tiles (_id INT, _hash TEXT, layer TEXT, zoom INT, x INT, z INT, colormap TEXT, modified INT, raw_data BLOB)",
            "CREATE INDEX tiles_id_idx ON tiles (_id)",
            "CREATE INDEX tiles_idx ON tiles (layer, zoom, x, z)"
        ]
    }

Configuration options:

    driver          "htree"
    chunk           maximum chunk size, after which it is split into two
    src             filesystem path to chunk
    index           database holding index of chunks
    lock            lock file
    key             object key
    hashlen         length of sha1 hash of key (more digits are discarded)
    select          SQL query to retrieve object from a chunk
    insert          SQL query to insert object into a chunk
    init            a list of SQL queries to initialize a new chunk

Following the example, when the storage is first created,
all objects are being stored in single
database file:

    00:00000.tiles

where "00" before colon is the number of significant bits, and "00000"
is the hash. The number of significant bits is 0,
as all objects are stored in the same chunk.

When the database grows over 128MB, the database is split into two chunks:

    01:00000.tiles
    01:80000.tiles

The first is filled with objects whose first bit of hash is 0 (hash < 80000),
and the second with those whose first bit of hash is 1 (hash >= 80000).

When the second chunk grows 128MB, it is split into two other chunks:

    01:00000.tiles
    02:80000.tiles
    02:c0000.tiles

Now, first two bits of the hash are significant. For example, an object
with hash `720ec` would go to the first database, `9e4b1` to the second
and `ee387` to the third. The number of chunks can increase in this fashion
until the last significant bit of the hash is reached.

The table in chunk is allowed to have an arbitrary name (here "tiles"), but two columns
are required by the HTree storage: `_id` and `_hash`, having the value
of the supplied `_id` and `_hash` parameters (respectively).

Internals
---------

ccbrowse consists of two parts—a backend and a web application.
The backend is responsible for importing product files and serving
tiles. The interface between the backend and the web application is
defined by `profile.json`.

When importing product files, data is interpolated onto a regular grid
and saved as tiles of 256x256px. Tiles are
saved as grayscale PNG images, with every four adjacent 8-bit pixels coding one
32-bit float value, resulting in images of 1024x256 pixels.

The web application consists of a python bottle server and a
javascript application running in the browser.
The javascript application uses the mapping framework
[Leaflet](http://leaflet.cloudmade.com/) for displaying tiles.
Information for popups and location is fetched via JSON.

The server is responsible for serving static files, tiles,
as well as applying a given colormap.
It also performs geocoding
with the shapely library
according to data from [Natural Earth](http://www.naturalearthdata.com/).
