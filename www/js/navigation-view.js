/*
 * navigation-view.js - NavigationView class (view).
 *
 * The NavigationView class is responsible for displaying the navigation bar.
 * It depends on the Navigation class to provide the information to display,
 * such as data availability and current position and layer.
 */

var NavigationView = new Class({
    initialize: function(el, nav) {
        this.el = el;
        this.nav = nav;
        
        this.monthSlider = this.el.querySelector('.nav-month-slider');
        this.daySlider = this.el.querySelector('.nav-day-slider');
        this.progress = this.el.querySelector('.nav-progress');
        this.availability = this.el.querySelector('.nav-availability');
        this.progressed = this.el.querySelector('.nav-progressed');
        this.thumb = this.el.querySelector('.nav-thumb');
        this.pointer = this.el.querySelector('.nav-pointer');
        
        this.initProgress();
        this.initMonthSlider(this.nav.profile.origin[0], new Date());
        this.initDaySlider();
        
        this.nav.on('change', this.update.bind(this));
    },
    
    initProgress: function() {
        var update = function(evt) {
            var value = evt.clientX/this.progress.getSize().x;
            var current = this.nav.getCurrent();
            var date = new Date(current);
            date.setUTCHours(Math.floor(value*24));
            date.setUTCMinutes(Math.floor((value*24*60 % 60)));
            date.setUTCSeconds(Math.floor((value*24*60*60 % 60)));
            this.nav.setCurrent(date);
        }.bind(this);
        
        this.progress.addEventListener('mousedown', function(evt) {
            update(evt);
            window.addEventListener('mousemove', update);
            evt.preventDefault();
            document.body.setStyle('cursor', 'move');
        });
        
        window.addEventListener('mouseup', function() {
            document.body.setStyle('cursor', 'auto');
            window.removeEventListener('mousemove', update);
        });
        
        this.progress.addEventListener('mousemove', function(evt) {
            var y = this.nav.getCurrent().getUTCFullYear();
            var m = this.nav.getCurrent().getUTCMonth();
            var d = this.nav.getCurrent().getUTCDate();
            var date = new UTCDate(y, m, d);
            date.increment('second', evt.clientX/this.progress.getSize().x*24*60*60);
            this.pointer.title = date.formatUTC('%H:%M');
            this.pointer.setStyle('left', evt.clientX); 
        }.bind(this), true);
        
        this.updateProgress();
    },
    
    update: function() {
        var now = new Date();
        this.updateMonthSlider(this.nav.profile.origin[0], now, this.nav.getCurrent());
        this.updateDaySlider(this.nav.profile.origin[0], now, this.nav.getCurrent());    
        this.updateProgress();
    },
    
    initMonthSlider: function(from, to) {
        var y1 = from.getUTCFullYear();
        var y2 = to.getUTCFullYear();
        
        var w = 0;
        
        for (var y = y1; y <= y2; y++) {
            label = document.createElement('div');
            label.addClass('nav-year');
            label.set('text', y);
            label.store('year', y);
            new Tooltip(label);
            this.monthSlider.appendChild(label);
            
            var months = document.createElement('div');
            months.addClass('nav-months');
            this.monthSlider.appendChild(months);
            
            var container = document.createElement('div');
            months.appendChild(container);
            
            for (var m = y == y1 ? from.getUTCMonth() : 0; m < 12; m++) {
                label = document.createElement('a');
                label.addClass('nav-label');
                label.addClass('nav-month');
                label.href = new Date(y, m).format('#%Y-%b');
                label.set('text', new Date(y, m).format('%b'));
                label.store('year', y);
                label.store('month', m);
                new Tooltip(label);
                container.appendChild(label);
            }
            var w = months.getSize().x;
            months.setStyle('width', 0);
            container.setStyle('width', 10000);
        }
        
        this.accordion = new Fx.Accordion($$('.nav-year'), $$('.nav-months'), {
            display: -1,
            opacity: false,
            alwaysHide: true,
            height: false,
            onActive: function(toggler, el) {
                el.tween('width', w);
            },
            onBackground: function(toggler, el) {
                el.tween('width', 0);
            }
        });
        
        this.updateMonthSlider();
    },
    
    initDaySlider: function() {
        for (var d = 1; d <= 31; d++) {
            label = document.createElement('a');
            label.addClass('nav-label');
            label.addClass('nav-day');
            label.set('text', d);
            label.store('day', d);
            new Tooltip(label);
            this.daySlider.appendChild(label);
        }
        
        this.updateDaySlider();
    },
    
    updateMonthSlider: function() {
        var year = this.nav.getCurrent().getUTCFullYear();
        var month = this.nav.getCurrent().getUTCMonth();
        
        var i = 0;
        this.monthSlider.getElements('.nav-year').each(function(e) {
            var y = e.retrieve('year').toInt();
            
            if (!this.nav.isAvailableYear(y)) {
                e.addClass('nav-unavailable');
                e.title = 'Not available';
            } else {
                e.removeClass('nav-unavailable');
                e.title = '';
            }
                
            if (e.get('text') == year.toString())
                this.accordion.display(i);
            i++;
        }.bind(this));
        
        this.monthSlider.getElements('.nav-month').each(function(e) {
            var y = e.retrieve('year').toInt();
            var m = e.retrieve('month').toInt();
            
            if (!this.nav.isAvailableMonth(y, m )) {
                e.addClass('nav-unavailable');
                e.title = 'Not available';
            } else {
                e.removeClass('nav-unavailable');
                e.title = '';
            }
            
            if (e.retrieve('year') == year.toString() &&
                e.retrieve('month') == month.toString())
            {    
                e.addClass('nav-active');
            } else {
                e.removeClass('nav-active');
            }
        }.bind(this));
    },
    
    updateDaySlider: function(from, to, current) {
        var y = this.nav.getCurrent().getUTCFullYear();
        var m = this.nav.getCurrent().getUTCMonth();
        var day = this.nav.getCurrent().getUTCDate();
        
        this.daySlider.getElements('.nav-day').each(function(e) {
            var d = e.retrieve('day').toInt();
            
            if (!this.nav.isAvailableDay(y, m, d)) {
                e.addClass('nav-unavailable');
                e.title = 'Not available';
            } else {
                e.removeClass('nav-unavailable');
                e.title = '';
            }
            
            e.href = new Date(y, m, d).format('#%Y-%b-%d');
            
            if (d == day)
                e.addClass('nav-active');
            else
                e.removeClass('nav-active');
            
            if (d > new Date(y, m).getLastDayOfMonth())
                e.setStyle('display', 'none');
            else
                e.setStyle('display', 'block');
        }.bind(this));
    },

    updateProgress: function() {
        var date = this.nav.getCurrent();
        var value = date.getUTCHours()*60*60 +
                    date.getUTCMinutes()*60 +
                    date.getUTCSeconds();
        value /= 24*60*60;
        this.progressed.setStyle('width', value*100 + '%');
        this.thumb.setStyle('left', value*100 + '%');
        
        var y = this.nav.getCurrent().getUTCFullYear();
        var m = this.nav.getCurrent().getUTCMonth();
        var d = this.nav.getCurrent().getUTCDate();    
        var start = new UTCDate(y, m, d);
        var end = new UTCDate(y, m, d).increment('day', 1);
        var intervals = this.nav.availableBetween(start, end);
        
        this.availability.innerHTML = '';
        intervals.forEach(function(interval) {
            var box = document.createElement('div');
            box.setStyle('left', 100*(interval[0]-start)/(24*60*60*1000) + '%');
            box.setStyle('width', 100*(interval[1]-interval[0])/(24*60*60*1000) + '%');
            this.availability.appendChild(box);
        }.bind(this));
        
        this.thumb.title = this.nav.getCurrent().formatUTC('%H:%M');
        if (this.thumb.tooltip) this.thumb.tooltip.update();
    }
});
