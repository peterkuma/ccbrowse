import os
import json


sharepath = os.path.dirname(__file__)

default_config = {
    'profile': 'profile.json',
    'server': 'gunicorn',
    'workers': 10,
    'log': None,
    'loglevel': 'info',
    'accesslog': None,
    'host': 'localhost',
    'port': 8080,
    'root': '',
    'debug': False,
    'providers': {},
    'colormaps': 'colormaps',
    'cache': {
        'driver': 'filesystem',
        'src': 'cache/{layer}/{zoom}/{x},{z};{sha1(colormap)}.{format}',
    },
    'storage': [
        {
            'requires': ['layer', 'zoom', 'x', 'z'],
            'driver': 'filesystem',
            'src': 'layers/{layer}/{zoom}/{x},{z}.png',
        },
        {
            'requires': ['layer', 'format'],
            'driver': 'filesystem',
            'src': 'layers/{layer}.{format}',
        },
    ],
}


def load_config(filename='config.json'):
    config = default_config

    try:
        with open(filename) as fp:
            config.update(json.load(fp))
    except IOError as e:
        raise e
    except ValueError as e:
        e2 = IOError()
        e2.filename = filename
        e2.strerror = e.message
        raise e2

    return config
