/*
 * tooltip.js - Tooltip class.
 *
 * The Tooltip class is responsible for showing a tooltip for elements
 * on mouse hover. The `title` attribute is used as the text of the tooltip.
 */

var Tooltip = new Class({
    Implements: EventEmitter2,

    initialize: function(forEl) {
        this.template = $('tooltip-template');
        this.el = this.template.clone();
        this.forEl = forEl;
        this.forEl.tooltip = this;
        this.content = this.el.querySelector('.content');

        this.content.set('html', this.forEl.title);

        this.el.set('tween', {duration: 100});
        this.el.fade('hide');

        $('overlay').appendChild(this.el);

        this.forEl.addEventListener('mouseover', function() {
            this.update();
            if (!this.title) return;
            this.forEl.title = '';
            this.el.fade('in');
        }.bind(this));

        this.forEl.addEventListener('mouseout', function() {
            if (this.stick) return;
            this.el.fade('out');
            if (this.forEl.title === '') this.forEl.title = this.title;
        }.bind(this));

        //this.forEl.addEventListener('change', this.update.bind(this));
    },

    update: function() {
        this.title = this.forEl.title;

        this.content.set('html', this.title);
        if (this.title) this.el.setStyle('display', 'block');
        else this.el.setStyle('display', 'none');

        var x = this.forEl.getPosition().x;
        var y = this.forEl.getPosition().y;
        var w = this.forEl.getSize().x;
        var h = this.forEl.getSize().y;

        var width = this.el.getSize().x;
        var height = this.el.getSize().y;

        this.el.setStyle('left', x + w/2 - width/2);
        this.el.setStyle('top', y + h + 6);

        if (y + h + 6 + height > document.body.getSize().y)
            this.el.setStyle('top', y - height - 6);

        if (x + w/2 - width/2 < 0)
            this.el.setStyle('left', x);
    },

    setStick: function(stick) {
        this.stick = stick ? true : false;
    }
});

export default Tooltip;
