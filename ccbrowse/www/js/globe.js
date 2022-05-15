export default class Globe {
    constructor(el, profile) {
	    this.el = d3.select(el);
	    this._center = [NaN, NaN];

	    this.canvas = this.el.append('canvas')
		    .attr('class', 'canvas');

	    const svg = this.el.append('svg')
		    .style('width', '100%')
		    .style('height', '100%');

	    const defs = svg.append('defs');

	    this.circle = defs.append('circle')
		    .attr('id', 'circle');

	    defs.append('clipPath')
		    .attr('id', 'clip-path')
		    .append('use')
			    .attr('xlink:href', '#circle');

	    const shadow = defs.append('radialGradient')
		    .attr('id', 'shadow')
		    .attr('cx', '45%')
		    .attr('cy', '45%');
	    shadow
		    .append('stop')
			    .attr('offset', '0%')
			    .attr('stop-color', 'rgba(255,255,255,0.1)');
	    shadow
		    .append('stop')
			    .attr('offset', '70%')
			    .attr('stop-color', 'rgba(200,200,200,0.1)');
	    shadow
		    .append('stop')
			    .attr('offset', '100%')
			    .attr('stop-color', 'rgba(0,0,0,0.4)');

	    svg.append('use')
		    .attr('xlink:href', '#circle')
		    .attr('class', 'circle');

	    this.pointer = svg.append('circle')
		    .attr('class', 'pointer')
		    .attr('r', 3)
		    .attr('cx', '50%')
		    .attr('cy', '50%');

	    const g = svg.append('g')
		    .attr('clip-path', 'url(#clip-path)');

	    this.box = g.append('rect')
		    .attr('class', 'box');

        d3.json('/globe/world-50m.json').then(json => {
		    this.world = json;
		    this.update();
	    });
    }

    center(center) {
		if (!arguments.length)
			return this._center;
	    const origCenter = center;
	    this._center = center;
	    this.update();
	    /*
	    this.el.transition()
	        .duration(1000)
	        .tween('globe-rotation', () => {
	            const r = d3.interpolate(this._center, origCenter);
	            return t => {
	                this._center = r(t);
	                this.update();
	            };
	        });*/
	}

	update() {
		if (!this.world) return;

		const width = this.el.property('clientWidth');
		const height = this.el.property('clientHeight');

		this.canvas
			.attr('width', width)
			.attr('height', height);
		const c = this.canvas.node().getContext('2d');

		this.box
			.attr('width', width)
			.attr('height', height)
			.attr('fill', 'url(#shadow)');

		this.circle
			.attr('cx', width/2)
			.attr('cy', height/2)
			.attr('r', d3.min([width/2, height/2]));

        const validCenter =
            isFinite(this._center[0]) &&
            isFinite(this._center[1]);

        const center = validCenter ? this._center : [0, 0];
	    const projection = d3.geoOrthographic()
		    .rotate([-center[0], -center[1]])
		    .scale(width/2)
		    .translate([width/2, height/2])
		    .clipAngle(90);
	    const path = d3.geoPath(projection, c);

        this.pointer.style('visibility', validCenter ? 'visible' : 'hidden');

		c.clearRect(0, 0, width, height);
		c.arc(this.circle.attr('cx'), this.circle.attr('cy'),
		    this.circle.attr('r'), 0, 2*Math.PI);
		c.clip();

		c.fillStyle = 'white';
		c.beginPath();
		path(topojson.feature(this.world, this.world.objects.land));
		c.fill();

		c.strokeStyle = 'black';
		c.lineWidth = 0.3;
		c.beginPath();
		path(topojson.mesh(this.world, this.world.objects.countries,
		    function(a, b) { return a.id !== b.id; }));
		c.stroke();
	}
}
