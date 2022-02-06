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

function hexToRgba(hex) {
    if (hex[0] === '#')
        hex = hex.slice(1);
    x = parseInt(hex, 16);
    var rgba = new Uint8Array(4);
    if (hex.length <= 6)
        x = x << 8 | 0xff;
    rgba[0] = x >> 24;
    rgba[1] = x >> 16;
    rgba[2] = x >> 8;
    rgba[3] = x;
    return rgba;
}

function cumsum(u) {
    var s = 0;
    return u.map(function(x) {
        return s += x;
    });
}

function pngunpack(data) {
    var u32 = new Uint32Array(data.buffer);
    var u8 = new Uint8Array(data.length/4);
    u8.set(u32);
    var f32 = new Float32Array(u8.buffer);
    return f32;
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

function loadImageData(src, cb) {
    var img = document.createElement('img');
    img.onload = function() {
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
    loadImageData(src, function(rawData, width, height) {
        var data = pngunpack(rawData);
        var pixelData = colorize(data, width/4|0, height, colormap);
        var ctx = canvas.getContext('2d');
        var imgData = new ImageData(pixelData, width/4|0, height);
        canvas.width = width/4|0;
        canvas.height = height;
        ctx.putImageData(imgData, 0, 0);
        if (canvas !== undefined)
            cb(canvas);
    });
}

function colorize(data, width, height, colormap) {
    var i, j, k;
    var d;
    var n = colormap.bounds.length;
    var out = new Uint8ClampedArray(width*height*4);
    var missing = new Uint8ClampedArray(4);
    var over = new Uint8ClampedArray(4);
    var under = new Uint8ClampedArray(4);

    if (colormap.missing)
        missing = hexToRgba(colormap.missing);

    if (colormap.under)
        under = hexToRgba(colormap.under);

    if (colormap.over)
        over = hexToRgba(colormap.over);

    var colors0 = colormap.colors.map(hexToRgba);

    var colors = new Uint8ClampedArray(colormap.colors.length*4);
    colors.set(colors.map(function(x, i) {
        return colors0[i/4|0][i % 4];
    }));

    var start = new Float32Array(colormap.bounds.map(function(x) {
        return x.start;
    }));

    var end = new Float32Array(colormap.bounds.map(function(x) {
        return x.end;
    }));

    var diff = new Float32Array(colormap.bounds.map(function(x) {
        return (x.end - x.start)/x.steps;
    }));

    var steps = new Float32Array(colormap.bounds.map(function(x) {
        return x.steps;
    }));

    var cindex = new Float32Array(n + 1);
    cindex.set(cumsum(steps), 1);

    for (i = 0; i < width; i++) {
        for (j = 0; j < height; j++) {
            for (k = 0; k < n; k++) {
                d = data[i*width + j];
                if (d >= start[k] && d < end[k]) {
                    var l = (cindex[k] + (d - start[k])/diff[k])|0;
                    out[(i*width + j)*4 + 0] = colors[l*4 + 0];
                    out[(i*width + j)*4 + 1] = colors[l*4 + 1];
                    out[(i*width + j)*4 + 2] = colors[l*4 + 2];
                    out[(i*width + j)*4 + 3] = colors[l*4 + 3];
                }
            }
        }
    }

    for (i = 0; i < width; i++) {
        for (j = 0; j < height; j++) {
            d = data[i*width + j];
            if (isNaN(d)) {
                out[(i*width + j)*4 + 0] = missing[0];
                out[(i*width + j)*4 + 1] = missing[1];
                out[(i*width + j)*4 + 2] = missing[2];
                out[(i*width + j)*4 + 3] = missing[3];
            } else if (d < start[0]) {
                out[(i*width + j)*4 + 0] = under[0];
                out[(i*width + j)*4 + 1] = under[1];
                out[(i*width + j)*4 + 2] = under[2];
                out[(i*width + j)*4 + 3] = under[3];
            } else if (d >= end[end.length - 1]) {
                out[(i*width + j)*4 + 0] = over[0];
                out[(i*width + j)*4 + 1] = over[1];
                out[(i*width + j)*4 + 2] = over[2];
                out[(i*width + j)*4 + 3] = over[3];
            }
        }
    }
    return out;
}
