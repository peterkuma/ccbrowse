/*
 * tooltip.js - Tooltip class.
 *
 * The Tooltip class is responsible for showing a tooltip for elements
 * on mouse hover. The `title` attribute is used as the text of the tooltip.
 */

export default class Tooltip extends EventEmitter2 {
    constructor(forEl) {
        super();
        this.template = document.querySelector('#tooltip-template');
        this.el = this.template.cloneNode(true);
        this.el.removeAttribute('id');
        this.forEl = forEl;
        this.forEl.tooltip = this;
        this.content = this.el.querySelector('.content');

        this.content.innerHTML = this.forEl.title;

        document.querySelector('#overlay').appendChild(this.el);

        this.forEl.addEventListener('mouseover', function() {
            this.update();
            if (!this.title) return;
            this.forEl.title = '';
            this.el.style.opacity = '1';
        }.bind(this));

        this.forEl.addEventListener('mouseout', function() {
            if (this.stick) return;
            this.el.style.opacity = '0';
            if (this.forEl.title === '') this.forEl.title = this.title;
        }.bind(this));

        //this.forEl.addEventListener('change', this.update.bind(this));
    }

    update() {
        this.title = this.forEl.title;

        this.content.innerHTML = this.title;
        if (this.title) {
            this.el.style.opacity = '1';
        } else {
            this.el.style.opacity = '0';
        }

        var x = this.forEl.getBoundingClientRect().left;
        var y = this.forEl.getBoundingClientRect().top;
        var w = this.forEl.clientWidth;
        var h = this.forEl.clientHeight;

        var width = this.el.clientWidth;
        var height = this.el.clientHeight;

        this.el.style.left = (x + w/2 - width/2) + 'px';
        this.el.style.top = (y + h + 6) + 'px';

        if (y + h + 6 + height > document.body.clientHeight)
            this.el.style.top = (y - height - 6) + 'px';

        if (x + w/2 - width/2 < 0)
            this.el.style.left = x + 'px';
    }

    setStick(stick) {
        this.stick = stick ? true : false;
    }
}
