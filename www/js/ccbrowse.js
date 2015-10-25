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


import Map from './map.js';
import Navigation from './navigation.js';
import NavigationPanel from './navigation-panel.js';
import NavigationProgress from './navigation-progress.js';
import LocationBar from './location-bar.js';
import LayerControl from './layer-control.js';
import Colormap from './colormap.js';
import Tooltip from './tooltip.js';


var CCBrowse = new Class({
    initialize: function(url) {
        this.error = document.querySelector('.error');
        this.note = document.querySelector('.note');

        window.addEventListener('popstate', this.route.bind(this));

        // Initialize toolbox.
        $$('#toolbox a').each(function(link) {
            link.onclick = function(evt) {
                window.history.pushState({}, '', link.href);
                this.route();
                evt.preventDefault();
            }.bind(this);
        }.bind(this));

        // Fetch profile specification and call init().
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState != 4) return;
            if (xhr.status != 200) {
                this.showError('Profile specification is not available', true);
                return;
            }
            var json;
            try {
                json = JSON.parse(xhr.responseText);
            } catch(e) {
                this.showError('Invalid profile specification', true);
            }
            this.init(json);
        }.bind(this);
        xhr.open('GET', url);
        xhr.send();
    },

    init: function(json) {
        this.profile = json;
        this.profile.origin[0] = new Date.parse(this.profile.origin[0] + ' +0000');

        if (this.profile.prefix !== '' &&
            this.profie.prefix[this.profile.prefix.length - 1] !== '/'
        ) {
            this.profile.prefix = this.profile.prefix + '/';
        }

        console.log(this.profile.prefix);

        this.nav = new Navigation(this.profile);
        this.nav.setLayer('calipso532');
        this.nav.setZoom(2);
        this.nav.setCurrent(this.profile.origin[0]);

        this.nav.on('change', function() {
            window.history.pushState({}, '', document.location.hash);
            document.title = this.nav.getCurrent().formatUTC('%e %b %Y %H:%M') + ' ‧ ccbrowse';
            this.route();
        }.bind(this));

        this.nav.on('layerchange', function() {
            var layer = this.nav.getLayer();
            if (layer.colormap.colors)
                this.colormap = new Colormap($('colormap'), this.nav.getLayer().colormap);
            if (this.nav.getCurrent().diff(this.profile.origin[0], 'ms') == 0)
            {
                this.nav.setCurrent(this.smartCurrent(this.nav.getAvailability()));
            }
        }.bind(this));

        window.addEventListener('resize', function() {
            this.colormap = new Colormap($('colormap'), this.nav.getLayer().colormap);
        }.bind(this));

        var layerControl = new LayerControl($('layer-control'), this.nav);
        this.navPanel = new NavigationPanel('nav .panel', this.nav);
        this.navProgress = new NavigationProgress('nav .progress', this.nav);
        this.map = new Map($('map'), this.nav, this);
        this.map.on('error', this.onError.bind(this));
        $('map').focus();

        this.locationBar = new LocationBar($('location-bar'), this.map.map, this.profile);

        // Add tooltips.
        Array.prototype.forEach.call(document.querySelectorAll('[title]'), function(e) {
            new Tooltip(e);
        });

        this.showNote('Double-click to read off values');
    },

    smartCurrent: function(availability) {
        var latest = null;
        var max = 0;
        Array.prototype.forEach.call(availability, function(range) {
            if (range[1] > max) {
                max = range[1];
                latest = range;
            }
        });
        if (!latest) return this.profile.origin[0];
        var width = this.profile.zoom[this.nav.getZoom()].width;
        var hour = 3600*1000/width;
        var lower = Math.max(latest[0], latest[1] - hour);
        var upper = latest[1];
        var date = new Date(this.profile.origin[0]);
        return date.increment('ms', (upper+lower)*0.5*width);
    },

    context: function(name) {
        $$('.context').setStyle('display', 'none');
        $$('.context.'+name).setStyle('display', 'block');
    },

    page: function(path) {
        var page = document.querySelector('.page');
        page.set('load', {
            onSuccess: function() { this.context('page'); }.bind(this)
        });
        page.load(path);
    },

    route: function() {
        if (document.location.pathname == '/about/')
            this.page('/about.html');
        else
            this.context('map');
    },

    onError: function(evt) {
        this.showError(evt.message, evt.nohide);
    },

    showError: function(message, nohide) {
        console.log(message);
        this.error.set('html', message);
        this.error.removeClass('collapsed');
        if (!nohide) {
            window.setTimeout(function() {
                this.error.addClass('collapsed');
                this.note.removeClass('hold');
            }.bind(this), 5000);
        }
        this.note.addClass('hold');
    },

    clearError: function() {
        this.error.addClass('collapsed');
        this.note.removeClass('hold');
    },

    showNote: function(message) {
        this.note.set('html', message);
        this.note.removeClass('collapsed');
        window.setTimeout(function() {
            this.note.addClass('collapsed');
        }.bind(this), 5000);
        if (!this.error.hasClass('collapsed'))
            this.note.addClass('hold');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    var ccbrowse = new CCBrowse('profile.json');
});
