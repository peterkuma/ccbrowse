

export default class Geocoding extends EventEmitter2 {
    constructor(profile) {
        super();
        this.profile = profile;
        this._zoom = 0;
        this._range = [0, 0];
        this._latitude = {};
        this._longitude = {};
        this._geocoding = {};
    }

    transform(t) {
        return Math.floor(t/this.profile.zoom[this._zoom].width);
    }

    zoom(zoom) {
        if (arguments.length === 0) return this._zoom;
        this._zoom = zoom;
        return this;
    }

    range(range) {
        if (arguments.length === 0) return this._range;
        this._range = range;
        this.update();
        return this;
    }

    update() {
        this.updateLayer(this.profile.layers.latitude, this._latitude);
        this.updateLayer(this.profile.layers.longitude, this._longitude);
        this.updateLayer(this.profile.layers.geocoding, this._geocoding);
    }

    updateLayer(layer, tiles) {
        const i1 = this.transform(this._range[0]);
        const i2 = this.transform(this._range[1]);
        Object.entries(tiles).forEach(([i, tile]) => {
            if (!(i >= i1 && i <= i2)) {
                delete tiles[i];
            }
        });
        for (let i = i1; i <= i2; i++) {
            if (tiles[i]) continue;
            tiles[i] = new Promise((resolve, reject) => {
                const urlTemplate = this.profile.prefix + layer.src;
                const url = L.Util.template(urlTemplate, {
                    'zoom': this._zoom,
                    'x': i,
                    'z': 0
                });
                fetch(url)
                    .then(result => {
                        if (result.status != 200) resolve();
                        result.json()
                            .then(text => {
                                tiles[i] = text;
                                resolve(tiles[i]);
                                this.emit('update');
                            }).catch(() => {
                                resolve();
                            });
                    })
                    .catch(() => resolve());
            });
        }
    }

    async getAt(name, t) {
        const i = this.transform(t);
        this.update();
        if (!this['_'+name][i]) return;
        const x = await this['_'+name][i];
        const j = Math.round((t/this.profile.zoom[this._zoom].width % 1)*256);
        return x.length ? x[0][j] : x;
    }

    async latitude(t) {
        return this.getAt('latitude', t);
    }

    async longitude(t) {
        return this.getAt('longitude', t);
    }

    async geocoding(t) {
        return this.getAt('geocoding', t);
    }
}
