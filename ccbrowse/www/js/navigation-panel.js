/*
 * navigation-panel.js - NavigationPanel class (view).
 *
 * The NavigationPanel class is responsible for displaying the navigation bar
 * panel. It depends on the Navigation class to provide the information to
 * display, such as data availability and current position and layer.
 */


import Tooltip from './tooltip.js';


var NavigationPanel = new Class({
    initialize: function(el, nav) {
        this.el = d3.select(el);
        this.nav = nav;

        this.el.html('');
        this.years = this.el.insert('div').attr('class', 'years');
        this.days = this.el.insert('div').attr('class', 'days');

        this.update();
        this.nav.on('change', this.update.bind(this));
    },

    update: function(expandedYear) {
        var t1 = this.nav.profile.origin[0];
        var t2 = new Date();
        var t0 = this.nav.getCurrent();

        //var smooth = typeof(expandedYear) != 'undefined';
        expandedYear = expandedYear || t0.getUTCFullYear();

        var years = d3.utcYear.range(t1, t2).filter(function(d) {
            return this.nav.isAvailableYear(d.getUTCFullYear());
        }.bind(this));

        var nextMonth = d3.utcMonth.offset(d3.utcMonth(t0), 1);
        var dayStop = nextMonth < t2 ? nextMonth : t2;
        var days = d3.utcDay.range(
            d3.utcMonth(t0),
            dayStop
        );

        var yearGroup = this.years.selectAll('.year-group')
            .data(years);

        yearGroup.enter()
            .append('div')
            .attr('class', 'year-group')
            .insert('div')
                .attr('class', 'year')
                .text(function(d) { return d.getUTCFullYear(); })
                .each(function() { new Tooltip(this); });
        yearGroup = this.years.selectAll('.year-group');

        var year = yearGroup.selectAll('.year');

        year
            .classed('disabled', function(d) {
                return !this.nav.isAvailableYear(d.getUTCFullYear());
            }.bind(this))
            .property('onclick', function(d) {
                return (function() {
                    this.update(d.getUTCFullYear());
                }.bind(this));
            }.bind(this))
            .attr('title', '')
            .filter('.disabled')
                .property('onclick', 'return false;')
                .attr('title', 'Unavailable');

        var months = yearGroup.selectAll('.months')
            .data(function(d) {
                return d.getUTCFullYear() == expandedYear ? [d] : [];
            });

        var monthsEnter = months.enter()
            .append('div')
            .attr('class', 'months');

        months.exit()
            .transition()
            .ease(d3.easeCubicInOut)
            .duration(250)
            .style('width', '0px')
            .style('opacity', 0)
            .remove();

        months = this.years.selectAll('.year-group').selectAll('.months');

        var month = months.selectAll('.month')
            .data(function(d) {
                var next = d3.utcYear.offset(d, 1);
                var stop = next < t2 ? next : t2;
                return d3.utcMonth.range(d, stop);
            });

        month.enter()
            .append('a')
            .attr('class', 'month')
            .text(function(d) { return d.formatUTC('%b'); })
            .each(function() { new Tooltip(this); });

        months.selectAll('.month')
            .classed('selected', function(d) {
                return t0.getUTCFullYear() == d.getUTCFullYear() &&
                       t0.getUTCMonth() == d.getUTCMonth();
            })
            .classed('disabled', function(d) {
                return !this.nav.isAvailableMonth(
                    d.getUTCFullYear(),
                    d.getUTCMonth()
                );
            }.bind(this))
            .attr('href', function(d) { return d.formatUTC('#%Y-%b'); })
            .attr('onclick', '')
            .attr('title', '')
            .filter('.disabled')
                .attr('onclick', 'return false;')
                .attr('title', 'Unavailable');

        monthsEnter
            .property('__width__', function() {
                return this.clientWidth;
            })
            .style('width', '0px')
            .transition()
            .duration(250)
            .ease(d3.easeCubicInOut)
            .style('opacity', 1)
            .style('width', function() {
                return this.__width__ + 'px';
            })
            .on('end', function() { d3.select(this).style('width', 'auto'); });

        var day = this.days.selectAll('.day').data(days);

        day.enter()
            .append('a')
            .attr('class', 'day')
            .text(function(d) { return d.getUTCDate(); })
            .each(function() { new Tooltip(this); });

        day.exit()
            .remove();

        day
            .classed('selected', function(d) {
                return t0.getUTCDate() == d.getUTCDate();
            })
            .classed('disabled', function(d) {
                return !this.nav.isAvailableDay(
                    d.getUTCFullYear(),
                    d.getUTCMonth(),
                    d.getUTCDate()
                );
            }.bind(this))
            .attr('href', function(d) { return d.formatUTC('#%Y-%b-%d'); })
            .attr('onclick', '')
            .attr('title', '')
            .filter('.disabled')
                .attr('onclick', 'return false;')
                .attr('title', 'Unavailable');
    }
});

export default NavigationPanel;
