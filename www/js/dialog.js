var Dialog = new Class({
    Implements: [Events],
    
    initialize: function(forEl, width, height, url) {
        this.template = $('dialog-template');
        this.el = this.template.clone();
        this.forEl = forEl;
        if (width) this.el.setStyle('width', width);
        if (height) this.el.setStyle('height', height);
        this.content = this.el.querySelector('.content');
        
        var x = this.forEl.getPosition().x;
        var y = this.forEl.getPosition().y;
        var w = this.forEl.getSize().x;
        var h = this.forEl.getSize().y;
        
        this.el.setStyle('left', x - width + w);
        this.el.setStyle('top', y + h + 14);
        
        this.closebtn = this.el.querySelector('.closebtn');
        this.closebtn.addEventListener('click', this.close.bind(this));
        
        if (url) {
            this.iframe = document.createElement('iframe');
            this.iframe.seamless = true;
            this.iframe.sandbox = 'allow-top-navigation';
            this.iframe.src = url;
            this.content.appendChild(this.iframe);
        }
        
        document.body.appendChild(this.el);
   },
   
   close: function() {
        document.body.removeChild(this.el);
        this.fireEvent('close');
   }
});
