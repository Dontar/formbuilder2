userNamespace.UserType = Ext.extend({mainType}, {
    /* refs *//* refs */

    model: undefined,

    /* methods */

    initComponent: function() {
        this.initActions();
        this.initStores();
        this.initGui();
        this.supr().initComponent.call(this);
        this.autoConnect();
    },

    initGui: function() {
        Ext.apply(this, this.processGui({
            actions: /* actDef */[]/* actDef */,
            stores: /* stores */[]/* stores */,
            gui: /* designer */{}/* designer */
        }));
    },

    processGui: function(cfg) {
        var actions = cfg.actions;
        var stores = cfg.stores;
        var config = cfg.gui;

        Ext.each(actions, function(action) {
            this[action.actionId] = new Ext.Action(action);
        }, this);

        Ext.each(stores, function(store) {
            var storeId = store.storeId;
            delete store.storeId;
            this[storeId] = Ext.create(store);
        }, this);


        var iconCls = function(icon) {
            Ext.util.CSS.createStyleSheet("." + icon + "{background-image: url(images/" + icon.slice(5) + ".png) !important}");
        }

        if (config.iconCls !== undefined) {
            iconCls(config.iconCls);
        }

        if (config.actionId !== undefined) {
            return this[config.actionId];
        }

        if (typeof config.store === "string") {
            config.store = this[config.store];
        }

        ["tbar", "bbar", "fbar", "items", "menu", "buttons", "contextmenu"].forEach(function(prop) {
            if (config[prop] != undefined) {
                if (Ext.isArray(config[prop])) {
                    config[prop] = config[prop].map(this.processGui.bind(this));
                } else {
                    config[prop] = this.processGui(config[prop]);
                }
                if (prop == "contextmenu") {
                    var menu = config[prop] = new Ext.menu.Menu({items: config[prop]});
                    config.listeners = {
                        contextmenu: function() {
                            var e = arguments[arguments.length - 1];
                            e.stopEvent();
                            menu.showAt(e.getXY());
                        }
                    }
                }
            }
        }, this);

        return config;
    },

    initModel: function(bind) {
        var model = this.model || {};
        model.assign = function(o) {
            Ext.apply(this, o);
        };

        Ext.iterate(bind, function(key, val) {
            if (model[key]) {
                bind[key].setValue(model[key]);
            }
            Object.defineProperty(model, key, {
                enumerable: true,
                get: bind[key].getValue.bind(bind[key]),
                set: bind[key].setValue.bind(bind[key])
            });
        }, this);

        Object.defineProperty(this, 'model', {
            enumerable: true,
            get: function() {
                return model;
            },
            set: function(v) {
                Ext.apply(model, v);
            }
        });
    },

    autoConnect: function() {
        Ext.iterate(this.constructor.prototype, function(key, value, obj) {
            if (typeof obj[key] === 'function') {
                var def = /on_(.+)_(.+)/.exec(key);
                if (def) {
                    if (def[2].toLowerCase() == "handler") {
                        this[def[1]].setHandler(this[key], this);
                    } else if (this[def[1]]) {
                        if (this[def[1]] instanceof Ext.util.Observable && this[def[1]].getSelectionModel) {
                            var sm = this[def[1]].getSelectionModel();
                            this[def[1]].relayEvents(sm, Object.keys(sm.events));
                        }
                        this[def[1]].on(def[2], this[key], this);
                    }
                }
            }
        }, this);
        var bindings = {};
        Ext.iterate(this, function(key, value, obj) {
            if (typeof this[key].bind == "string") {
                bindings[this[key].bind] = this[key];
            }
        }, this);
        this.initModel(bindings);
    }
});
