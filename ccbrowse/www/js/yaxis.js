export default class YAxis {
    constructor(el, domain) {
        this.el = el;
        this.domain = domain;
        this.update();
    }

    setDomain(domain) {
        this.domain = domain;
        this.update();
    }

    update() {
        var h = this.el.clientHeight;

        var scale = d3.scaleLinear().domain(this.domain).range([0, h]);
        var data = scale.ticks(10);

        var key = function(d) { return d; }
        var label = d3.select(this.el).selectAll('.label').data(data, key);
        var tick = d3.select(this.el).selectAll('.tick').data(data, key);

        label.exit().remove();
        tick.exit().remove();

        label.enter()
            .append('div')
            .attr('class', 'label')
            .text(String);

        label.style('bottom', function(d) {
            return (scale(d) - this.clientHeight/2) + 'px';
        });

        tick.enter()
            .append('div')
            .attr('class', 'tick');

        tick.style('bottom', function(d) {
            return (scale(d) - 3) + 'px';
        });
    }
}
