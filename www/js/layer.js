export default class Layer {
    constructor(profile, name) {
        this.name = name;
        this.profile = profile;
        this.source = profile.layers[name];
        this.prototype = profile.source;
    }

    async ready() {
        let availabilityUrl = this.profile.prefix + this.source.availability;
        let colormapUrl = this.profile.prefix + this.source.colormap;

        let availabilityPromise = fetch(availabilityUrl);
        let colormapPromise = fetch(colormapUrl);

        this.availability = await (await availabilityPromise).json();
        this.colormap = await (await colormapPromise).json();
        return this;
    }

    get src() {
        return this.source.src;
    }

    async tile(x, z, zoom) {
        let src = template(this.source.src, {
            layer: this.name,
            x: x,
            z: z,
            zoom: zoom
        });
        let res = await loadImageData(src);
        let data = await pngunpack(res.rawData);
        return {
            layer: this.name,
            x: x,
            z: z,
            zoom: zoom,
            data: data
        };
    }


}
