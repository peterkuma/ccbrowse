var LayerControl = new Class({
    initialize: function(el, nav) {
        this.el = el;
        this.nav = nav;

        this.contentWrapper = this.el.querySelector('.content-wrapper');
        this.content = this.el.querySelector('.content');
        this.icon = this.el.querySelector('.icon');
        this.items = this.el.querySelector('.items');

        this.icon.addEventListener('click', function() {
            this.el.toggleClass('collapsed');
            if (this.el.hasClass('collapsed')) {
                this.icon.title = '';
                this.el.title = 'Layers';
            } else {
                this.icon.title = 'Hide';
                this.el.title = '';
            }
            if (this.icon.tooltip) this.icon.tooltip.update();
            if (this.el.tooltip) this.el.tooltip.update();
        }.bind(this));

        this.nav.on('layerchange', this.update.bind(this));
        this.update();
    },

    update: function() {
        this.items.innerHTML = '';
        var layers = this.nav.getLayers();
        Object.each(layers, function(layer, name) {
            if (layer.dimensions != 'xz' || !layer.colormap) return;
            var item = document.createElement('a');
            item.href = name + '/';
            item.onclick = function(evt) {
                this.nav.setLayer(name);
                this.update();
                evt.preventDefault();
            }.bind(this);
            item.addClass('layer-item');
            let currentLayer = this.nav.getLayer();
            if (currentLayer && layer == currentLayer.source) {
                item.addClass('active');
            }
            var bulb = document.createElement('div');
            bulb.addClass('bulb');
            item.appendChild(bulb);
            var label = document.createElement('span');
            label.set('text', layer.title);
            item.appendChild(label);
            this.items.appendChild(item);
        }.bind(this));

        /*
        var newel = this.el.clone();
        newel.removeClass('collapsed');
        document.body.appendChild(newel);
        this.content.setStyle('width', newel.querySelector('.content').getSize().x);
        this.content.setStyle('height', newel.querySelector('.content').getSize().y);
        document.body.removeChild(newel);
        */
        /*
        this.content.setStyle('width', this.content.getDimensions().x);
        this.content.setStyle('height', this.content.getDimensions().y);
        */
    }
});

export default LayerControl;
