export default class LocationBar {
    constructor(bar) {
        this.bar = bar;
        this.center = this.bar.querySelector('.center');
        this._wait = false;
        this._location = undefined;
        this.update();
    }

    location(location) {
        if (arguments.length == 0) return this._location;
        this._location = location;
        this._wait = false;
        this.update();
        return this;
    }

    wait(value) {
        this._wait = value;
        this.update();
    }

    update() {
        if (this._wait) {
            if (!this.center.classList.contains('wait')) {
                this.center.innerHTML = '<span>●</span>';
                this.center.title = '';
                this.center.classList.add('wait');
            }
        } else if (this._location !== undefined) {
            this.center.innerText = this._location;
            this.center.title = '';
            this.center.classList.remove('wait');
        } else {
            this.center.innerText = '…';
            this.center.title = 'No information about place available';
            this.center.classList.remove('wait');
        }
        if (this.center.tooltip) this.center.tooltip.update();
    }
}
