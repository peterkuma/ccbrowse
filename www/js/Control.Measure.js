L.Control.Measure = L.Control.extend({
    options: {
        position: 'topleft'
    },
    
    initialize: function(fn) {
        this.fn = fn;
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-control-measure');
        var link = L.DomUtil.create('a', '', container);
        link.href = '#';
        link.title = 'Measure';

        L.DomEvent
            .on(link, 'click', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', this.fn)
            .on(link, 'dblclick', L.DomEvent.stopPropagation);        
        
        return container;
    },
});

L.control.measure = function (options) {
    return new L.Control.Measure(options);
};
