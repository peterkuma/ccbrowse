/*
 * map.js - The map view class.
 *
 * The Map class is responsible for displaying the map. It depends on
 * the Navigation class to provide information about the current layer
 * and position.
 */


import YAxis from './yaxis.js';
import Query from './query.js';


export default class Map extends EventEmitter2 {
    constructor(el, nav, app) {
        super();
        this.el = el;
        this.container = this.el.parentNode;
        this.nav = nav;
        this.app = app;
        this.profile = app.profile;

        const dt = this.nav.getCurrent() - this.profile.origin[0];

        this.map = new L.Map(this.el, {
            crs: L.CRS.Custom(this.app.profile),
            maxZoom: this.nav.getMaxZoom(),
            center: new L.LatLng(25000, dt, true),
            zoom: 2,
            worldCopyJump: false,
            fadeAnimation: true,
            doubleClickZoom: false,
            keyboardPanDelta: 150
        });

        this.map.attributionControl.setPrefix('');

        //this.measureControl = new L.Control.Measure(this.measure.bind(this));
        //this.measureControl.addTo(this.map);

        this.map.on('dblclick', this.onDbClick.bind(this));
        this.map.on('moveend', this.onMapMove.bind(this));

        this.layerGroup = new L.LayerGroup();
        this.layerGroup.addTo(this.map);

        document.addEventListener('keydown', event => {
            if (event.key === 'PageDown') {
                this.map.panBy(new L.Point(this.el.clientWidth, 0));
            }

            if (event.key === 'PageUp') {
                this.map.panBy(new L.Point(-this.el.clientWidth, 0));
            }
        });

        this.yaxis = new YAxis(
            document.querySelector('#yaxis-container .yaxis'), [
                this.getYRange()[0]/1000,
                this.getYRange()[1]/1000
            ]
        );

        this.map.on('move', () => {
            this.yaxis.setDomain([
                this.getYRange()[0]/1000,
                this.getYRange()[1]/1000
            ]);
        });

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
    }

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

    getYRange() {
        return [
            this.map.getBounds().getSouthWest().lat,
            this.map.getBounds().getNorthWest().lat
        ];
    }

    getXRange() {
        return [
            this.map.getBounds().getSouthWest().lng,
            this.map.getBounds().getSouthEast().lng
        ];
    }

    update() {
        var start = new Date(this.profile.origin[0]);
        start = d3.utcMillisecond.offset(start, this.getXRange()[0]);
        var end = new Date(this.profile.origin[0]);
        end = d3.utcMillisecond.offset(end, this.getXRange()[1]);
        if (!this.nav.isAvailable(start, end)) {
            this.app.showError('No data available here', true);
        } else {
            this.app.clearError();
        }
    }

    updateLayer() {
        var layer = this.nav.getLayer();
        //if (layer == this.currentLayer) return;
        //this.currentLayer = layer;

        if (layer.colormap.missing)
            this.container.style.background = layer.colormap.missing;

        var url = layer.src;
        url = url.replace('\{z\}', '\{y\}');
        url = url.replace('{zoom}', '{z}');

        /*
        this.tileLayer = L.tileLayer.canvas({
            maxZoom: this.nav.getMaxZoom(),
            tileSize: 256,
            continuousWorld: true,
            attribution: layer.attribution,
            async: true
        });

        this.tileLayer.drawTile = function(canvas, tilePoint, zoom) {
            // var src = this.tileLayer.getTileUrl(tilePoint);
            this.tileLayer._adjustTilePoint(tilePoint);
            var template_data = {
                x: tilePoint.x,
                y: Math.pow(2, zoom) - tilePoint.y - 1,
                z: zoom
            };
            var src = L.Util.template(url, template_data);
            var cb = this.tileLayer.tileDrawn.bind(this.tileLayer);
            drawTile(src, canvas, this.nav.getLayer().colormap, cb);
        }.bind(this);
        */

        this.tileLayer = new L.TileLayer(url, {
            maxZoom: this.nav.getMaxZoom(),
            tileSize: 256,
            continuousWorld: true,
            tms: true,
            attribution: layer.source.attribution
        });

        this.layerGroup.addLayer(this.tileLayer);

        // Remove other layers after a delay of 4s.
        window.setTimeout(function() {
            this.layerGroup.eachLayer(function(layer) {
                if (layer == this.tileLayer) return;
                this.layerGroup.removeLayer(layer);
            }.bind(this));
        }.bind(this), 4000);
    }

    move() {
        var t = (this.nav.getCurrent() - this.profile.origin[0]);
        var latlng = this.map.getCenter();
        if (latlng.lng === t || this.ignoreNavMove) return;
        latlng.lng = t;
        this.map.panTo(latlng);
        this.update();
    }

    center(callback) {
        let lat;
        let lon;
        let q;

        q = new Query();
        q.onLoad = function(response) { lat = parseFloat(response); }.bind(this);
        q.perform(this.profile, this.profile.layers.latitude, this.map.getZoom(), this.map.getCenter().lng);

        q = new Query();
        q.onLoad = function(response) { lon = parseFloat(response); callback(lat, lon); }.bind(this);
        q.perform(this.profile, this.profile.layers.longitude, this.map.getZoom(), this.map.getCenter().lng);
    }

    onMapMove(evt) {
        let latlng = this.map.getCenter();
        let t = latlng.lng;
        let h = latlng.lat;
        let date = new Date(this.profile.origin[0]);
        date = d3.utcMillisecond.offset(date, t);
        this.ignoreNavMove = true;
        this.nav.setCurrent(date);
        this.ignoreNavMove = false;
        this.update();
        this.emit('move');
    }

    onDbClick(evt) {
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
                let json;
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
    }

    popup(desc) {
        var content = document.querySelector('#popup-content-template').cloneNode(true);
        var valueText = isNaN(desc.value) ? 'Missing data' : scientific(desc.value)+' '+this.nav.getLayer().source.units;

        var lat = desc.latitude;
        var lon = desc.longitude;

        content.querySelector('.value').innerHTML = valueText;
        content.querySelector('.color-box').style.background = desc.color;
        content.querySelector('.latitude').innerHTML = lat;
        content.querySelector('.longitude').innerHTML = lon;
        content.querySelector('.height').innerHTML = scientific(desc.latlng.lat/1000, 3)+' km';
        content.querySelector('.time').innerHTML = time(desc.latlng.lng, this.profile);
        content.querySelector('.country').innerText = desc.country;
        content.querySelector('.latlon-link').href = 'https://www.openstreetmap.org/?mlat='+lat+'amp;mlon='+lon+'#map=4/'+lat+'/'+lon;

        var popup = new L.Popup();
        popup.setLatLng(desc.latlng);
        popup.setContent(content);
        this.map.openPopup(popup);
    }
}
