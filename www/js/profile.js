import Layer from './layer.js';


export default class Profile {
    constructor(source) {
        this.source = source;
    }

    get origin() {
        return [
            new Date.parse(this.source.origin[0] + ' +0000'),
            this.source.origin[1]
        ];
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

    get layers() {
        return this.source.layers;
    }

    async layer(name) {
        if (this.source.layers[name] === undefined) {
            return null;
        }
        let source = this.source.layers[name];
        let layer = new Layer(this, name);
        return await layer.ready();
    }
}
