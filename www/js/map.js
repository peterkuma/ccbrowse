/*
 * map.js - The map view class.
 *
 * The Map class is responsible for displaying the map. It depends on
 * the Navigation class to provide information about the current layer
 * and position.
 */

var Map = new Class({
    Implements: EventEmitter2,

    initialize: function(el, nav, app) {
        this.el = el;
        this.container = this.el.parentNode;
        this.nav = nav;
        this.app = app;
        this.profile = app.profile;

        this.map = new L.Map(this.el, {
            crs: L.CRS.Custom(this.app.profile),
            maxZoom: this.nav.getMaxZoom(),
            center: new L.LatLng(25000, this.nav.getCurrent() - this.profile.origin[0], true), //new L.LatLng(25000, 45000*1633922 - 3120*1000, true),
            zoom: 2,
            worldCopyJump: false,
            fadeAnimation: true,
            doubleClickZoom: false,
            keyboardPanOffset: 150
        });

        this.map.attributionControl.setPrefix('');

        //this.measureControl = new L.Control.Measure(this.measure.bind(this));
        //this.measureControl.addTo(this.map);

        this.map.on('dblclick', this.onDbClick.bind(this));
        this.map.on('moveend', this.onMove.bind(this));

        this.layerGroup = new L.LayerGroup();
        this.layerGroup.addTo(this.map);

        this.keyboard = new Keyboard({
            defaultEventType: 'keydown',
            events: {
                'pagedown': function() {
                    this.map.panBy(new L.Point(this.el.getSize().x, 0));
                }.bind(this),
                'pageup': function() {
                    this.map.panBy(new L.Point(-this.el.getSize().x, 0));
                }.bind(this)
            }
        });
        this.keyboard.activate();

        this.yaxis = new YAxis($$('#yaxis-container .yaxis')[0], [
            this.getYRange()[0]/1000,
            this.getYRange()[1]/1000
        ]);

        this.map.on('move', function() {
            this.yaxis.setDomain([
                this.getYRange()[0]/1000,
                this.getYRange()[1]/1000
            ]);
        }.bind(this));

        /*
        this.locationLayer = new LocationLayer({
            tileSize: 256,
            continuousWorld: true,
            scheme: 'tms',
        });
        this.locationLayer.addTo(this.map);
        */

        this.nav.on('change', this.move.bind(this));
        this.nav.on('layerchange', this.updateLayer.bind(this));
    },

    /*
    measure: function() {
        this.app.showNote('Measure by drawing a box on the map');

        var box = null;
        var p1 = null;

        this.el.setStyle('cursor', 'crosshair');
        this.map.on('click', function(evt) {
            if (box) {
                // Finished.
                this.el.setStyle('cursor', 'auto');
            }
            p1 = evt.latlng;
            var b2 = new L.LatLng(evt.latlng.lat + 20, evt.latlng.lng + 20);

            box = new L.Rectangle(new L.LatLngBounds(p1, b2), {
                fill: true,
                fillColor: 'black'
            });
            //box.setStyle('background', 'black');
            box.addTo(this.map);
        }.bind(this));

        this.map.on('mousemove', function(evt) {
            if (!box) return;
            console.log(box);
            box.setBounds(new L.LatLngBounds(p1, evt.latlng));
        }.bind(this));

        this.map.on('mouseup', function(evt) {
            if (box) {
                this.el.setStyle('cursor', 'auto');
            }
        }.bind(this));
    },
    */

    getYRange: function() {
        return [
            this.map.getBounds().getSouthWest().lat,
            this.map.getBounds().getNorthWest().lat
        ];
    },

    getXRange: function() {
        return [
            this.map.getBounds().getSouthWest().lng,
            this.map.getBounds().getSouthEast().lng
        ];
    },

    update: function() {
        var start = (new Date(this.profile.origin[0])).increment('ms', this.getXRange()[0]);
        var end = (new Date(this.profile.origin[0])).increment('ms', this.getXRange()[1]);
        if (!this.nav.isAvailable(start, end)) {
            this.app.showError('No data available here', true);
        } else {
            this.app.clearError();
        }
    },

    updateLayer: function() {
        var layer = this.nav.getLayer();
        //if (layer == this.currentLayer) return;
        //this.currentLayer = layer;

        if (layer.colormap.missing)
            this.container.setStyle('background', layer.colormap.missing);

        var url = layer.src;
        url = url.replace('\{z\}', '\{y\}');
        url = url.replace('{zoom}', '{z}');

        this.tileLayer = new L.TileLayer(url, {
            maxZoom: this.nav.getMaxZoom(),
            tileSize: 256,
            continuousWorld: true,
            tms: true,
            attribution: layer.attribution
        });

        this.layerGroup.addLayer(this.tileLayer);

        // Remove other layers after a delay of 4s.
        window.setTimeout(function() {
            this.layerGroup.eachLayer(function(layer) {
                if (layer == this.tileLayer) return;
                this.layerGroup.removeLayer(layer);
            }.bind(this));
        }.bind(this), 4000);
    },

    move: function() {
        if (this.hold) return;
        var t = (this.nav.getCurrent() - this.profile.origin[0]);
        var latlng = this.map.getCenter();
        latlng.lng = t;

        this.disableOnMove = true;
        this.map.panTo(latlng);

        var tmp = function() {
            this.map.off('moveend', tmp);
            this.disableOnMove = false;
        }.bind(this);
        this.map.on('moveend', tmp);

        this.update();
    },

    onMove: function(evt) {
        if (this.disableOnMove) return;
        var latlng = this.map.getCenter();

        var t = latlng.lng;
        var h = latlng.lat;

        var date = new Date(this.profile.origin[0]);
        date.increment('ms', t);
        date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
        //this.hold = true;
        this.nav.setCurrent(date);
        //this.hold = false;

        this.update();
    },

    onDbClick: function(evt) {
        var value = null;
        var latitude = null;
        var longitude = null;

        var fn = function() {
            if (value == null || latitude == null || longitude == null) return;
            console.log(value, latitude, longitude);

            var url = this.profile.layers.geography.src+'?q='+latitude+','+longitude;
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if(xhr.readyState != 4) return;
                if (xhr.status != 200) {
                    console.log(url+' '+xhr.status+' '+xhr.statusText);
                    this.emit('error', {
                        message: 'No information available for this point'
                    });
                    return;
                }
                try { json = JSON.parse(xhr.responseText); }
                catch(e) { json = {}; }
                var name = json.name ? json.name : '';
                this.popup({
                    'value': value,
                    'latitude': latitude,
                    'longitude': longitude,
                    'color': color(value, this.nav.getLayer().colormap),
                    'latlng': evt.latlng,
                    'country': name
                });
            }.bind(this);
            xhr.open('GET', url);
            xhr.send();
        }.bind(this);

        var q = new Query();
        q.onLoad = function(response) { value = parseFloat(response); fn(); }.bind(this);
        q.perform(this.profile, this.nav.getLayer(), this.map.getZoom(), evt.latlng.lng, evt.latlng.lat);

        q = new Query();
        q.onLoad = function(response) { latitude = parseFloat(response); fn(); }.bind(this);
        q.perform(this.profile, this.profile.layers.latitude, this.map.getZoom(), evt.latlng.lng);

        q = new Query();
        q.onLoad = function(response) { longitude = parseFloat(response); fn(); }.bind(this);
        q.perform(this.profile, this.profile.layers.longitude, this.map.getZoom(), evt.latlng.lng);
    },

    popup: function(desc) {
        var content = $('popup-content-template').clone();
        var valueText = isNaN(desc.value) ? 'Missing data' : scientific(desc.value)+' '+this.nav.getLayer().units;

        var lat = format_latitude(desc.latitude, 2);
        var lon = format_longitude(desc.longitude, 2);

        content.querySelector('.value').set('html', valueText);
        content.querySelector('.color-box').setStyle('background-color', desc.color);
        content.querySelector('.latitude').set('html', lat);
        content.querySelector('.longitude').set('html', lon);
        content.querySelector('.height').set('html', scientific(desc.latlng.lat/1000, 3)+' km');
        content.querySelector('.time').set('html', time(desc.latlng.lng, this.profile));
        content.querySelector('.country').set('text', desc.country);
        content.querySelector('.latlon-link').href = 'http://maps.google.com/maps?z=5&t=p&q='+lat+', '+lon;

        var popup = new L.Popup();
        popup.setLatLng(desc.latlng);
        popup.setContent(content);
        this.map.openPopup(popup);
    }
});
