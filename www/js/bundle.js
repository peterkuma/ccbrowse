(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

L.Control.Measure = L.Control.extend({
    options: {
        position: 'topleft'
    },

    initialize: function initialize(fn) {
        this.fn = fn;
    },

    onAdd: function onAdd(map) {
        var container = L.DomUtil.create('div', 'leaflet-control-measure');
        var link = L.DomUtil.create('a', '', container);
        link.href = '#';
        link.title = 'Measure';

        L.DomEvent.on(link, 'click', L.DomEvent.stopPropagation).on(link, 'click', L.DomEvent.preventDefault).on(link, 'click', this.fn).on(link, 'dblclick', L.DomEvent.stopPropagation);

        return container;
    }
});

L.control.measure = function (options) {
    return new L.Control.Measure(options);
};

},{}],2:[function(require,module,exports){
"use strict";

},{}],3:[function(require,module,exports){
/*
 * ccbrowse.js - CCBrowse class.
 *
 * The CCBrowse class is the application class. It is created on DOMContentLoaded,
 * and initializes other classes.
 *
 * The code loosesly follows the MVC paradigm:
 *
 *   Controllers:
 *     - Navigation
 *
 *   Views:
 *     - NavigationView
 *     - Map
 *     - Colormap
 *
 * Much of the code is based on the MooTools framework, and uses its OOP
 * and Event implementation. The `map` (in fact a `profile`) is based on
 * Leaflet.
 *
 *   http://mootools.net/
 *   http://leaflet.cloudmade.com/
 *
 * At the heart of the program is the profile object, loaded from a JSON file.
 * The object hold information about available layers and location of tiles.
 * Layer data has to be prepared in advance by the ccimport.* programs,
 * which are part of this project.
 */

'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _mapJs = require('./map.js');

var _mapJs2 = _interopRequireDefault(_mapJs);

var _navigationJs = require('./navigation.js');

var _navigationJs2 = _interopRequireDefault(_navigationJs);

var _navigationPanelJs = require('./navigation-panel.js');

var _navigationPanelJs2 = _interopRequireDefault(_navigationPanelJs);

var _navigationProgressJs = require('./navigation-progress.js');

var _navigationProgressJs2 = _interopRequireDefault(_navigationProgressJs);

var _locationBarJs = require('./location-bar.js');

var _locationBarJs2 = _interopRequireDefault(_locationBarJs);

var _layerControlJs = require('./layer-control.js');

var _layerControlJs2 = _interopRequireDefault(_layerControlJs);

var _colormapJs = require('./colormap.js');

var _colormapJs2 = _interopRequireDefault(_colormapJs);

var _tooltipJs = require('./tooltip.js');

var _tooltipJs2 = _interopRequireDefault(_tooltipJs);

var CCBrowse = new Class({
    initialize: function initialize(url) {
        this.error = document.querySelector('.error');
        this.note = document.querySelector('.note');

        window.addEventListener('popstate', this.route.bind(this));

        // Initialize toolbox.
        $$('#toolbox a').each((function (link) {
            link.onclick = (function (evt) {
                window.history.pushState({}, '', link.href);
                this.route();
                evt.preventDefault();
            }).bind(this);
        }).bind(this));

        // Fetch profile specification and call init().
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = (function () {
            if (xhr.readyState != 4) return;
            if (xhr.status != 200) {
                this.showError('Profile specification is not available', true);
                return;
            }
            var json;
            try {
                json = JSON.parse(xhr.responseText);
            } catch (e) {
                this.showError('Invalid profile specification', true);
            }
            this.init(json);
        }).bind(this);
        xhr.open('GET', url);
        xhr.send();
    },

    init: function init(json) {
        this.profile = json;
        this.profile.origin[0] = new Date.parse(this.profile.origin[0] + ' +0000');

        if (this.profile.prefix !== '' && this.profie.prefix[this.profile.prefix.length - 1] !== '/') {
            this.profile.prefix = this.profile.prefix + '/';
        }

        console.log(this.profile.prefix);

        this.nav = new _navigationJs2['default'](this.profile);
        this.nav.setLayer('calipso532');
        this.nav.setZoom(2);
        this.nav.setCurrent(this.profile.origin[0]);

        this.nav.on('change', (function () {
            window.history.pushState({}, '', document.location.hash);
            document.title = this.nav.getCurrent().formatUTC('%e %b %Y %H:%M') + ' ‧ ccbrowse';
            this.route();
        }).bind(this));

        this.nav.on('layerchange', (function () {
            var layer = this.nav.getLayer();
            if (layer.colormap.colors) this.colormap = new _colormapJs2['default']($('colormap'), this.nav.getLayer().colormap);
            if (this.nav.getCurrent().diff(this.profile.origin[0], 'ms') == 0) {
                this.nav.setCurrent(this.smartCurrent(this.nav.getAvailability()));
            }
        }).bind(this));

        window.addEventListener('resize', (function () {
            this.colormap = new _colormapJs2['default']($('colormap'), this.nav.getLayer().colormap);
        }).bind(this));

        var layerControl = new _layerControlJs2['default']($('layer-control'), this.nav);
        this.navPanel = new _navigationPanelJs2['default']('nav .panel', this.nav);
        this.navProgress = new _navigationProgressJs2['default']('nav .progress', this.nav);
        this.map = new _mapJs2['default']($('map'), this.nav, this);
        this.map.on('error', this.onError.bind(this));
        $('map').focus();

        this.locationBar = new _locationBarJs2['default']($('location-bar'), this.map.map, this.profile);

        // Add tooltips.
        Array.prototype.forEach.call(document.querySelectorAll('[title]'), function (e) {
            new _tooltipJs2['default'](e);
        });

        this.showNote('Double-click to read off values');
    },

    smartCurrent: function smartCurrent(availability) {
        var latest = null;
        var max = 0;
        Array.prototype.forEach.call(availability, function (range) {
            if (range[1] > max) {
                max = range[1];
                latest = range;
            }
        });
        if (!latest) return this.profile.origin[0];
        var width = this.profile.zoom[this.nav.getZoom()].width;
        var hour = 3600 * 1000 / width;
        var lower = Math.max(latest[0], latest[1] - hour);
        var upper = latest[1];
        var date = new Date(this.profile.origin[0]);
        return date.increment('ms', (upper + lower) * 0.5 * width);
    },

    context: function context(name) {
        $$('.context').setStyle('display', 'none');
        $$('.context.' + name).setStyle('display', 'block');
    },

    page: function page(path) {
        var page = document.querySelector('.page');
        page.set('load', {
            onSuccess: (function () {
                this.context('page');
            }).bind(this)
        });
        page.load(path);
    },

    route: function route() {
        if (document.location.pathname == '/about/') this.page('/about.html');else this.context('map');
    },

    onError: function onError(evt) {
        this.showError(evt.message, evt.nohide);
    },

    showError: function showError(message, nohide) {
        console.log(message);
        this.error.set('html', message);
        this.error.removeClass('collapsed');
        if (!nohide) {
            window.setTimeout((function () {
                this.error.addClass('collapsed');
                this.note.removeClass('hold');
            }).bind(this), 5000);
        }
        this.note.addClass('hold');
    },

    clearError: function clearError() {
        this.error.addClass('collapsed');
        this.note.removeClass('hold');
    },

    showNote: function showNote(message) {
        this.note.set('html', message);
        this.note.removeClass('collapsed');
        window.setTimeout((function () {
            this.note.addClass('collapsed');
        }).bind(this), 5000);
        if (!this.error.hasClass('collapsed')) this.note.addClass('hold');
    }
});

document.addEventListener('DOMContentLoaded', function () {
    var ccbrowse = new CCBrowse('profile.json');
});

},{"./colormap.js":5,"./layer-control.js":6,"./location-bar.js":8,"./map.js":9,"./navigation-panel.js":10,"./navigation-progress.js":11,"./navigation.js":12,"./tooltip.js":16}],4:[function(require,module,exports){
/*
 * colorize.js - Apply colormap on data.
 *
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.colorize = colorize;

function colorize(data, width, height, colormap) {
    var i, j, k;
    var d;
    var n = colormap.bounds.length;
    var out = new Uint8ClampedArray(width * height * 4);
    var missing = new Uint8ClampedArray(4);
    var over = new Uint8ClampedArray(4);
    var under = new Uint8ClampedArray(4);

    if (colormap.missing) missing = hexToRgba(colormap.missing);

    if (colormap.under) under = hexToRgba(colormap.under);

    if (colormap.over) over = hexToRgba(colormap.over);

    var colors0 = colormap.colors.map(hexToRgba);

    var colors = new Uint8ClampedArray(colormap.colors.length * 4);
    colors.set(colors.map(function (x, i) {
        return colors0[i / 4 | 0][i % 4];
    }));

    var start = new Float32Array(colormap.bounds.map(function (x) {
        return x.start;
    }));

    var end = new Float32Array(colormap.bounds.map(function (x) {
        return x.end;
    }));

    var diff = new Float32Array(colormap.bounds.map(function (x) {
        return (x.end - x.start) / x.steps;
    }));

    var steps = new Float32Array(colormap.bounds.map(function (x) {
        return x.steps;
    }));

    var cindex = new Float32Array(n + 1);
    cindex.set(cumsum(steps), 1);

    for (i = 0; i < width; i++) {
        for (j = 0; j < height; j++) {
            for (k = 0; k < n; k++) {
                d = data[i * width + j];
                if (d >= start[k] && d < end[k]) {
                    var l = cindex[k] + (d - start[k]) / diff[k] | 0;
                    out[(i * width + j) * 4 + 0] = colors[l * 4 + 0];
                    out[(i * width + j) * 4 + 1] = colors[l * 4 + 1];
                    out[(i * width + j) * 4 + 2] = colors[l * 4 + 2];
                    out[(i * width + j) * 4 + 3] = colors[l * 4 + 3];
                }
            }
        }
    }

    for (i = 0; i < width; i++) {
        for (j = 0; j < height; j++) {
            d = data[i * width + j];
            if (isNaN(d)) {
                out[(i * width + j) * 4 + 0] = missing[0];
                out[(i * width + j) * 4 + 1] = missing[1];
                out[(i * width + j) * 4 + 2] = missing[2];
                out[(i * width + j) * 4 + 3] = missing[3];
            } else if (d < start[0]) {
                out[(i * width + j) * 4 + 0] = under[0];
                out[(i * width + j) * 4 + 1] = under[1];
                out[(i * width + j) * 4 + 2] = under[2];
                out[(i * width + j) * 4 + 3] = under[3];
            } else if (d >= end[end.length - 1]) {
                out[(i * width + j) * 4 + 0] = over[0];
                out[(i * width + j) * 4 + 1] = over[1];
                out[(i * width + j) * 4 + 2] = over[2];
                out[(i * width + j) * 4 + 3] = over[3];
            }
        }
    }
    return out;
}

},{}],5:[function(require,module,exports){
/*
 * colormap.js - Colormap class (view).
 *
 * The Colormap class is responsible for displaying the colormap.
 */

'use strict';

var Colormap = function Colormap(el, colormap) {
    this.el = typeof el == 'string' ? $(el) : el;
    this.colormap = colormap;

    this.el.innerHTML = '';

    var height = this.el.getSize().y;
    var yoffset = 0;

    if (this.colormap.over) {
        var over = document.createElement('div');
        over.addClass('colormap-over');
        over.setStyle('position', 'absolute');
        over.setStyle('top', 0);
        over.setStyle('left', 0);
        over.setStyle('background-color', this.colormap.over);
        this.el.appendChild(over);
        height -= over.getSize().y;
        yoffset += over.getSize().y;
    }

    if (this.colormap.under) {
        var under = document.createElement('div');
        under.addClass('colormap-under');
        this.el.appendChild(under);
        height -= under.getSize().y;
        under.setStyle('position', 'absolute');
        under.setStyle('top', yoffset + height);
        under.setStyle('left', 0);
        under.setStyle('background-color', this.colormap.under);
    }

    var colors = document.createElement('div');
    this.el.appendChild(colors);
    colors.setStyle('position', 'absolute');
    colors.setStyle('width', 20);
    colors.setStyle('top', yoffset);
    colors.setStyle('left', 0);
    colors.setStyle('height', height);
    this.drawColors(colors);

    var ticks = document.createElement('div');
    this.el.appendChild(ticks);
    ticks.setStyle('width', 80);
    ticks.setStyle('height', height);
    ticks.setStyle('position', 'absolute');
    ticks.setStyle('top', yoffset);
    ticks.setStyle('left', 10);
    this.drawTicks(ticks);
};

Colormap.prototype.drawColors = function (el) {
    var height = el.getSize().y;
    var width = el.getSize().x;
    var self = this;
    var h = height / this.colormap.colors.length;
    var n = 1;
    this.colormap.colors.forEach(function (color) {
        var div = document.createElement('div');
        div.setStyle('position', 'absolute');
        div.setStyle('top', height - n * h);
        div.setStyle('width', width);
        div.setStyle('height', h + 1);
        div.setStyle('background', color);
        el.appendChild(div);
        n++;
    });
};

Colormap.prototype.drawTicks = function (el) {
    var height = el.getSize().y;
    var width = el.getSize().x;
    var min = this.colormap.ticks[0];
    var max = this.colormap.ticks[this.colormap.ticks.length - 1];
    var h = height / this.colormap.colors.length;

    // Reduce the number of ticks to fit height.
    var nticks = 0;
    this.colormap.ticks.forEach(function (range) {
        nticks += range.steps;
    });
    var factor = Math.ceil(15 / height * nticks);
    if (factor <= 1) factor = 1;

    var self = this;
    var n = 0;
    var ticks = this.colormap.ticks;
    ticks.forEach(function (range) {
        var steps;
        if (range == ticks[ticks.length - 1]) steps = range.steps + 1;else steps = range.steps;
        for (var i = 0; i < steps; i++, n++) {
            if (n % factor !== 0) continue;
            var v = range.start + (range.end - range.start) * (i / range.steps);
            var y = (self.colormap.colors.length - self.transform(v)) * h;
            var tick = document.createElement('div');
            tick.setStyle('height', 1);
            tick.setStyle('width', 10);
            tick.setStyle('background', 'black');
            tick.setStyle('position', 'absolute');
            tick.setStyle('top', y + 1);
            el.appendChild(tick);

            var label = document.createElement('div');
            el.appendChild(label);
            label.set('html', scientific(v));
            label.setStyle('position', 'absolute');
            label.setStyle('top', y + 1 - label.getSize().y / 2);
            label.setStyle('left', 18);
            label.setStyle('color', 'white');
        }
    });
};

Colormap.prototype.transform = function (value) {
    var n = 0;
    var result = null;
    this.colormap.bounds.forEach(function (range) {
        if (value >= range.start && value <= range.end) result = n + (value - range.start) / (range.end - range.start) * range.steps;
        n += range.steps;
    });
    return result ? result : 0;
};

module.exports = Colormap;

},{}],6:[function(require,module,exports){
'use strict';

var LayerControl = new Class({
    initialize: function initialize(el, nav) {
        this.el = el;
        this.nav = nav;

        this.contentWrapper = this.el.querySelector('.content-wrapper');
        this.content = this.el.querySelector('.content');
        this.icon = this.el.querySelector('.icon');
        this.items = this.el.querySelector('.items');

        this.icon.addEventListener('click', (function () {
            this.el.toggleClass('collapsed');
            if (this.el.hasClass('collapsed')) {
                this.icon.title = '';
                this.el.title = 'Layers';
            } else {
                this.icon.title = 'Hide';
                this.el.title = '';
            }
            if (this.icon.tooltip) this.icon.tooltip.update();
            if (this.el.tooltip) this.el.tooltip.update();
        }).bind(this));

        this.nav.on('layerchange', this.update.bind(this));
        this.update();
    },

    update: function update() {
        this.items.innerHTML = '';
        var layers = this.nav.getLayers();
        Object.each(layers, (function (layer, name) {
            if (layer.dimensions != 'xz' || !layer.colormap) return;
            var item = document.createElement('a');
            item.href = name + '/';
            item.onclick = (function (evt) {
                this.nav.setLayer(name);
                this.update();
                evt.preventDefault();
            }).bind(this);
            item.addClass('layer-item');
            if (layer == this.nav.getLayer()) item.addClass('active');
            var bulb = document.createElement('div');
            bulb.addClass('bulb');
            item.appendChild(bulb);
            var label = document.createElement('span');
            label.set('text', layer.title);
            item.appendChild(label);
            this.items.appendChild(item);
        }).bind(this));

        /*
        var newel = this.el.clone();
        newel.removeClass('collapsed');
        document.body.appendChild(newel);
        this.content.setStyle('width', newel.querySelector('.content').getSize().x);
        this.content.setStyle('height', newel.querySelector('.content').getSize().y);
        document.body.removeChild(newel);
        */
        /*
        this.content.setStyle('width', this.content.getDimensions().x);
        this.content.setStyle('height', this.content.getDimensions().y);
        */
    }
});

module.exports = LayerControl;

},{}],7:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Layer = (function () {
    function Layer(name, source) {
        _classCallCheck(this, Layer);

        this.name = name;
        this.source = source;
    }

    _createClass(Layer, [{
        key: "ready",
        value: function ready() {
            return regeneratorRuntime.async(function ready$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        context$2$0.t0 = JSON;
                        context$2$0.next = 3;
                        return regeneratorRuntime.awrap(fetch(this.source.availability));

                    case 3:
                        context$2$0.t1 = context$2$0.sent;
                        this.availability = context$2$0.t0.parse.call(context$2$0.t0, context$2$0.t1);
                        context$2$0.t2 = JSON;
                        context$2$0.next = 8;
                        return regeneratorRuntime.awrap(fetch(this.source.colormap));

                    case 8:
                        context$2$0.t3 = context$2$0.sent;
                        this.colormap = context$2$0.t2.parse.call(context$2$0.t2, context$2$0.t3);
                        return context$2$0.abrupt("return", true);

                    case 11:
                    case "end":
                        return context$2$0.stop();
                }
            }, null, this);
        }
    }, {
        key: "tile",
        value: function tile(x, z, zoom) {
            var src, res, data;
            return regeneratorRuntime.async(function tile$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        src = template(this.source.src, {
                            layer: this.name,
                            x: x,
                            z: z,
                            zoom: zoom
                        });
                        context$2$0.next = 3;
                        return regeneratorRuntime.awrap(loadImageData(src));

                    case 3:
                        res = context$2$0.sent;
                        context$2$0.next = 6;
                        return regeneratorRuntime.awrap(pngunpack(res.rawData));

                    case 6:
                        data = context$2$0.sent;
                        return context$2$0.abrupt("return", {
                            layer: this.name,
                            x: x,
                            z: z,
                            zoom: zoom,
                            data: data
                        });

                    case 8:
                    case "end":
                        return context$2$0.stop();
                }
            }, null, this);
        }
    }]);

    return Layer;
})();

},{}],8:[function(require,module,exports){
'use strict';

var LocationBar = new Class({
    initialize: function initialize(bar, map, profile) {
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

    update: function update() {
        if (this.xhr) return;

        var bounds = this.map.getBounds();
        var zoom = this.map.getZoom();

        var t1 = bounds.getSouthWest().lon;
        var t3 = bounds.getSouthEast().lon;
        var t2 = (t3 - t2) / 2;

        var bounds = this.map.getPixelBounds();
        var x1 = Math.ceil(bounds.min.x / 256);
        var x2 = Math.floor(bounds.max.x / 256);
        var x = Math.round((x1 + x2) / 2);

        var url = this.profile.prefix + this.profile.layers.geocoding.src;
        url = L.Util.template(url, {
            'zoom': zoom,
            'x': x
        });
        url += '?reduce=128';

        this.xhr = new XMLHttpRequest();
        this.xhr.open('GET', url);
        this.xhr.onreadystatechange = (function () {
            if (this.xhr.readyState != 4) return;
            this.center.set('text', '…');
            this.center.title = 'No information about place available';
            if (this.xhr.status == 200) {
                json = JSON.decode(this.xhr.responseText);
                if (json && json.features.length) {
                    this.center.set('text', json.features[0].properties.name);
                    this.center.title = '';
                }
            } else {
                console.log(url + ' ' + this.xhr.status + ' ' + this.xhr.statusText);
                console.log('No location information available');
            }
            if (this.center.tooltip) this.center.tooltip.update();
            this.xhr = null;
        }).bind(this);
        this.xhr.send();
    }
});

module.exports = LocationBar;

},{}],9:[function(require,module,exports){
/*
 * map.js - The map view class.
 *
 * The Map class is responsible for displaying the map. It depends on
 * the Navigation class to provide information about the current layer
 * and position.
 */

'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _yaxisJs = require('./yaxis.js');

var _yaxisJs2 = _interopRequireDefault(_yaxisJs);

var Map = new Class({
    Implements: EventEmitter2,

    initialize: function initialize(el, nav, app) {
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
                'pagedown': (function () {
                    this.map.panBy(new L.Point(this.el.getSize().x, 0));
                }).bind(this),
                'pageup': (function () {
                    this.map.panBy(new L.Point(-this.el.getSize().x, 0));
                }).bind(this)
            }
        });
        this.keyboard.activate();

        this.yaxis = new _yaxisJs2['default']($$('#yaxis-container .yaxis')[0], [this.getYRange()[0] / 1000, this.getYRange()[1] / 1000]);

        this.map.on('move', (function () {
            this.yaxis.setDomain([this.getYRange()[0] / 1000, this.getYRange()[1] / 1000]);
        }).bind(this));

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

    getYRange: function getYRange() {
        return [this.map.getBounds().getSouthWest().lat, this.map.getBounds().getNorthWest().lat];
    },

    getXRange: function getXRange() {
        return [this.map.getBounds().getSouthWest().lng, this.map.getBounds().getSouthEast().lng];
    },

    update: function update() {
        var start = new Date(this.profile.origin[0]).increment('ms', this.getXRange()[0]);
        var end = new Date(this.profile.origin[0]).increment('ms', this.getXRange()[1]);
        if (!this.nav.isAvailable(start, end)) {
            this.app.showError('No data available here', true);
        } else {
            this.app.clearError();
        }
    },

    updateLayer: function updateLayer() {
        var layer = this.nav.getLayer();
        //if (layer == this.currentLayer) return;
        //this.currentLayer = layer;

        if (layer.colormap.missing) this.container.setStyle('background', layer.colormap.missing);

        var url = layer.src;
        url = url.replace('\{z\}', '\{y\}');
        url = url.replace('{zoom}', '{z}');

        this.tileLayer = L.tileLayer.canvas({
            maxZoom: this.nav.getMaxZoom(),
            tileSize: 256,
            continuousWorld: true,
            attribution: layer.attribution,
            async: true
        });

        this.tileLayer.drawTile = (function (canvas, tilePoint, zoom) {
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
        }).bind(this);

        // this.tileLayer = new L.TileLayer(url, {
        //     maxZoom: this.nav.getMaxZoom(),
        //     tileSize: 256,
        //     continuousWorld: true,
        //     tms: true,
        //     attribution: layer.attribution
        // });

        this.layerGroup.addLayer(this.tileLayer);

        // Remove other layers after a delay of 4s.
        window.setTimeout((function () {
            this.layerGroup.eachLayer((function (layer) {
                if (layer == this.tileLayer) return;
                this.layerGroup.removeLayer(layer);
            }).bind(this));
        }).bind(this), 4000);
    },

    move: function move() {
        if (this.hold) return;
        var t = this.nav.getCurrent() - this.profile.origin[0];
        var latlng = this.map.getCenter();
        latlng.lng = t;

        this.disableOnMove = true;
        this.map.panTo(latlng);

        var tmp = (function () {
            this.map.off('moveend', tmp);
            this.disableOnMove = false;
        }).bind(this);
        this.map.on('moveend', tmp);

        this.update();
    },

    onMove: function onMove(evt) {
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

    onDbClick: function onDbClick(evt) {
        var value = null;
        var latitude = null;
        var longitude = null;

        var fn = (function () {
            if (value == null || latitude == null || longitude == null) return;
            console.log(value, latitude, longitude);

            var url = this.profile.layers.geography.src + '?q=' + latitude + ',' + longitude;
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = (function () {
                if (xhr.readyState != 4) return;
                if (xhr.status != 200) {
                    console.log(url + ' ' + xhr.status + ' ' + xhr.statusText);
                    this.emit('error', {
                        message: 'No information available for this point'
                    });
                    return;
                }
                try {
                    json = JSON.parse(xhr.responseText);
                } catch (e) {
                    json = {};
                }
                var name = json.name ? json.name : '';
                this.popup({
                    'value': value,
                    'latitude': latitude,
                    'longitude': longitude,
                    'color': color(value, this.nav.getLayer().colormap),
                    'latlng': evt.latlng,
                    'country': name
                });
            }).bind(this);
            xhr.open('GET', url);
            xhr.send();
        }).bind(this);

        var q = new Query();
        q.onLoad = (function (response) {
            value = parseFloat(response);fn();
        }).bind(this);
        q.perform(this.profile, this.nav.getLayer(), this.map.getZoom(), evt.latlng.lng, evt.latlng.lat);

        q = new Query();
        q.onLoad = (function (response) {
            latitude = parseFloat(response);fn();
        }).bind(this);
        q.perform(this.profile, this.profile.layers.latitude, this.map.getZoom(), evt.latlng.lng);

        q = new Query();
        q.onLoad = (function (response) {
            longitude = parseFloat(response);fn();
        }).bind(this);
        q.perform(this.profile, this.profile.layers.longitude, this.map.getZoom(), evt.latlng.lng);
    },

    popup: function popup(desc) {
        var content = $('popup-content-template').clone();
        var valueText = isNaN(desc.value) ? 'Missing data' : scientific(desc.value) + ' ' + this.nav.getLayer().units;

        var lat = format_latitude(desc.latitude, 2);
        var lon = format_longitude(desc.longitude, 2);

        content.querySelector('.value').set('html', valueText);
        content.querySelector('.color-box').setStyle('background-color', desc.color);
        content.querySelector('.latitude').set('html', lat);
        content.querySelector('.longitude').set('html', lon);
        content.querySelector('.height').set('html', scientific(desc.latlng.lat / 1000, 3) + ' km');
        content.querySelector('.time').set('html', time(desc.latlng.lng, this.profile));
        content.querySelector('.country').set('text', desc.country);
        content.querySelector('.latlon-link').href = 'http://maps.google.com/maps?z=5&t=p&q=' + lat + ', ' + lon;

        var popup = new L.Popup();
        popup.setLatLng(desc.latlng);
        popup.setContent(content);
        this.map.openPopup(popup);
    }
});

module.exports = Map;

},{"./yaxis.js":18}],10:[function(require,module,exports){
/*
 * navigation-panel.js - NavigationPanel class (view).
 *
 * The NavigationPanel class is responsible for displaying the navigation bar
 * panel. It depends on the Navigation class to provide the information to
 * display, such as data availability and current position and layer.
 */

'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _tooltipJs = require('./tooltip.js');

var _tooltipJs2 = _interopRequireDefault(_tooltipJs);

var NavigationPanel = new Class({
    initialize: function initialize(el, nav) {
        this.el = d3.select(el);
        this.nav = nav;

        this.el.html('');
        this.years = this.el.insert('div').attr('class', 'years');
        this.days = this.el.insert('div').attr('class', 'days');

        this.update();
        this.nav.on('change', this.update.bind(this));
    },

    update: function update(expandedYear) {
        var t1 = this.nav.profile.origin[0];
        var t2 = new Date();
        var t0 = this.nav.getCurrent();

        //var smooth = typeof(expandedYear) != 'undefined';
        expandedYear = expandedYear || t0.getUTCFullYear();

        var years = d3.time.year.utc.range(t1, t2);

        var nextMonth = d3.time.month.utc.offset(t0, 1);
        var dayStop = nextMonth < t2 ? nextMonth : t2;
        var days = d3.time.day.utc.range(d3.time.month.utc(t0), d3.time.month.utc(dayStop));

        var yearGroup = this.years.selectAll('.year-group').data(years);

        yearGroup.enter().append('div').attr('class', 'year-group').insert('div').attr('class', 'year').text(function (d) {
            return d.getUTCFullYear();
        }).each(function () {
            new _tooltipJs2['default'](this);
        });

        var year = yearGroup.selectAll('.year');

        year.classed('disabled', (function (d) {
            return !this.nav.isAvailableYear(d.getUTCFullYear());
        }).bind(this)).property('onclick', (function (d) {
            return (function () {
                this.update(d.getUTCFullYear());
            }).bind(this);
        }).bind(this)).attr('title', '').filter('.disabled').property('onclick', 'return false;').attr('title', 'Unavailable');

        var months = yearGroup.selectAll('.months').data(function (d) {
            return d.getUTCFullYear() == expandedYear ? [d] : [];
        });

        var monthsEnter = months.enter().append('div').attr('class', 'months');

        months.exit().transition().duration(250).style('width', '0px').style('opacity', 0).remove();

        var month = months.selectAll('.month').data(function (d) {
            var next = d3.time.year.utc.offset(d, 1);
            var stop = next < t2 ? next : t2;
            return d3.time.month.utc.range(d, stop);
        });

        month.enter().append('a').attr('class', 'month').text(function (d) {
            return d.formatUTC('%b');
        }).each(function () {
            new _tooltipJs2['default'](this);
        });

        month.classed('selected', function (d) {
            return t0.getUTCFullYear() == d.getUTCFullYear() && t0.getUTCMonth() == d.getUTCMonth();
        }).classed('disabled', (function (d) {
            return !this.nav.isAvailableMonth(d.getUTCFullYear(), d.getUTCMonth());
        }).bind(this)).attr('href', function (d) {
            return d.formatUTC('#%Y-%b');
        }).attr('onclick', '').attr('title', '').filter('.disabled').attr('onclick', 'return false;').attr('title', 'Unavailable');

        monthsEnter.property('__width__', function () {
            return this.clientWidth;
        }).style('width', '0px').transition().duration(250).ease('cubic-in-out').style('opacity', 1).style('width', function () {
            return this.__width__ + 'px';
        });

        var day = this.days.selectAll('.day').data(days);

        day.enter().append('a').attr('class', 'day').text(function (d) {
            return d.getUTCDate();
        }).each(function () {
            new _tooltipJs2['default'](this);
        });

        day.exit().remove();

        day.classed('selected', function (d) {
            return t0.getUTCDate() == d.getUTCDate();
        }).classed('disabled', (function (d) {
            return !this.nav.isAvailableDay(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        }).bind(this)).attr('href', function (d) {
            return d.formatUTC('#%Y-%b-%d');
        }).attr('onclick', '').attr('title', '').filter('.disabled').attr('onclick', 'return false;').attr('title', 'Unavailable');
    }
});

module.exports = NavigationPanel;

},{"./tooltip.js":16}],11:[function(require,module,exports){
/*
 * navigation-progress.js - NavigationProgress class (view).
 *
 * The NavigationProgress class is responsible for displaying the navigation
 * progress bar. It depends on the Navigation class to provide the information
 * to display, such as data availability and current position and layer.
 */

'use strict';

var NavigationProgress = new Class({
    initialize: function initialize(el, nav) {
        this.el = d3.select(el);
        this.nav = nav;

        this.el.html('');
        this.indicator = this.el.insert('div').attr('class', 'indicator');
        this.thumb = this.el.insert('div').attr('class', 'thumb');
        this.tooltip = this.el.insert('div').attr('class', 'tooltip');

        this.update();
        this.nav.on('change', this.update.bind(this));

        this.el.on('mousedown', (function () {
            this.set(d3.event.clientX / this.el.property('clientWidth'));
            this.el.on('mousemove', (function () {
                this.set(d3.event.clientX / this.el.property('clientWidth'));
            }).bind(this));
        }).bind(this));

        this.el.on('mouseup', (function () {
            this.el.on('mousemove', null);
        }).bind(this));

        this.el.on('mouseover.tooltip', (function () {
            this.tooltipAt(d3.event.clientX);
        }).bind(this));

        this.el.on('mousemove.tooltip', (function () {
            this.tooltipAt(d3.event.clientX);
        }).bind(this));

        this.el.on('mouseout.tooltip', (function () {
            this.tooltipAt(null);
        }).bind(this));
    },

    set: function set(fraction) {
        var t0 = this.nav.getCurrent();
        var t1 = d3.time.day.utc(t0);
        t0 = d3.time.second.utc.offset(t1, 24 * 60 * 60 * fraction);
        this.nav.setCurrent(t0);
    },

    update: function update() {
        var t0 = this.nav.getCurrent();
        var t1 = d3.time.day.utc(t0);
        var t2 = d3.time.day.utc.offset(t1, 1);

        var x = d3.time.scale.utc().domain([t1, t2]).range([0, this.el.property('clientWidth')]);

        var fraction = (t0 - t1) / (t2 - t1);

        this.indicator.style('width', x(t0) + 'px');
        this.thumb.style('left', x(t0) + 'px');

        var intervals = this.nav.availableBetween(t1, t2);

        var availability = this.el.selectAll('.availability').data(intervals, Array);

        availability.exit().remove();

        availability.enter().append('div').attr('class', 'availability').style('left', function (d) {
            return x(d[0]) + 'px';
        }).style('width', function (d) {
            return x(d[1]) - x(d[0]) + 'px';
        });
    },

    tooltipAt: function tooltipAt(x) {
        var fraction = x / this.el.property('clientWidth');
        var t0 = this.nav.getCurrent();
        var t1 = d3.time.day.utc(t0);
        var t = d3.time.second.utc.offset(t1, 24 * 60 * 60 * fraction);

        this.tooltip.style('display', function () {
            return x === null ? 'none' : 'block';
        });

        this.tooltip.style('left', function () {
            return x - this.clientWidth / 2 + 'px';
        }).text(t.formatUTC('%H:%M'));
    }
});

module.exports = NavigationProgress;

},{}],12:[function(require,module,exports){
/*
 * navigation.js - Navigation class (controller).
 *
 * The Navigation class holds the information about the current position,
 * layer and data availability. Events are fired when the position or layer
 * changes. The class is independent from other classes.
 */

'use strict';

var Navigation = new Class({
    Implements: EventEmitter2,

    initialize: function initialize(profile) {
        this.profile = profile;
        this.zoom = 0;
        window.addEventListener('hashchange', this.update.bind(this));
        this.update();
    },

    update: function update() {
        if (window.location.hash === '') return;
        var date = new Date().parse(window.location.hash.substring(1) + ' +0000');
        if (!date.isValid()) return;
        this.current = date;
        this.emit('change');
    },

    getLayers: function getLayers() {
        return this.profile.layers;
    },

    getLayer: function getLayer() {
        return this.layer;
    },
    setLayer: function setLayer(name) {
        this.layer = this.profile.layers[name];

        if (typeof this.layer.colormap == 'string') {
            new Request.JSON({
                'url': this.profile.prefix + this.layer.colormap,
                onSuccess: (function (json) {
                    this.layer.colormap = json;
                    this.emit('change');
                    this.emit('layerchange');
                }).bind(this)
            }).get();
        }

        if (typeof this.layer.availability == 'string') {
            new Request.JSON({
                'url': this.profile.prefix + this.layer.availability,
                onSuccess: (function (json) {
                    this.layer.availability = json;
                    this.emit('change');
                    this.emit('layerchange');
                }).bind(this)
            }).get();
        }

        this.emit('change');
        this.emit('layerchange');
    },

    getCurrent: function getCurrent() {
        return new Date(this.current);
    },
    setCurrent: function setCurrent(date) {
        this.current = date;
        window.location.replace('#' + date.formatUTC('%Y-%b-%d,%H:%M:%S'));
        this.emit('change');
    },

    getZoom: function getZoom() {
        return this.zoom;
    },
    setZoom: function setZoom(zoom) {
        this.zoom = zoom;
        this.emit('change');
    },

    getMaxZoom: function getMaxZoom() {
        var i = 0;
        while (this.profile.zoom[i.toString()]) i++;
        return i - 1;
    },

    getAvailability: function getAvailability() {
        if (!this.layer || !this.layer.availability || typeof this.layer.availability == 'string' || !this.layer.availability[this.zoom]) return [];
        return this.layer.availability[this.zoom];
    },

    isAvailable: function isAvailable(start, end) {
        var availability = this.getAvailability();

        var x1 = (start - this.profile.origin[0]) / this.profile.zoom[this.zoom].width;
        var x2 = (end - this.profile.origin[0]) / this.profile.zoom[this.zoom].width;

        for (var i = 0; i < availability.length; i++) {
            var range = availability[i];
            if (range[0] >= x1 && range[0] <= x2) return true;
            if (range[1] >= x1 && range[1] <= x2) return true;
            if (range[0] <= x1 && range[1] >= x2) return true;
        }
        return false;
    },

    isAvailableYear: function isAvailableYear(year) {
        return this.isAvailable(new UTCDate(year, 0, 1), new UTCDate(year, 0, 1).increment('year', 1));
    },

    isAvailableMonth: function isAvailableMonth(year, month) {
        return this.isAvailable(new UTCDate(year, month, 1), new UTCDate(year, month, 1).increment('month', 1));
    },

    isAvailableDay: function isAvailableDay(year, month, day) {
        return this.isAvailable(new UTCDate(year, month, day), new UTCDate(year, month, day).increment('day', 1));
    },

    availableBetween: function availableBetween(start, end) {
        if (!this.layer || !this.layer.availability || typeof this.layer.availability == 'string' || !this.layer.availability[this.zoom]) return [];
        var availability = this.layer.availability[this.zoom];

        var x1 = (start - this.profile.origin[0]) / this.profile.zoom[this.zoom].width;
        var x2 = (end - this.profile.origin[0]) / this.profile.zoom[this.zoom].width;

        var intervals = [];
        for (var i = 0; i < availability.length; i++) {
            var range = availability[i];

            var date1 = new Date(this.profile.origin[0]).increment('ms', range[0] * this.profile.zoom[this.zoom].width);
            var date2 = new Date(this.profile.origin[0]).increment('ms', range[1] * this.profile.zoom[this.zoom].width);

            if (range[0] <= x1 && range[1] >= x2) intervals.push([start, end]);
            if (range[0] >= x1 && range[1] <= x2) intervals.push([date1, date2]);
            if (range[0] <= x1 && range[1] >= x1) intervals.push([start, date2]);
            if (range[0] <= x2 && range[1] >= x2) intervals.push([date1, end]);
        }
        return intervals;
    }
});

module.exports = Navigation;

},{}],13:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _layerJs = require('./layer.js');

var _layerJs2 = _interopRequireDefault(_layerJs);

var Profile = (function () {
    function Profile(source) {
        _classCallCheck(this, Profile);

        this.source = source;
    }

    _createClass(Profile, [{
        key: 'layer',
        value: function layer(name) {
            var source, layer;
            return regeneratorRuntime.async(function layer$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        if (!(this.source.layers[name] === undefined)) {
                            context$2$0.next = 2;
                            break;
                        }

                        return context$2$0.abrupt('return', null);

                    case 2:
                        source = this.source.layers[name];
                        layer = (0, _layerJs2['default'])(name, source);
                        context$2$0.next = 6;
                        return regeneratorRuntime.awrap(layer.ready());

                    case 6:
                        return context$2$0.abrupt('return', context$2$0.sent);

                    case 7:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }
    }, {
        key: 'origin',
        get: function get() {
            return new Date.parse(this.source.origin[0] + ' +0000');
        }
    }, {
        key: 'prefix',
        get: function get() {
            var prefix = this.source.prefix;
            if (prefix !== '' && prefix[prefix.length - 1] !== '/') {
                return prefix + '/';
            }
            return prefix;
        }
    }, {
        key: 'zoom',
        get: function get() {
            return this.source.zoom;
        }
    }, {
        key: 'zBounds',
        get: function get() {
            return this.source['z-bounds'];
        }
    }]);

    return Profile;
})();

},{"./layer.js":7}],14:[function(require,module,exports){
/*
 * projection.js - Custom Leaflet projection.
 *
 * The L.CRS.Custom class provides projection of time/height coordinates
 * to pixel coordiates for a leaflet map.
 */

'use strict';

L.Projection.Custom = {
    project: function project(latlng) {
        return new L.Point(latlng.lng, latlng.lat);
    },

    unproject: function unproject(point, unbounded) {
        return new L.LatLng(point.y, point.x, true);
    }
};

L.CRS.Custom = function (profile) {
    var transformation = new L.Transformation(1 / profile.zoom[0].width, 0, -1 / profile.zoom[0].height, 1);
    var scale = function scale(zoom) {
        return 256 * profile.zoom[0].width / profile.zoom[zoom].width;
    };
    return L.Util.extend({}, L.CRS, {
        code: 'EPSG:0000',
        projection: L.Projection.Custom,
        transformation: transformation,
        scale: scale
    });
};

},{}],15:[function(require,module,exports){
'use strict';

function Query() {
    ;
}

Query.prototype.onLoad = null;

Query.prototype.perform = function (profile, layer, level, t, h) {
    var req = new XMLHttpRequest();

    req.onreadystatechange = (function () {
        if (req.readyState == 4) {
            if (this.onLoad) this.onLoad(req.responseText);
        }
    }).bind(this);

    var x = t / profile.zoom[level].width;
    var z = (h - profile.origin[1]) / profile.zoom[level].height;

    var url = '../';
    url += L.Util.template(layer.src, {
        zoom: level,
        x: Math.floor(x),
        z: Math.floor(z)
    });

    var i = Math.round(x % 1 * 256);
    var j = Math.round(z % 1 * 256);
    i = i >= 0 ? i : 256 + i;
    j = j >= 0 ? j : 256 + j;
    j = 256 - j;

    if (typeof h == 'undefined') j = 0;

    url += '?q=' + i + ',' + j;

    req.open('GET', url);
    req.send();
};

},{}],16:[function(require,module,exports){
/*
 * tooltip.js - Tooltip class.
 *
 * The Tooltip class is responsible for showing a tooltip for elements
 * on mouse hover. The `title` attribute is used as the text of the tooltip.
 */

'use strict';

var Tooltip = new Class({
    Implements: EventEmitter2,

    initialize: function initialize(forEl) {
        this.template = $('tooltip-template');
        this.el = this.template.clone();
        this.forEl = forEl;
        this.forEl.tooltip = this;
        this.content = this.el.querySelector('.content');

        this.content.set('html', this.forEl.title);

        this.el.set('tween', { duration: 100 });
        this.el.fade('hide');

        $('overlay').appendChild(this.el);

        this.forEl.addEventListener('mouseover', (function () {
            this.update();
            if (!this.title) return;
            this.forEl.title = '';
            this.el.fade('in');
        }).bind(this));

        this.forEl.addEventListener('mouseout', (function () {
            if (this.stick) return;
            this.el.fade('out');
            if (this.forEl.title === '') this.forEl.title = this.title;
        }).bind(this));

        //this.forEl.addEventListener('change', this.update.bind(this));
    },

    update: function update() {
        this.title = this.forEl.title;

        this.content.set('html', this.title);
        if (this.title) this.el.setStyle('display', 'block');else this.el.setStyle('display', 'none');

        var x = this.forEl.getPosition().x;
        var y = this.forEl.getPosition().y;
        var w = this.forEl.getSize().x;
        var h = this.forEl.getSize().y;

        var width = this.el.getSize().x;
        var height = this.el.getSize().y;

        this.el.setStyle('left', x + w / 2 - width / 2);
        this.el.setStyle('top', y + h + 6);

        if (y + h + 6 + height > document.body.getSize().y) this.el.setStyle('top', y - height - 6);

        if (x + w / 2 - width / 2 < 0) this.el.setStyle('left', x);
    },

    setStick: function setStick(stick) {
        this.stick = stick ? true : false;
    }
});

module.exports = Tooltip;

},{}],17:[function(require,module,exports){
/*
 * utils.js - Utility functions.
 *
 * Utility functions used throughout the project.
 */

'use strict';

var $ = function $(id) {
    return document.getElementById(id);
};

function hex2rgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function hexToRgba(hex) {
    if (hex[0] === '#') hex = hex.slice(1);
    x = parseInt(hex, 16);
    var rgba = new Uint8Array(4);
    if (hex.length <= 6) x = x << 8 | 0xff;
    rgba[0] = x >> 24;
    rgba[1] = x >> 16;
    rgba[2] = x >> 8;
    rgba[3] = x;
    return rgba;
}

function cumsum(u) {
    var s = 0;
    return u.map(function (x) {
        return s += x;
    });
}

function pngunpack(data) {
    var u32 = new Uint32Array(data.buffer);
    var u8 = new Uint8Array(data.length / 4);
    u8.set(u32);
    var f32 = new Float32Array(u8.buffer);
    return f32;
}

function scientific(v, precision) {
    if (typeof precision == 'undefined') precision = 1;
    if (v == 0 || Math.abs(v) >= 0.1 && Math.abs(v) < 10000) return v.toFixed(precision);
    var s = v.toExponential(precision);
    if (s.indexOf('e') == -1) return s;
    //return s.replace('e', ' &#x2A09;<span style="margin-left: -2px">10<sup>') + '</sup></span>';
    return s.replace('e', ' x10<sup>') + '</sup>';
}

function color(v, colormap) {
    var color = colormap.missing;
    for (var n = 0, m = 0; n < colormap.bounds.length; n++) {
        var range = colormap.bounds[n];
        if (v >= range.start && v < range.end) {
            color = colormap.colors[Math.floor(m + (v - range.start) / (range.end - range.start) * range.steps)];
            break;
        }
        m += range.steps;
    }
    return color;
}

function time(t, profile) {
    var date = new Date(profile.origin[0]);
    date.increment('ms', t);
    return date.toUTCString().replace('GMT', 'UTC');
}

function format_latitude(lat, precision) {
    var text = scientific(Math.abs(lat), precision) + '° '; //'&#x00B0; ';
    return text + (lat < 0 ? 'S' : 'N');
}

function format_longitude(lon, precision) {
    var text = scientific(Math.abs(lon), precision) + '° '; //'&#x00B0; ';
    return text + (lon < 0 ? 'W' : 'E');
}

function ordinal(n) {
    if (n == 1) return n + '<span class="ordinal">st</span>';
    if (n == 2) return n + '<span class="ordinal">nd</span>';
    if (n == 3) return n + '<span class="ordinal">rd</span>';
    return n + '<span class="ordinal">th</span>';
}

Date.implement({
    formatUTC: function formatUTC(format) {
        var date = new Date(this.getUTCFullYear(), this.getUTCMonth(), this.getUTCDate(), this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds());
        return date.format(format);
    }
});

Date.defineParser('%Y(-%b(-%d(,%H:%M(:%S)?)?)?)?( %z)?');

var UTCDate = function UTCDate(year, month, day, hour, minute, second, millisecond) {
    var date = new Date(1970, 1, 1);
    date.setUTCFullYear(year);
    date.setUTCMonth(month);
    date.setUTCMonth(month);
    date.setUTCDate(day);
    date.setUTCHours(hour ? hour : 0);
    date.setUTCMinutes(minute ? minute : 0);
    date.setUTCSeconds(second ? second : 0);
    date.setUTCMilliseconds(millisecond ? millisecond : 0);
    return date;
};

function loadImageData(src, cb) {
    var img = document.createElement('img');
    img.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        var data = ctx.getImageData(0, 0, img.width, img.height).data;
        cb(data, img.width, img.height);
    };
    img.src = src;
}

function drawTile(src, canvas, colormap, cb) {
    loadImageData(src, function (rawData, width, height) {
        var data = pngunpack(rawData);
        var pixelData = colorize(data, width / 4 | 0, height, colormap);
        var ctx = canvas.getContext('2d');
        var imgData = new ImageData(pixelData, width / 4 | 0, height);
        canvas.width = width / 4 | 0;
        canvas.height = height;
        ctx.putImageData(imgData, 0, 0);
        if (canvas !== undefined) cb(canvas);
    });
}

function colorize(data, width, height, colormap) {
    var i, j, k;
    var d;
    var n = colormap.bounds.length;
    var out = new Uint8ClampedArray(width * height * 4);
    var missing = new Uint8ClampedArray(4);
    var over = new Uint8ClampedArray(4);
    var under = new Uint8ClampedArray(4);

    if (colormap.missing) missing = hexToRgba(colormap.missing);

    if (colormap.under) under = hexToRgba(colormap.under);

    if (colormap.over) over = hexToRgba(colormap.over);

    var colors0 = colormap.colors.map(hexToRgba);

    var colors = new Uint8ClampedArray(colormap.colors.length * 4);
    colors.set(colors.map(function (x, i) {
        return colors0[i / 4 | 0][i % 4];
    }));

    var start = new Float32Array(colormap.bounds.map(function (x) {
        return x.start;
    }));

    var end = new Float32Array(colormap.bounds.map(function (x) {
        return x.end;
    }));

    var diff = new Float32Array(colormap.bounds.map(function (x) {
        return (x.end - x.start) / x.steps;
    }));

    var steps = new Float32Array(colormap.bounds.map(function (x) {
        return x.steps;
    }));

    var cindex = new Float32Array(n + 1);
    cindex.set(cumsum(steps), 1);

    for (i = 0; i < width; i++) {
        for (j = 0; j < height; j++) {
            for (k = 0; k < n; k++) {
                d = data[i * width + j];
                if (d >= start[k] && d < end[k]) {
                    var l = cindex[k] + (d - start[k]) / diff[k] | 0;
                    out[(i * width + j) * 4 + 0] = colors[l * 4 + 0];
                    out[(i * width + j) * 4 + 1] = colors[l * 4 + 1];
                    out[(i * width + j) * 4 + 2] = colors[l * 4 + 2];
                    out[(i * width + j) * 4 + 3] = colors[l * 4 + 3];
                }
            }
        }
    }

    for (i = 0; i < width; i++) {
        for (j = 0; j < height; j++) {
            d = data[i * width + j];
            if (isNaN(d)) {
                out[(i * width + j) * 4 + 0] = missing[0];
                out[(i * width + j) * 4 + 1] = missing[1];
                out[(i * width + j) * 4 + 2] = missing[2];
                out[(i * width + j) * 4 + 3] = missing[3];
            } else if (d < start[0]) {
                out[(i * width + j) * 4 + 0] = under[0];
                out[(i * width + j) * 4 + 1] = under[1];
                out[(i * width + j) * 4 + 2] = under[2];
                out[(i * width + j) * 4 + 3] = under[3];
            } else if (d >= end[end.length - 1]) {
                out[(i * width + j) * 4 + 0] = over[0];
                out[(i * width + j) * 4 + 1] = over[1];
                out[(i * width + j) * 4 + 2] = over[2];
                out[(i * width + j) * 4 + 3] = over[3];
            }
        }
    }
    return out;
}

},{}],18:[function(require,module,exports){
'use strict';

var YAxis = new Class({
    initialize: function initialize(el, domain) {
        this.el = el;
        this.domain = domain;
        this.update();
    },

    setDomain: function setDomain(domain) {
        this.domain = domain;
        this.update();
    },

    update: function update() {
        var h = this.el.getSize().y;

        var scale = d3.scale.linear().domain(this.domain).range([0, h]);
        var data = scale.ticks(10);

        var key = function key(d) {
            return d;
        };
        var label = d3.select(this.el).selectAll('.label').data(data, key);
        var tick = d3.select(this.el).selectAll('.tick').data(data, key);

        label.exit().remove();
        tick.exit().remove();

        label.enter().append('div').attr('class', 'label').text(String);

        label.style('bottom', function (d) {
            return scale(d) - this.getSize().y / 2 + 'px';
        });

        tick.enter().append('div').attr('class', 'tick');

        tick.style('bottom', function (d) {
            return scale(d) - 3 + 'px';
        });
    }
});

module.exports = YAxis;

},{}]},{},[16,10,4,12,8,7,2,9,15,3,6,18,5,13,14,1,17,11]);
