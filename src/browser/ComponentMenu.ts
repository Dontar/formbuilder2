/// <reference path="../typings/tsd.d.ts" />

import {ActionClass, StoreClass, StoreFieldClass, Parser, ComponentClass, ColumnClass} from "./Parser";
import {TypeMap} from "./TypeMap";

export class ComponentMenu extends Ext.menu.Menu {/* refs */
    aNewAction: Ext.Action;
    aAddAction: Ext.Action;
    aAddStore: Ext.Action;
    aAddStoreField: Ext.Action;
    aAddComponent: Ext.Action;
    aDelAction: Ext.Action;
    aDelStore: Ext.Action;
    aSetIdField: Ext.Action;
    aDelStoreField: Ext.Action;
    aDelComponent: Ext.Action;
    aLayoutMenu: Ext.Action;
    aXtypeMenu: Ext.Action;
    aSetXtypeMenu: Ext.Action;
    aPanelTBars: Ext.Action;
    aGridFromStore: Ext.Action;
    aAddCol: Ext.Action;
    aSetRegion: Ext.Action;
    /* refs */

    selectedNode: Ext.tree.TreeNode;
    menuXtypes: Ext.menu.Menu;
    menuLayouts: Ext.menu.Menu;
    menuPanelToolbars: Ext.menu.Menu;
    actionsMenu: Ext.menu.Menu;
    storesMenu: Ext.menu.Menu;
    menuRegion: Ext.menu.Menu;

    on_aNewAction_handler() {
        var actionName = "aNewAction" + Ext.id();
        var node = this.selectedNode.appendChild({
            nodeType: "node",
            text: actionName,
            iconCls: "icon-font",
            isTarget: false
        });
        node.attributes.config = new ActionClass(node);
        node.attributes.config.text = actionName;
    }

    on_aDelAction_handler() {
        var node = this.selectedNode;
        // this.selectedNode.previousSibling.select();
        node.remove(true);
    }

    on_aAddStore_handler() {
        var node = this.selectedNode.appendChild({
            nodeType: "node",
            iconCls: "icon-database",
        });
        var c = node.attributes.config = new StoreClass(node);
        Ext.apply(c, {
            storeId: "NewStore",
            xtype: "jsonstore"
        })
    }

    on_aDelStore_handler() {
        var node = this.selectedNode;
        // node.previousSibling.select();
        node.remove(true);
    }

    on_aAddStoreField_handler() {
        var node = this.selectedNode.appendChild({
            iconCls: "icon-database_table",
            nodeType: "node"
        });
        node.attributes.config = new StoreFieldClass(node);
        Ext.apply(node.attributes.config, {
            name: "NewField",
            type: "auto"
        });
    }

    on_aDelStoreField_handler() {
        this.selectedNode.remove(true);
    }

    on_aDelComponent_handler() {
        var node = this.selectedNode;
        // node.previousSibling.select();
        node.remove(true);
    }

    on_aAddCol_handler() {
        var config = {
            dataIndex: "field1",
            header: "field1"
        }
        var n = this.selectedNode.appendChild({
            nodeType: "node",
            iconCls: "icon-shape_align_top"
        });
        n.attributes.config = new ColumnClass(n);
        Ext.apply(n.attributes.config, config);

    }

    constructor(private tree: Ext.tree.TreePanel, config?) {
        super(config);
        this.tree.getSelectionModel().on("selectionchange", this.onTreeSelectionChange.bind(this));
        this.tree.on("contextmenu", this.onTreeContextmenu.bind(this));
    }

    initActions() {
        var actions = /* actDef */[{
            text: "New Action",
            hidden: true,
            actionId: "aNewAction",
            iconCls: "icon-font_add"
        }, {
                text: "Add Action",
                hidden: true,
                actionId: "aAddAction",
                iconCls: "icon-font_add",
                menu: this.actionsMenu
            }, {
                text: "Add store",
                hidden: true,
                actionId: "aAddStore",
                iconCls: "icon-database_add"
            }, {
                text: "Add field",
                hidden: true,
                actionId: "aAddStoreField",
                iconCls: "icon-textfield_add"
            }, {
                text: "Add component",
                hidden: true,
                actionId: "aAddComponent",
                iconCls: "icon-application_add"
            }, {
                text: "Del Action",
                hidden: true,
                actionId: "aDelAction",
                iconCls: "icon-font_delete"
            }, {
                text: "Del store",
                hidden: true,
                actionId: "aDelStore",
                iconCls: "icon-database_delete"
            }, {
                text: "Set as ID",
                actionId: "aSetIdField",
                iconCls: "icon-bullet_key"
            }, {
                text: "Del field",
                hidden: true,
                actionId: "aDelStoreField",
                iconCls: "icon-textfield_delete"
            }, {
                text: "Del component",
                hidden: true,
                actionId: "aDelComponent",
                iconCls: "icon-application_delete"
            }, {
                text: "Set Layout",
                hideOnClick: false,
                actionId: "aLayoutMenu",
                iconCls: "icon-font",
                menu: this.menuLayouts
            }, {
                text: "Add component",
                hideOnClick: false,
                actionId: "aXtypeMenu",
                iconCls: "icon-application_add",
                menu: this.menuXtypes
            }, {
                text: "Set xtype",
                hideOnClick: false,
                actionId: "aSetXtypeMenu",
                iconCls: "icon-application_add"
            }, {
                text: "Add toolbar",
                hideOnClick: false,
                actionId: "aPanelTBars",
                iconCls: "icon-font",
                menu: this.menuPanelToolbars
            }, {
                text: "Grid from Store",
                hideOnClick: false,
                hidden: true,
                actionId: "aGridFromStore",
                iconCls: "icon-application_view_detail",
                menu: this.storesMenu
            }, {
                text: "Add column",
                hidden: true,
                actionId: "aAddCol",
                iconCls: "icon-shape_align_top"
            }, {
                text: "Set region",
                hideOnClick: false,
                actionId: "aSetRegion",
                iconCls: "icon-font",
                menu: this.menuRegion
            }]/* actDef */;

        actions.forEach(action => {
            this[action.actionId] = new Ext.Action(action);
        });
    }

    initGui() {
        Ext.apply(this, {
            items: [
                this.aNewAction,
                this.aAddAction,
                this.aAddStore,
                this.aAddStoreField,
                // this.aAddComponent,
                this.aXtypeMenu,
                this.aGridFromStore,
                this.aAddCol,
                this.aDelAction,
                this.aDelStore,
                this.aDelStoreField,
                this.aSetIdField,
                this.aDelComponent,
                this.aLayoutMenu,
                this.aPanelTBars,
                this.aSetRegion
                // this.aSetXtypeMenu
            ]
        });
    }

    onTreeSelectionChange(sm: Ext.tree.DefaultSelectionModel, node: Ext.tree.TreeNode) {
        this.selectedNode = node;

        // if (node) {


        // }
    }

    updateMenusState(node: Ext.tree.TreeNode) {
        var config = node.attributes.config || {};
        var isAction = !Ext.isEmpty(config.actionId);
        var canHaveMenu = Parser.isXType(config.xtype, "menuitem") || Parser.isXType(config.xtype, "button");
        var hasXtype = !Ext.isEmpty(config.xtype);
        var isFromComps = node.isAncestor(this.tree.getNodeById("comps"));
        var isContainer = ["panel", "container", "window", "compositefield", "tabpanel", "button", "menuitem", "buttongroup"].indexOf(config.xtype) != -1;
        var isGrid = ["grid", "treepanel", "listview"].indexOf(config.xtype) != -1;
        var isToolbar = ["tbar", "bbar", "fbar", "buttons", "contextmenu"].indexOf(node.attributes.text) != -1;
        var isColumn = node.attributes.config instanceof ColumnClass;

        this.aNewAction.setHidden(node.id != "actions");
        this.aDelAction.setHidden(node.parentNode.id != "actions");

        this.aAddStore.setHidden(node.id != "stores");
        this.aDelStore.setHidden(node.parentNode.id != "stores");

        this.aAddStoreField.setHidden(!Parser.isXType(config.xtype, "store"));
        this.aDelStoreField.setHidden(!Parser.isXType((node.parentNode.attributes.config || {}).xtype, "store"));
        this.aSetIdField.setHidden(!Parser.isXType((node.parentNode.attributes.config || {}).xtype, "store"));

        // this.aAddComponent.setHidden(!isFromComps && isGrid);
        var test = isFromComps && !isAction && (isToolbar || isContainer || canHaveMenu || isColumn) && !isGrid;
        this.aXtypeMenu.setHidden(!test);
        this.aDelComponent.setHidden(!(isFromComps || isColumn));
        this.aGridFromStore.setHidden(!isFromComps || isAction || !isContainer || isGrid);


        this.aSetRegion.setHidden((node.parentNode.attributes.config || {}).layout != "border" || isToolbar);

        this.aAddCol.setHidden(!isGrid);

        // var test1 = isFromComps && !isAction && !isToolbar && (isContainer || !hasXtype);
        this.aLayoutMenu.setHidden(!isContainer || isGrid);

        var test2 = isFromComps && Parser.isXType(config.xtype, "panel") && !isAction;
        this.aPanelTBars.setHidden(!test2);

        this.aAddAction.setHidden(!(isToolbar || canHaveMenu));

        this.aSetXtypeMenu.setHidden(!(isFromComps && !isAction && !isToolbar));
    }

    onTreeContextmenu(node: Ext.tree.TreeNode, e: Ext.EventObject) {
        if (!node.isSelected()) node.select();
        this.updateMenusState(node);
        this.showAt(e.getXY());
        e.stopEvent();
    }


    initXTypesMenu() {
        this.menuXtypes = new Ext.menu.Menu();
        var addComp = (item: any, e: Ext.EventObject) => {
            var config;
            // if (Parser.isGrid((this.selectedNode.attributes.config || {}).xtype)) {
            //     config = {
            //         dataIndex: "field1",
            //         header: "field1"
            //     }
            //     var n = this.selectedNode.appendChild({
            //         nodeType: "node",
            //         iconCls: "icon-shape_align_top"
            //     });
            //     n.attributes.config = new ColumnClass(n);

            // } else {
            config = {
                xtype: item.theXtype,
                ref: Ext.id({}, "comp")
            }
            var n = this.selectedNode.appendChild({
                nodeType: "node",
                text: Parser.genNodeText(config),
                iconCls: Parser.genNodeIcon(config)
            });
            n.attributes.config = new ComponentClass(n);
            // }
            if (Parser.isXType(config.xtype, "field")) {
                config.fieldLabel = "Field Label";
            }
            Ext.apply(n.attributes.config, config);

        };
        this.menuXtypes.on("beforeshow", () => {
            var xtypes = Object.keys(Ext.ComponentMgr.types);
            var containers: any[] = ["container", "panel", "form", "tabpanel", "fieldset", "viewport", "window"];
            var fields = [];
            var grids = [];
            var trees = [];
            var menus = [];
            var others = [];
            var toolbars = [];

            xtypes.forEach(xtype => {
                if (Parser.isXType(xtype, "field")) {
                    fields.push({
                        xtype: "menuitem",
                        text: TypeMap[xtype] || xtype,
                        theXtype: xtype,
                        handler: addComp
                    });
                } else if (Parser.isXType(xtype, "grid") || Parser.isXType(xtype, "listview") || Parser.isXType(xtype, "lvcolumn")) {
                    grids.push({
                        xtype: "menuitem",
                        text: TypeMap[xtype] || xtype,
                        theXtype: xtype,
                        handler: addComp
                    });
                } else if (Parser.isXType(xtype, "treepanel")) {
                    trees.push({
                        xtype: "menuitem",
                        text: TypeMap[xtype] || xtype,
                        theXtype: xtype,
                        handler: addComp
                    });
                } else if (Parser.isXType(xtype, "toolbar") || Parser.isXType(xtype, "tbitem")) {
                    toolbars.push({
                        xtype: "menuitem",
                        text: TypeMap[xtype] || xtype,
                        theXtype: xtype,
                        handler: addComp
                    });
                } else if (xtype.indexOf("menu") != -1) {
                    menus.push({
                        xtype: "menuitem",
                        text: TypeMap[xtype] || xtype,
                        theXtype: xtype,
                        handler: addComp
                    });
                } else {
                    if (containers.indexOf(xtype) == -1 && !Parser.isXType(xtype, "store") && !Parser.isXType(xtype, "chart") && !Parser.isXType(xtype, "menu") && !Parser.isXType(xtype, "menubaseitem")) {
                        others.push({
                            xtype: "menuitem",
                            text: TypeMap[xtype] || xtype,
                            theXtype: xtype,
                            handler: addComp
                        });
                    }
                }
            });

            containers = containers.map(xtype => {
                return {
                    xtype: "menuitem",
                    text: TypeMap[xtype] || xtype,
                    theXtype: xtype,
                    handler: addComp
                }
            });

            this.menuXtypes.removeAll(true);
            this.menuXtypes.add([
                { xtype: "menuitem", hideOnClick: false, text: "Containers", menu: containers },
                { xtype: "menuitem", hideOnClick: false, text: "Fields", menu: fields },
                { xtype: "menuitem", hideOnClick: false, text: "Grids", menu: grids },
                { xtype: "menuitem", hideOnClick: false, text: "Trees", menu: trees },
                { xtype: "menuitem", hideOnClick: false, text: "Menus", menu: menus },
                { xtype: "menuitem", hideOnClick: false, text: "Toolbars", menu: toolbars },
                { xtype: "menuitem", hideOnClick: false, text: "Others", menu: others },
                { xtype: "menuitem", text: "Empty", handler: addComp, theXtype: "" }
            ]);
        });
    }

    initLayoutMenu() {
        this.menuLayouts = new Ext.menu.Menu();
        var setLayOut = (item, e: Ext.EventObject) => {
            this.selectedNode.attributes.config.layout = item.text;
            this.fireEvent("layoutchanged", this.selectedNode);
            // var sm = this.tree.getSelectionModel();
            // sm.fireEvent("selectionchange", sm, this.selectedNode);
        }
        this.menuLayouts.on("beforeshow", () => {
            var layouts = Object.keys((<any>Ext.Container).LAYOUTS);
            this.menuLayouts.removeAll(true);
            this.menuLayouts.add(layouts.map(layout => {
                return {
                    xtype: "menuitem",
                    text: layout,
                    handler: setLayOut
                }
            }));
        });
    }

    initRegionMenu() {
        var setRegion = (item, e: Ext.EventObject) => {
            this.selectedNode.attributes.config.layout = item.text;
            if (item.text != "center") {
                Ext.apply(this.selectedNode.attributes.config, {
                    split: true,
                    [/north|south/.test(item.text) ? "height" : "width"]: 300
                });
            }
            this.fireEvent("layoutchanged", this.selectedNode);
        }
        this.menuRegion = new Ext.menu.Menu({
            items: [
                { text: "center", xtype: "menuitem", handler: setRegion },
                { text: "north", xtype: "menuitem", handler: setRegion },
                { text: "south", xtype: "menuitem", handler: setRegion },
                { text: "west", xtype: "menuitem", handler: setRegion },
                { text: "east", xtype: "menuitem", handler: setRegion }
            ]
        });

    }

    initMenuPanelToolbars() {
        this.menuPanelToolbars = new Ext.menu.Menu();
        var addToolBar = (item, e) => {
            var n = this.selectedNode.appendChild({
                nodeType: "node",
                leaf: false,
                text: item.text
            });
        }
        this.menuPanelToolbars.on("beforeshow", () => {
            this.menuPanelToolbars.removeAll(true);
            var tbs = ["tbar", "bbar", "fbar", "buttons", "contextmenu"].filter(p => {
                return this.selectedNode.findChild("text", p) == null;
            });
            this.menuPanelToolbars.add(tbs.map((item) => {
                return {
                    xtype: "menuitem",
                    text: item,
                    handler: addToolBar
                }
            }));
        });
    }

    initAddActionMenu() {
        var addAction = (item, e) => {
            var config = {
                actionId: item.text
            }
            var n = this.selectedNode.appendChild({
                nodeType: "node",
                text: Parser.genNodeText(config),
                iconCls: Parser.genNodeIcon(config)
            });
            n.attributes.config = new ComponentClass(n);
            Ext.apply(n.attributes.config, config);
        }
        this.actionsMenu = new Ext.menu.Menu();
        this.actionsMenu.on("beforeshow", () => {
            var tree: Ext.tree.TreePanel = <any>this.selectedNode.getOwnerTree();
            var actionNode = tree.getNodeById("actions");
            this.actionsMenu.removeAll(true);
            this.actionsMenu.add(actionNode.childNodes.map(n => {
                return {
                    xtype: "menuitem",
                    text: n.attributes.config.actionId,
                    iconCls: n.attributes.iconCls,
                    handler: addAction
                }
            }));
        });
    }

    initStoresMenu() {
        var makeGrid = (menuitem, e) => {
            var n = this.selectedNode.appendChild({
                nodeType: "node"
            });
            n.attributes.config = new ComponentClass(n);
            Ext.apply(n.attributes.config, {
                xtype: "grid",
                ref: "newGrid",
                store: menuitem.node.attributes.config.storeId,
                columns: menuitem.node.attributes.config.fields.map((fld) => {
                    return {
                        header: fld.name,
                        dataIndex: fld.name
                    }
                })
            });
        }
        this.storesMenu = new Ext.menu.Menu();
        this.storesMenu.on("beforeshow", () => {
            var tree: Ext.tree.TreePanel = <any>this.selectedNode.getOwnerTree();
            var storesNode = tree.getNodeById("stores");

            this.storesMenu.removeAll(true);
            this.storesMenu.add(storesNode.childNodes.map(item => {
                return {
                    xtype: "menuitem",
                    text: item.text,
                    node: item,
                    handler: makeGrid
                }
            }));
        });
    }

    /* methods */
    on_aSetIdField_handler() {
        var thisConfig = this.selectedNode.attributes.config;
        var parentConfig = this.selectedNode.parentNode.attributes.config;

        parentConfig.idProperty = thisConfig.name;
    }


    initComponent() {
        this.initXTypesMenu();
        this.initLayoutMenu();
        this.initMenuPanelToolbars();
        this.initAddActionMenu();
        this.initStoresMenu();
        this.initRegionMenu();

        this.initActions();
        this.initGui();
        super.initComponent();
        this.autoConnect();
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