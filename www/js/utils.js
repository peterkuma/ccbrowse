/*
 * utils.js - Utility functions.
 *
 * Utility functions used throughout the project.
 */

var $ = function(id) { return document.getElementById(id); };

function hex2rgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function scientific(v, precision) {
    if (typeof precision == 'undefined') precision = 1;
    if (v == 0 || Math.abs(v) >= 0.1 && Math.abs(v) < 10000)
        return v.toFixed(precision);
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
            color = colormap.colors[Math.floor(m + (v - range.start)/(range.end - range.start)*range.steps)];
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
    formatUTC: function(format) {
        var date = new Date(this.getUTCFullYear(),
                            this.getUTCMonth(),
                            this.getUTCDate(),
                            this.getUTCHours(),
                            this.getUTCMinutes(),
                            this.getUTCSeconds());
        return date.format(format);
    }
});

Date.defineParser('%Y(-%b(-%d(,%H:%M(:%S)?)?)?)?( %z)?');

var UTCDate = function(year, month, day, hour, minute, second, millisecond) {
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
