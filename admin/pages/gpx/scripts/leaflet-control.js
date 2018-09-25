(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['leaflet'], factory);
    } else if (typeof modules === 'object' && module.exports) {
    // define a Common JS module that relies on 'leaflet'
    module.exports = factory(require('leaflet'));
    } else {
    // Assume Leaflet is loaded into global object L already
    factory(L);
    }
}(this, function (L) {
    L.Control.Layers.Buttons = L.Control.Layers.extend({
        options: {
            collapsed: false,
        },

        initialize: function (layers, options) {
            L.Control.Layers.prototype.initialize.call(this, layers, null, options);
        },

        _initLayout: function () {
            var className = 'leaflet-control-layers-buttons',
                container = this._container = L.DomUtil.create('div', className);

            // fake form
            this._form = L.DomUtil.create('form');

            // makes this work on IE touch devices by stopping it from firing a mouseout event when the touch is released
            container.setAttribute('aria-haspopup', true);

            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);

            return container;
        },

        _update: function () {
            if (!this._container) { return this; }

            L.DomUtil.empty(this._container);

            for (var i in this._layers) {
                this._addItem(this._layers[i]);
            }

            // Hide base layers section if there's only one layer.
            if (this.options.hideSingleBase) {
                this._buttons.style.display = i > 1 ? '' : 'none';
            }

            return this;
        },

        _addItem: function (obj) {
            var active = this._map.hasLayer(obj.layer);

            var button = L.DomUtil.create('div', 'button' + (active ? ' active' : ''));
            button.innerHTML = obj.name;
            button.layerId = L.stamp(obj.layer);

            L.DomEvent.on(button, 'click', this._onInputClick, this);

            this._container.appendChild(button);

            return button;
        },

        _onInputClick: function (e) {
            var activate = e.target;
            var buttons = this._container.getElementsByTagName('div'),
                button, layer, hasLayer;
            var addedLayers = [],
                removedLayers = [];

            this._handlingClick = true;

            for (var i = buttons.length - 1; i >= 0; i--) {
                button = buttons[i];
                layer = this._getLayer(button.layerId).layer;

                if (L.DomUtil.hasClass(button, 'active')) {
                    if (this._map.hasLayer(layer)) {
                        removedLayers.push(layer);
                    }
                    L.DomUtil.removeClass(button, 'active');
                }
            }

            for (i = 0; i < removedLayers.length; i++) {
                this._map.removeLayer(removedLayers[i]);
            }

            L.DomUtil.addClass(activate, 'active');
            this._map.addLayer(layer = this._getLayer(activate.layerId).layer);

            this._handlingClick = false;

            this._refocusOnMap();
        }
    });

    L.control.layers.buttons = function (layers, options) {
        return new L.Control.Layers.Buttons(layers, options);
    };

    return L;
}));
