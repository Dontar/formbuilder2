/// <reference path="../typings/tsd.d.ts" />

import {TypeMap} from "./TypeMap";

class PropProxy extends Ext.data.DataProxy {
    data: any[];
    api = { read: true };

    constructor(config?) {
        super(config);
    }

    doRequest(action: string, rs, params, reader: Ext.data.DataReader, callback: Function, scope, options) {
        params = params || {};
        var result;
        try {
            var data = this.data.filter((item: any) => {
                if (Ext.isObject(item)) {
                    return !Ext.isEmpty(params.query) ? item.name.search(params.query) != -1 : true;
                }
                return !Ext.isEmpty(params.query) ? item.search(params.query) != -1 : true;
            });
            if (data.length > 0) {
                if (Ext.isString(data[0])) {
                    data = data.map(item => {
                        return {
                            name: item,
                            value: item
                        }
                    });
                }
            }

            result = reader.readRecords(data);
        } catch (e) {
            // @deprecated loadexception
            this.fireEvent("loadexception", this, null, options, e);

            this.fireEvent('exception', this, 'response', action, options, null, e);
            callback.call(scope, null, options, false);
            return;
        }
        callback.call(scope, result, options, true);
    }

}

class XtypesProxy extends PropProxy {
    public get data(): any[] {
        return Object.keys(Ext.ComponentMgr.types).concat(Object.keys((<any>Ext.grid.Column).types)).map(xtype => {
            return {
                // name: TypeMap[xtype] || xtype,
                name: xtype,
                value: xtype
            }
        });
    }
}

class LayoutsProxy extends PropProxy {
    public get data(): any[] {
        return Object.keys((<any>Ext.Container).LAYOUTS);
    }
}
class ActionsProxy extends PropProxy {
    constructor(private tree: Ext.tree.TreePanel) {
        super();
    }

    public get data(): any[] {
        var actionsNode = this.tree.getNodeById("actions");
        return actionsNode.childNodes.map((item) => {
            return item.text;
        });
    }
}

class StoresProxy extends PropProxy {
    constructor(private tree: Ext.tree.TreePanel) {
        super();
    }

    public get data(): any[] {
        var storesNode = this.tree.getNodeById("stores");
        return storesNode.childNodes.map((item) => {
            return item.attributes.config.storeId;
        });
    }
}

class StoreFieldsProxy extends PropProxy {
    node: Ext.tree.TreeNode;
    constructor(private tree: Ext.tree.TreePanel) {
        super();
    }

    public get data() {
        this.node = this.tree.getSelectionModel().getSelectedNode();
        var sNode = this.tree.getNodeById("stores");
        var storeNode;

        if (this.node.isAncestor(sNode)) {
            storeNode = this.node;
        } else try {
            var storeName = (this.node.parentNode.attributes.config || {}).store;
            if (storeName) {
                storeNode = sNode.findChildBy((node) => {
                    return (node.attributes.config || {}).storeId == storeName;
                });
            } else return [];
        } catch (e) {
            return [];
        }
        return storeNode.childNodes.map(node => {
            return node.attributes.config.name;
        });

        // return ["No fields"];
    }
}

class CSSRulesProxy extends PropProxy {
    public get data(): any[] {
        return Object.keys(Ext.util.CSS.getRules()).filter(rule => {
            return rule.indexOf(".icon-") === 0;
        }).map(rule => {
            return rule.slice(1);
        });
    }
}

export function getPropEditors(tree: Ext.tree.TreePanel, propGrid: Ext.grid.PropertyGrid) {
    var isAction: boolean = true;
    var selectedNode: Ext.tree.TreeNode;
    (<Ext.tree.TreePanel>tree).getSelectionModel().on("selectionchange", (treeSel, node: Ext.tree.TreeNode) => {
        if (node) {
            var actionNode = tree.getNodeById("actions");
            isAction = !Ext.isEmpty(actionNode) && node.isAncestor(actionNode);
            selectedNode = node;
        }
    });


    return {
        _xtype: new Ext.grid.GridEditor(new Ext.form.ComboBox({
            store: new Ext.data.JsonStore({
                fields: ["name", "value"],
                proxy: new XtypesProxy()
            }),
            triggerAction: "all",
            valueField: "value",
            displayField: "name",
            forceSelection: false,
            editable: true
        })),
        get xtype() {
            this._xtype.field.getStore().load();
            return this._xtype;
        },

        _layout: new Ext.grid.GridEditor(new Ext.form.ComboBox({
            store: new Ext.data.JsonStore({
                fields: ["name", "value"],
                proxy: new LayoutsProxy()
            }),
            triggerAction: "all",
            valueField: "value",
            displayField: "name",
            forceSelection: false,
            editable: true
        })),
        get layout() {
            this._layout.field.getStore().load();
            return this._layout;
        },

        region: new Ext.grid.GridEditor(new Ext.form.ComboBox({
            store: ["center", "north", "south", "east", "west"],
            triggerAction: "all",
            // valueField: "value",
            // displayField: "name",
            forceSelection: false,
            editable: true
        })),

        type: new Ext.grid.GridEditor(new Ext.form.ComboBox({
            store: ["auto", "string", "int", "float", "boolean", "date"],
            triggerAction: "all",
            // valueField: "value",
            // displayField: "name",
            forceSelection: false,
            editable: true
        })),

        _actionTxt: new Ext.grid.GridEditor(new Ext.form.TextField({
            flex: 1
        })),
        _actionCmb: new Ext.grid.GridEditor(new Ext.form.ComboBox({
            flex: 1,
            store: new Ext.data.JsonStore({
                fields: ["name", "value"],
                proxy: new ActionsProxy(tree)
            }),
            triggerAction: "all",
            valueField: "value",
            displayField: "name",
            forceSelection: false,
            editable: true
        })),
        get actionId() {
            return isAction ? this._actionTxt : this._actionCmb;
        },

        _store: new Ext.grid.GridEditor(new Ext.form.ComboBox({
            store: new Ext.data.JsonStore({
                fields: ["name", "value"],
                proxy: new StoresProxy(tree)
            }),
            triggerAction: "all",
            valueField: "value",
            displayField: "name",
            forceSelection: false,
            editable: true
        })),
        get store() {
            this._store.field.getStore().load();
            return this._store;
        },

        _dataIndex: new Ext.grid.GridEditor(new Ext.form.ComboBox({
            store: new Ext.data.JsonStore({
                fields: ["name", "value"],
                proxy: new StoreFieldsProxy(tree)
            }),
            triggerAction: "all",
            valueField: "value",
            displayField: "name",
            forceSelection: false,
            editable: true
        })),
        get dataIndex() {
            this._dataIndex.field.getStore().load();
            return this._dataIndex;
        },

        _idProperty: new Ext.grid.GridEditor(new Ext.form.ComboBox({
            store: new Ext.data.JsonStore({
                fields: ["name", "value"],
                proxy: new StoreFieldsProxy(tree)
            }),
            triggerAction: "all",
            valueField: "value",
            displayField: "name",
            forceSelection: false,
            editable: true
        })),
        get idProperty() {
            this._idProperty.field.getStore().load();
            return this._idProperty;
        },

        _iconCls: new Ext.grid.GridEditor(new Ext.form.ComboBox({
            store: new Ext.data.JsonStore({
                fields: ["name", "value"],
                proxy: new CSSRulesProxy()
            }),
            tpl: "<tpl for=\".\"><div class=\"x-combo-list-item {value}\" style=\"padding-left: 18px; background-repeat: no-repeat\">{name}</div></tpl>",
            triggerAction: "all",
            valueField: "value",
            displayField: "name",
            forceSelection: false,
            editable: true
        })),
        get iconCls() {
            this._iconCls.field.getStore().load();
            return this._iconCls;
        }
    };
}
