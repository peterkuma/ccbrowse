class Layer {
    constructor(name, source) {
        this.name = name;
        this.source = source;
    }

    async ready() {
        this.availability = JSON.parse(await fetch(this.source.availability));
        this.colormap = JSON.parse(await fetch(this.source.colormap));
        return true;
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
