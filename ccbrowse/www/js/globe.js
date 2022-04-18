export default function Globe(el, profile) {
	el = d3.select(el);
	var center = [0, 0];

	var canvas = el.append('canvas')
		.attr('class', 'canvas');

	var svg = el.append('svg')
		.style('width', '100%')
		.style('height', '100%');

	var defs = svg.append('defs');

	var circle = defs.append('circle')
		.attr('id', 'circle');

	defs.append('clipPath')
		.attr('id', 'clip-path')
		.append('use')
			.attr('xlink:href', '#circle');

	var shadow = defs.append('radialGradient')
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

	var pointer = svg.append('circle')
		.attr('class', 'pointer')
		.attr('r', 3)
		.attr('cx', '50%')
		.attr('cy', '50%');

	var g = svg.append('g')
		.attr('clip-path', 'url(#clip-path)');

	var box = g.append('rect')
		.attr('class', 'box');

	var world;
    d3.json('/globe/world-50m.json').then(json => {
		world = json;
		update();
	});

	var exports = {};

	exports.center = function(point) {
		if (!arguments.length)
			return center;
		center = point;
		return update();
	};

	function update() {
		if (!world) return exports;

		var width = el.property('clientWidth');
		var height = el.property('clientHeight');

		canvas
			.attr('width', width)
			.attr('height', height);
		var c = canvas.node().getContext('2d');

		box
			.attr('width', width)
			.attr('height', height)
			.attr('fill', 'url(#shadow)');

		circle
			.attr('cx', width/2)
			.attr('cy', height/2)
			.attr('r', d3.min([width/2, height/2]));

		var projection = d3.geoOrthographic()
			.rotate([-center[0], -center[1]])
			.scale(width/2)
			.translate([width/2, height/2])
			.clipAngle(90);

		var path = d3.geoPath(projection, c);

		c.clearRect(0, 0, width, height);
		c.arc(circle.attr('cx'), circle.attr('cy'), circle.attr('r'), 0, 2*Math.PI);
		c.clip();

		c.fillStyle = 'white';
		c.beginPath();
		path(topojson.feature(world, world.objects.land));
		c.fill();

		c.strokeStyle = 'black';
		c.lineWidth = 0.3;
		c.beginPath();
		path(topojson.mesh(world, world.objects.countries, function(a, b) { return a.id !== b.id; }));
		c.stroke();

		return exports;
	}

	return update();
}
