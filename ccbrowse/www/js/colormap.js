/*
 * colormap.js - Colormap class (view).
 *
 * The Colormap class is responsible for displaying the colormap.
 */

var Colormap = function(el, colormap) {
    this.el = typeof el == 'string' ? $(el) : el;
    this.colormap = colormap;

    this.el.innerHTML = '';

    var height = this.el.clientHeight;
    var yoffset = 0;

    if (this.colormap.over) {
        var over = document.createElement('div');
        over.classList.add('colormap-over');
        over.style.position = 'absolute';
        over.style.top = '0';
        over.style.left = '0';
        over.style.backgroundColor = this.colormap.over;
        this.el.appendChild(over);
        height -= over.clientHeight;
        yoffset += over.clientHeight;
    }

    if (this.colormap.under) {
        var under = document.createElement('div');
        under.classList.add('colormap-under');
        this.el.appendChild(under);
        height -= under.clientHeight;
        under.style.position = 'absolute';
        under.style.top = (yoffset + height) + 'px';
        under.style.left = '0';
        under.style.backgroundColor = this.colormap.under;
    }

    var colors = document.createElement('div');
    this.el.appendChild(colors);
    colors.style.position = 'absolute';
    colors.style.width = '20px';
    colors.style.top = yoffset + 'px';
    colors.style.left = '0';
    colors.style.height = height + 'px';
    this.drawColors(colors);

    var ticks =  document.createElement('div');
    this.el.appendChild(ticks);
    ticks.style.width = '6rem';
    ticks.style.height = height + 'px';
    ticks.style.position = 'absolute';
    ticks.style.top = yoffset + 'px';
    ticks.style.left = '10px';
    this.drawTicks(ticks);
};

Colormap.prototype.drawColors = function(el) {
    var height = el.clientHeight;
    var width = el.clientWidth;
    var self = this;
    var h = height/this.colormap.colors.length;
    var n = 1;
    this.colormap.colors.forEach(function(color) {
        var div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.top = (height-n*h) + 'px';
        div.style.width = width + 'px';
        div.style.height = (h + 1) + 'px';
        div.style.backgroundColor = color;
        el.appendChild(div);
        n++;
    });
};

Colormap.prototype.drawTicks = function(el) {
    var height = el.clientHeight;
    var width = el.clientWidth;
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
            tick.style.height = '1px';
            tick.style.width = '10px';
            tick.style.backgroundColor = 'black';
            tick.style.position = 'absolute';
            tick.style.top = (y+1) + 'px';
            el.appendChild(tick);


            var label = document.createElement('div');
            el.appendChild(label);
            label.innerHTML = scientific(v);
            label.style.position = 'absolute';
            label.style.top = (y+1 - label.clientHeight/2) + 'px';
            label.style.left = '18px';
            label.style.color = 'white';
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
