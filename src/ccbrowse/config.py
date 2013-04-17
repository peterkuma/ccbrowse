import os

sharepath = os.path.join(os.path.dirname(__file__), '../../../../share/ccbrowse/')

default_config = {
    'profile': 'profile.json',
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
