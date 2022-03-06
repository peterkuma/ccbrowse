/*
 * projection.js - Custom Leaflet projection.
 *
 * The L.CRS.Custom class provides projection of time/height coordinates
 * to pixel coordiates for a leaflet map.
 */

L.Projection.Custom = {
    project: function (latlng) {
        return new L.Point(latlng.lng, latlng.lat);
    },

    unproject: function (point, unbounded) {
        return new L.LatLng(point.y, point.x, true);
    },

    bounds: new L.bounds([-Infinity, Infinity], [-Infinity, Infinity])
};

L.CRS.Custom = function(profile) {
    var transformation = new L.Transformation(
        1/profile.zoom[0].width, 0,
        -1/profile.zoom[0].height, 0
    );
    var scale = function(zoom) {
        return 256*profile.zoom[0].width/profile.zoom[zoom].width;
    };
    return L.Util.extend({}, L.CRS, {
        code: 'EPSG:0000',
        projection: L.Projection.Custom,
        transformation: transformation,
        scale: scale,
        wrapLng: undefined,
        wrapLat: undefined,
        infinite: true
    });
};
