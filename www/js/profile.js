import Layer from './layer.js';


class Profile {
    constructor(source) {
        this.source = source;
    }

    get origin() {
        return new Date.parse(this.source.origin[0] + ' +0000');
    }

    get prefix() {
        let prefix = this.source.prefix;
        if (prefix !== '' && prefix[prefix.length - 1] !== '/') {
            return prefix + '/';
        }
        return prefix;
    }

    get zoom() {
        return this.source.zoom;
    }

    get zBounds() {
        return this.source['z-bounds'];
    }

    async layer(name) {
        if (this.source.layers[name] === undefined) {
            return null;
        }
        let source = this.source.layers[name];
        let layer = Layer(name, source);
        return await layer.ready();
    }
}
