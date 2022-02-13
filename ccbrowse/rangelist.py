"""
>>> # Inserting.
>>> r = RangeList()
>>> r.append(1, 3); list(r)
[(1, 3)]
>>> r.append(4, 5); list(r)
[(1, 3), (4, 5)]
>>> r.append(1, 2); list(r)
[(1, 3), (4, 5)]
>>> r.append(2, 6); list(r)
[(1, 6)]
>>> r.append(2, 4); list(r)
[(1, 6)]

>>> # Removing.
>>> r = RangeList()
>>> r.append(0, 6)
>>> r.remove(2, 4); list(r)
[(0, 2), (4, 6)]
>>> r.remove(3, 7); list(r)
[(0, 2)]
"""

import json
from bintrees import RBTree

class RangeListEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, RangeList):
            return list(obj.tree.items())
        return json.JSONEncoder.default(self, obj)

class RangeList(object):
    """List of ranges.
    
    Ranges are automatically merged and split when a new range is appended
    or removed.
    """
    
    def __init__(self, sequence=None):
        self.tree = RBTree(sequence)
        
    def __iter__(self):
        return iter(list(self.tree.items()))
    
    def __repr__(self):
        return repr(list(self.tree.items()))
    
    def append(self, start, stop):
        """Append range (start, stop) to the list."""
        
        if start >= stop:
            raise ValueError('stop has to be greater than start')
        
        delete = []
        for nextstart, nextstop in list(self.tree[start:].items()):
            if nextstart <= stop:
                stop = max(nextstop, stop)
                delete.append(nextstart)
            else: break
        for key in delete: del self.tree[key]
        
        left = self.tree[:start]
        try:
            prevstart = max(left)
            prevstop = self.tree[prevstart]
            if prevstop >= start:
                start = prevstart
                stop = max(prevstop, stop)
                del self.tree[prevstart]
        except ValueError: pass
        
        self.tree[start] = stop
        
    def remove(self, start, stop):
        """Remove range (start, stop) from the list."""
        
        delete = []
        for nextstart, nextstop in list(self.tree[start:].items()):
            if nextstart < stop:
                if nextstop > stop: self.tree[stop] = nextstop
                delete.append(nextstart)
            else: break
        for key in delete: del self.tree[key]
        
        left = self.tree[:start]
        try:
            prevstart = max(left)
            prevstop = self.tree[prevstart]
            if prevstop > stop: self.tree[stop] = prevstop
            if prevstop >= start: self.tree[prevstart] = start
        except ValueError: pass
        
if __name__ == "__main__":
    import doctest
    doctest.testmod()
