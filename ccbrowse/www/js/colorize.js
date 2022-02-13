/*
 * colorize.js - Apply colormap on data.
 *
 */

export function colorize(data, width, height, colormap) {
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
