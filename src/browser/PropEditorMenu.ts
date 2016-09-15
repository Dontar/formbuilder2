/// <reference path="../typings/tsd.d.ts" />

export class PropEditorMenu extends Ext.menu.Menu {
    aDelProperty: Ext.Action;
    edPropCombo: Ext.form.ComboBox;
    menuItemTypes: Ext.menu.Item;

    private currentRecord: Ext.data.Record<any>;

    constructor(private grid: Ext.grid.PropertyGrid) {
        super();
        grid.on("rowcontextmenu", (sender, rowIndex, e: Ext.EventObject) => {
            this.currentRecord = this.grid.getStore().getAt(rowIndex);
            this.aDelProperty.enable();
            this.menuItemTypes.enable();
            this.edPropCombo.reset();
            this.showAt(e.getXY());
            this.edPropCombo.focus.defer(300, this.edPropCombo);
        });
        grid.on("contextmenu", (e: Ext.EventObject) => {
            this.currentRecord = null;
            this.aDelProperty.disable();
            this.menuItemTypes.disable();
            this.edPropCombo.reset();
            this.showAt(e.getXY());
            this.edPropCombo.focus.defer(300, this.edPropCombo);
        });
    }

    on_edPropCombo_specialkey(sender: Ext.form.ComboBox, e: Ext.EventObject) {
        if (e.getKey() == e.ENTER) {
            this.grid.setProperty(sender.getRawValue(), null, true);
            this.hide();
            this.grid.startEditing.defer(300, this.grid, [this.grid.getStore().getCount() - 1, 1]);
        }
    }

    on_edPropCombo_select(combo, record, index) {
        this.grid.setProperty(record.data[combo.valueField], null, true);
        this.hide();
        this.grid.startEditing.defer(300, this.grid, [this.grid.getStore().getCount() - 1, 1]);
    }
    on_aDelProperty_handler() {
        this.grid.removeProperty(this.currentRecord.data.name);
    }

    initGui() {
        // var props: any = FS.readFileSync(PATH.join(__dirname, "props.json"), "utf8");
        var props: any = require("json!props.json");
        if (props) {
            props = Ext.unique(props);
        } else {
            props = ["no props"];
        }
        Ext.apply(this, {
            items: [{
                xtype: "menutextitem",
                text: "Add property"
            }, {
                ref: "edPropCombo",
                xtype: "combo",
                triggerAction: "all",
                store: props
            }, "-",{
                xtype: "menuitem",
                ref: "menuItemTypes",
                iconCls: "icon-tag_blue_edit",
                text: "Set property type",
                menu: {
                    items: [
                        {text: "string"},
                        {text: "number"},
                        {text: "boolean"},
                        {text: "date"}
                    ]
                }
            }, "-",this.aDelProperty]
        });
    }

    onMenuItemTypesItemclick(menuItem: Ext.menu.Item, e: Ext.EventObject) {
        var prop = this.currentRecord.data.name;
        var editor = (<any>this.grid.getColumnModel()).editors[(<any>menuItem).text];
        (<any>this.grid).customEditors[prop] = editor;
    }

    initComponent() {
        this.initActions();
        this.initGui();
        super.initComponent();
        this.autoConnect();

        this.menuItemTypes.menu.on("itemclick", this.onMenuItemTypesItemclick, this);
    }

    initActions() {
        var actions = /* actDef */[{
            actionId: "aDelProperty",
            text: "Del property",
            iconCls: "icon-delete"
        }] /* actDef */;

        actions.forEach(action => {
            this[action.actionId] = new Ext.Action(action);
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
    }
}
