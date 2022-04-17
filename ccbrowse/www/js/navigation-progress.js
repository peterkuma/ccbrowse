/*
 * navigation-progress.js - NavigationProgress class (view).
 *
 * The NavigationProgress class is responsible for displaying the navigation
 * progress bar. It depends on the Navigation class to provide the information
 * to display, such as data availability and current position and layer.
 */

var NavigationProgress = new Class({
    initialize: function(el, nav) {
        this.el = d3.select(el);
        this.nav = nav;

        this.el.html('');
        this.indicator = this.el.insert('div').attr('class', 'indicator');
        this.thumb = this.el.insert('div').attr('class', 'thumb');
        this.tooltip = this.el.insert('div').attr('class', 'tooltip');
        this.avail = this.el.insert('div').attr('class', 'availability-container');

        this.update();
        this.nav.on('change', this.update.bind(this));

        new ResizeObserver(this.update.bind(this)).observe(document.querySelector(el));

        this.el.on('mousedown', function(event) {
            this.set(event.clientX/this.el.property('clientWidth'));
            this.el.on('mousemove', function() {
                this.set(event.clientX/this.el.property('clientWidth'));
            }.bind(this));
        }.bind(this));

        this.el.on('mouseup', function() {
            this.el.on('mousemove', null);
        }.bind(this));

        this.el.on('mouseover.tooltip', function(event) {
            this.tooltipAt(event.clientX);
        }.bind(this));

        this.el.on('mousemove.tooltip', function(event) {
             this.tooltipAt(event.clientX);
        }.bind(this));

        this.el.on('mouseout.tooltip', function() {
            this.tooltipAt(null);
        }.bind(this));
    },

    set: function(fraction) {
        var t0 = this.nav.getCurrent();
        var t1 = d3.utcDay(t0);
        t0 = d3.utcSecond.offset(t1, 24*60*60*fraction);
        this.nav.setCurrent(t0);
    },

    update: function() {
        var t0 = this.nav.getCurrent();
        var t1 = d3.utcDay(t0);
        var t2 = d3.utcDay.offset(t1, 1);

        var x = d3.scaleUtc()
            .domain([t1, t2])
            .range([0, this.el.property('clientWidth')]);

        var fraction = (t0-t1)/(t2-t1);

        this.indicator.style('width', x(t0) + 'px');
        this.thumb.style('left', x(t0) + 'px');

        var intervals = this.nav.availableBetween(t1, t2);

        var availability = this.avail.selectAll('.availability')
            .data(intervals, Array);

        availability.exit()
            .remove();

        availability.enter()
            .append('div')
            .attr('class', 'availability');

        this.avail.selectAll('.availability')
            .style('left', function(d) { return x(d[0]) + 'px'; })
            .style('width', function(d) { return x(d[1]) - x(d[0]) + 'px'; });
    },

    tooltipAt: function(x) {
        var fraction = x/this.el.property('clientWidth');
        var t0 = this.nav.getCurrent();
        var t1 = d3.utcDay(t0);
        var t = d3.utcSecond.offset(t1, 24*60*60*fraction);

        this.tooltip.style('display', function() {
            return x === null ? 'none' : 'block';
        });

        this.tooltip
            .style('left', function() {
                return x - this.clientWidth/2 + 'px';
            })
            .text(t.formatUTC('%H:%M'));
    }
});

export default NavigationProgress;
