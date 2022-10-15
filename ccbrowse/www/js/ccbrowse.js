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
import LayerControl from './layer-control.js';
import Colormap from './colormap.js';
import Tooltip from './tooltip.js';
import Profile from './profile.js';


export class Application {
    constructor(profileUrl) {
        this.profileUrl = profileUrl;
    }

    async start() {
        this.error = document.querySelector('.error');
        this.note = document.querySelector('.note');

        // Initialize toolbox.
        document.querySelectorAll('#toolbox a').forEach(link => {
            link.onclick = evt => {
                window.history.pushState({}, '', link.href);
                this.route();
                evt.preventDefault();
            };
        });

        try {
            let profileSource = await (await fetch(this.profileUrl)).json();
            this.profile = new Profile(profileSource);
        } catch(err) {
            if (err instanceof SyntaxError) {
                this.showError('Invalid profile specification', true);
            } else {
                this.showError('Profile specification is not available', true);
                console.log(err);
            }
            return;
        }

        this.nav = new Navigation(this.profile);
        this.nav.setLayer('calipso532');
        this.nav.setZoom(2);
        this.nav.setCurrent(this.profile.origin[0]);

        window.addEventListener('hashchange', () => this.onHashChange());
        this.nav.on('change', () => this.onNavChange());

        this.nav.on('layerchange', function() {
            var layer = this.nav.getLayer();
            if (layer.colormap.colors)
                this.colormap = new Colormap($('colormap'), this.nav.getLayer().colormap);
            if (this.nav.getCurrent() - this.profile.origin[0] == 0)
            {
                this.nav.setCurrent(this.smartCurrent(this.nav.getAvailability()));
            }
        }.bind(this));

        new ResizeObserver(function() {
            if (this.nav.getLayer()) {
                this.colormap = new Colormap($('colormap'), this.nav.getLayer().colormap);
            }
        }.bind(this)).observe($('colormap'));

        var layerControl = new LayerControl($('layer-control'), this.nav);
        this.navPanel = new NavigationPanel('nav .panel', this.nav);
        this.navProgress = new NavigationProgress('nav .progress', this.nav);
        this.map = new Map($('map'), this.nav, this);
        this.map.on('error', this.onError.bind(this));
        $('map').focus();

        // Add tooltips.
        Array.prototype.forEach.call(document.querySelectorAll('[title]'), function(e) {
            new Tooltip(e);
        });

        this.showNote('Double-tap to read off values');

        this.onHashChange();
    }

    onHashChange() {
        if (this.ignoreHashChange) {
            this.ignoreHashChange = false;
            return;
        }
        if (window.location.hash === '') return;
        const date_s = window.location.hash.substring(1);
        const date = d3.utcParse('%Y-%m-%dT%H:%M:%S')(date_s);
        if (date === null) return;
        this.nav.setCurrent(date);
        this.route();
    }

    onNavChange() {
        const date = this.nav.getCurrent();
        const hash = '#'+d3.utcFormat('%Y-%m-%dT%H:%M:%S')(date);
        if (window.location.hash === hash) return;
        this.ignoreHashChange = true;
        window.location.replace(hash);
        const date_s = d3.utcFormat('%e %b %Y %H:%M:%S')(this.nav.getCurrent());
        document.title = date_s + ' ‧ ccbrowse';
        this.route();
    }

    smartCurrent(availability) {
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
        return d3.utcMillisecond.offset(date, (upper+lower)*0.5*width);
    }

    context(name) {
        document.querySelectorAll('.context')
            .forEach(e => e.style.display = 'none');
        document.querySelector('.context.'+name).style.display = 'flex';
    }

    async page(path) {
        const page = document.querySelector('.page');
        const response = await fetch(path);
        page.innerHTML = await response.text();
        this.context('page');
    }

    route() {
        if (document.location.hash == '#about')
            this.page('/about.html');
        else {
            this.context('map');
        }
    }

    onError(evt) {
        this.showError(evt.message, evt.nohide);
    }

    showError(message, nohide) {
        console.log(message);
        this.error.innerHTML = message;
        this.error.classList.remove('collapsed');
        if (!nohide) {
            window.setTimeout(function() {
                this.error.classList.add('collapsed');
                this.note.classList.remove('hold');
            }.bind(this), 5000);
        }
        this.note.classList.add('hold');
    }

    clearError() {
        this.error.classList.add('collapsed');
        this.note.classList.remove('hold');
    }

    showNote(message) {
        this.note.innerHTML = message;
        this.note.classList.remove('collapsed');
        window.setTimeout(function() {
            this.note.classList.add('collapsed');
        }.bind(this), 5000);
        if (!this.error.classList.contains('collapsed'))
            this.note.classList.add('hold');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    let app = new Application('profile.json');
    app.start();
});
