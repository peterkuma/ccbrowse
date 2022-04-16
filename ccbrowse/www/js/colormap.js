/*
 * colormap.js - Colormap class (view).
 *
 * The Colormap class is responsible for displaying the colormap.
 */

var Colormap = function(el, colormap) {
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

    var ticks =  document.createElement('div');
    this.el.appendChild(ticks);
    ticks.setStyle('width', '6rem');
    ticks.setStyle('height', height);
    ticks.setStyle('position', 'absolute');
    ticks.setStyle('top', yoffset);
    ticks.setStyle('left', 10);
    this.drawTicks(ticks);
};

Colormap.prototype.drawColors = function(el) {
    var height = el.getSize().y;
    var width = el.getSize().x;
    var self = this;
    var h = height/this.colormap.colors.length;
    var n = 1;
    this.colormap.colors.forEach(function(color) {
        var div = document.createElement('div');
        div.setStyle('position', 'absolute');
        div.setStyle('top', height-n*h);
        div.setStyle('width', width);
        div.setStyle('height', h + 1);
        div.setStyle('background', color);
        el.appendChild(div);
        n++;
    });
};

Colormap.prototype.drawTicks = function(el) {
    var height = el.getSize().y;
    var width = el.getSize().x;
    var min = this.colormap.ticks[0];
    var max = this.colormap.ticks[this.colormap.ticks.length - 1];
    var h = height/this.colormap.colors.length;

    // Reduce the number of ticks to fit height.
    var nticks = 0;
    this.colormap.ticks.forEach(function(range) { nticks += range.steps; });
    var factor = Math.ceil(15/height*nticks);
    if (factor <= 1) factor = 1;

    var self = this;
    var n = 0;
    var ticks = this.colormap.ticks;
    ticks.forEach(function(range) {
        var steps;
        if (range == ticks[ticks.length-1])
            steps = range.steps + 1;
        else
            steps = range.steps;
        for (var i = 0; i < steps; i++, n++) {
            if (n % factor !== 0) continue;
            var v = range.start + (range.end - range.start)*(i/range.steps);
            var y = (self.colormap.colors.length - self.transform(v))*h;
            var tick = document.createElement('div');
            tick.setStyle('height', 1);
            tick.setStyle('width', 10);
            tick.setStyle('background', 'black');
            tick.setStyle('position', 'absolute');
            tick.setStyle('top', y+1);
            el.appendChild(tick);


            var label = document.createElement('div');
            el.appendChild(label);
            label.set('html', scientific(v));
            label.setStyle('position', 'absolute');
            label.setStyle('top', y+1 - label.getSize().y/2);
            label.setStyle('left', 18);
            label.setStyle('color', 'white');
        }
    });
};

Colormap.prototype.transform = function(value) {
    var n = 0;
    var result = null;
    this.colormap.bounds.forEach(function(range) {
        if (value >= range.start && value <= range.end)
            result = n + (value - range.start)/(range.end - range.start) * range.steps;
        n += range.steps;
    });
    return result ? result : 0;
};

export default Colormap;
