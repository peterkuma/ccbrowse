/*
 * navigation.js - Navigation class (controller).
 *
 * The Navigation class holds the information about the current position,
 * layer and data availability. Events are fired when the position or layer
 * changes. The class is independent from other classes.
 */


export default class Navigation extends EventEmitter2 {
    constructor(profile) {
        super();
        this.profile = profile;
        this.zoom = 0;
        this.update();
    }

    update() {
        this.emit('change');
    }

    getLayers() { return this.profile.layers; }

    getLayer() { return this.layer; }

    async setLayer(name) {
        this.layer = await this.profile.layer(name);
        this.emit('change');
        this.emit('layerchange');
    }

    getCurrent() {
        return new Date(this.current);
    }

    setCurrent(date) {
        this.current = date;
        this.emit('change');
    }

    getZoom() {
        return this.zoom;
    }

    setZoom(zoom) {
        this.zoom = zoom;
        this.emit('change');
    }

    getMaxZoom() {
        var i = 0;
        while (this.profile.zoom[i.toString()])
            i++;
        return i-1;
    }

    getAvailability() {
        if (!this.layer || !this.layer.availability || !this.layer.availability[this.zoom])
            return [];
        return this.layer.availability[this.zoom];
    }

    isAvailable(start, end) {
        var availability = this.getAvailability()

        var x1  = (start - this.profile.origin[0])/this.profile.zoom[this.zoom].width;
        var x2  = (end - this.profile.origin[0])/this.profile.zoom[this.zoom].width;

        for (var i = 0; i < availability.length; i++) {
            var range = availability[i];
            if (range[0] >= x1 && range[0] <= x2) return true;
            if (range[1] >= x1 && range[1] <= x2) return true;
            if (range[0] <= x1 && range[1] >= x2) return true;
        }
        return false;
    }

    isAvailableYear(year) {
        return this.isAvailable(new UTCDate(year, 0, 1),
                                new UTCDate(year, 0, 1).increment('year', 1));
    }

    isAvailableMonth(year, month) {
        return this.isAvailable(new UTCDate(year, month, 1),
                                new UTCDate(year, month, 1).increment('month', 1));
    }

    isAvailableDay(year, month, day) {
        return this.isAvailable(new UTCDate(year, month, day),
                                new UTCDate(year, month, day).increment('day', 1));
    }

    availableBetween(start, end) {
        if (!this.layer || !this.layer.availability || typeof this.layer.availability == 'string' || !this.layer.availability[this.zoom])
            return [];
        var availability = this.layer.availability[this.zoom];

        var x1  = (start - this.profile.origin[0])/this.profile.zoom[this.zoom].width;
        var x2  = (end - this.profile.origin[0])/this.profile.zoom[this.zoom].width;

        var intervals = [];
        for (var i = 0; i < availability.length; i++) {
            var range = availability[i];

            var date1 = (new Date(this.profile.origin[0])).increment('ms', range[0]*this.profile.zoom[this.zoom].width);
            var date2 = (new Date(this.profile.origin[0])).increment('ms', range[1]*this.profile.zoom[this.zoom].width);

            if (range[0] <= x1 && range[1] >= x2) intervals.push([start, end]);
            if (range[0] >= x1 && range[1] <= x2) intervals.push([date1, date2]);
            if (range[0] <= x1 && range[1] >= x1) intervals.push([start, date2]);
            if (range[0] <= x2 && range[1] >= x2) intervals.push([date1, end]);
        }
        return intervals;
    }
}
