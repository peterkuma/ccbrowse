from .calipso import *
from .cloudsat import *
from .naturalearth import *

PRODUCTS = {
    'calipso': Calipso,
    'cloudsat': CloudSat,
    'naturalearth': NaturalEarth,
}
