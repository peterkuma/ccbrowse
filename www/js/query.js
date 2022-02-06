function Query() {
    ;
}

Query.prototype.onLoad = null;

Query.prototype.perform = function(profile, layer, level, t, h) {
    var req = new XMLHttpRequest();

    req.onreadystatechange = function() {
        if(req.readyState == 4) {
            if (this.onLoad) this.onLoad(req.responseText);
        }
    }.bind(this);

    var x = t/profile.zoom[level].width;
    var z = (h - profile.origin[1])/profile.zoom[level].height;

    var url = '../';
    url += L.Util.template(layer.src, {
            zoom: level,
            x: Math.floor(x),
            z: Math.floor(z),
    });

    var i = Math.round((x % 1)*256);
    var j = Math.round((z % 1)*256);
    i = i >= 0 ? i : 256 + i;
    j = j >= 0 ? j : 256 + j;
    j = 256 - j;

    if (typeof h == 'undefined') j = 0;

    url += '?q='+i+','+j;

    req.open('GET', url);
    req.send()
}

export default Query;
