var LocationBar = new Class({
    initialize: function(bar, map, profile) {
        this.map = map;
        this.profile = profile;
        this.bar = bar;
        this.left = this.bar.querySelector('.left');
        this.center = this.bar.querySelector('.center');
        this.right = this.bar.querySelector('.right');

        this.requests = [];

        this.map.on('moveend', this.update.bind(this));
        this.update();
    },

    update: function() {
        if (this.xhr) return;

        var bounds = this.map.getBounds();
        var zoom = this.map.getZoom();

        var t1 = bounds.getSouthWest().lon;
        var t3 = bounds.getSouthEast().lon;
        var t2 = (t3-t2)/2;

        var bounds = this.map.getPixelBounds();
        var x1 = Math.ceil(bounds.min.x/256);
        var x2 = Math.floor(bounds.max.x/256);
        var x = Math.round((x1+x2)/2);

        var url = this.profile.prefix + this.profile.layers.geocoding.src;
        url = L.Util.template(url, {
                'zoom': zoom,
                'x': x
        });
        url += '?reduce=128';

        this.xhr = new XMLHttpRequest();
        this.xhr.open('GET', url);
        this.xhr.onreadystatechange = function() {
            if (this.xhr.readyState != 4) return;
            this.center.set('text', '…');
            this.center.title = 'No information about place available';
            if (this.xhr.status == 200) {
                let json = JSON.decode(this.xhr.responseText);
                if (json && json.features.length) {
                    this.center.set('text', json.features[0].properties.name);
                    this.center.title = '';
                }
            } else {
                console.log(url+' '+this.xhr.status+' '+this.xhr.statusText);
                console.log('No location information available');
            }
            if (this.center.tooltip) this.center.tooltip.update();
            this.xhr = null;
        }.bind(this);
        this.xhr.send();
    }
});

export default LocationBar;
