export default class LocationBar {
    constructor(bar) {
        this.bar = bar;
        this.center = this.bar.querySelector('.center');
        this.update();
    }

    location(location) {
        if (arguments.length == 0) return this._location;
        this._location = location;
        this.update();
        return this;
    }

    update() {
        this.center.innerText = '…';
        this.center.title = 'No information about place available';
        if (this._location !== undefined) {
            this.center.innerText = this._location;
            this.center.title = '';
        }
        if (this.center.tooltip) this.center.tooltip.update();
    }
}
