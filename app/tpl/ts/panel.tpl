/// <reference path="lib/Ext3.d.ts" />

namespace userNamespace {

    /* intf */
    /* intf */

    interface IUserModel {

    }

    export class UserType extends Ext.Panel {
        /* refs */ /* refs */

        model: IUserModel & {
            [field: string]: any;
            assign?: (o: any) => void;
        }

        /* methods */

        initComponent() {
            this.initGui();
            super.initComponent();
            this.autoConnect();
        }

        initGui() {
            Ext.apply(this, this.processGui({
                actions: /* actDef */[]/* actDef */,
                stores: /* stores */[]/* stores */,
                gui: /* designer */{xtype: "panel"}/* designer */
            }));
        }

        processGui(cfg: any) {
            var actions = cfg.actions;
            var stores = cfg.stores;
            var config = cfg.gui;

            Ext.each<any>(actions, action => {
                this[action.actionId] = new Ext.Action(action);
            });

            Ext.each<any>(stores, store => {
                var storeId = store.storeId;
                delete store.storeId;
                this[storeId] = Ext.create(store);
            });

            var iconCls = (icon: string) => {
                Ext.util.CSS.createStyleSheet(`.${icon} {background-image: url(images/${icon.slice(5)}.png) !important}`);
            }

            if (config.iconCls != undefined) {
                iconCls(config.iconCls);
            }

            if (config.actionId != undefined) {
                return this[config.actionId];
            }

            if (typeof config.store === "string") {
                config.store = this[config.store];
            }

            ["tbar", "bbar", "fbar", "items", "menu", "buttons", "contextmenu"].forEach(prop => {
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
                                var e: Ext.EventObject = arguments[arguments.length - 1];
                                e.stopEvent();
                                menu.showAt(e.getXY());
                            }
                        }
                    }
                }
            });

            return config;
        }

        initModel(bind: { [field: string]: Ext.form.Field }) {
            var model: any = this.model || {};
            model.assign = function(o) {
                Ext.apply(this, o);
            };

            Ext.iterate(bind, (key: string, val: any) => {
                if (model[key]) {
                    bind[key].setValue(model[key]);
                }
                Object.defineProperty(model, key, {
                    enumerable: true,
                    get: bind[key].getValue.bind(bind[key]),
                    set: bind[key].setValue.bind(bind[key])
                });
            });

            Object.defineProperty(this, 'model', {
                enumerable: true,
                get: () => {
                    return model;
                },
                set: (v) => {
                    Ext.apply(model, v)
                }
            });
        }

        autoConnect() {
            Ext.iterate(Object.getPrototypeOf(this), (key, value, obj) => {
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
            });
            var bindings: any = {};
            Ext.iterate(this, (key, value, obj) => {
                if (typeof this[key].bind == "string") {
                    bindings[this[key].bind] = this[key];
                }
            });
            this.initModel(bindings);
        }
    }
}