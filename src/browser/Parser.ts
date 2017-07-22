import {TypeMap} from "./TypeMap";
import * as ENC from "./Encoder";

type CompConf = Ext.ComponentConfig & { actionId?: string };

class BaseClass {
    [prop: string]: any;
    constructor(protected node: Ext.tree.TreeNode) { }
    get _node(): string {
        return this.node.id;
    }
    toJSON() {
        var json = Ext.apply({}, this);
        delete json.node;
        delete json.constructor;
        delete json.toJSON;
        return json;
    }
}

export class ActionClass extends BaseClass {
    get actionId() {
        return this.node.text;
    }
    set actionId(v) {
        this.node.setText(v);
    }
    get iconCls() {
        return this.node.attributes.iconCls;
    }
    set iconCls(v) {
        this.node.setIconCls(v);
    }
}

export class StoreClass extends BaseClass {
    set storeId(v) {
        this.node.attributes.storeId = v;
        this.node.setText(`${v}: ${this.xtype}`);
    }
    get storeId(): string {return this.node.attributes.storeId;}

    set xtype(v) {
        this.node.attributes.xtype = v;
        this.node.setText(`${this.storeId}: ${v}`);
    }
    get xtype(): string {return this.node.attributes.xtype;}

    set fields(v: any[]) {
        if (v) {
            v.forEach(f => {
                var fst = this.node.appendChild({
                    nodeType: "node",
                    iconCls: "icon-database_table",
                    text: `{${f.type}} ${f.name}`,
                    isTarget: false
                });
                fst.attributes.config = new StoreFieldClass(fst);
                Ext.apply(fst.attributes.config, f);
            });
        }

    }
    get fields(): any[] {
        return this.node.childNodes.map(node => node.attributes.config);
    }
}

export class StoreFieldClass extends BaseClass {
    set type(v) {
        this.node.attributes.type = v;
        this.node.setText(`{${v}} ${this.name}`);
    }
    get type(): string {return this.node.attributes.type || "auto";}
    set name(v) {
        this.node.attributes.name = v;
        this.node.setText(`{${this.type}} ${v}`);
    }
    get name(): string {return this.node.attributes.name;}
}

export class ColumnClass extends BaseClass {
    // icon-shape_align_top
    public get dataIndex() : string {
        return this.node.attributes.dataIndex;
    }
    public set dataIndex(v : string) {
        this.node.attributes.dataIndex = v;
        this.node.setText(this.header + ": " + v);
    }

    public get header() : string {
        return this.node.attributes.header;
    }
    public set header(v : string) {
        this.node.attributes.header = v;
        this.node.setText(v + ": " + this.dataIndex);
    }

    public get xtype() : string {
        return Ext.value(this.node.attributes.xtype, undefined);
    }
    public set xtype(v : string) {
        this.node.attributes.xtype = v;
    }
    public get editor(): any {
        if (this.node.firstChild) {
            return this.node.firstChild.attributes.config;
        }
        return;
    }
    public set editor(config: any) {
        // this.node.removeAll(true);
        var node = this.node.appendChild({
            nodeType: "node",
            text: Parser.genNodeText(config),
            iconCls: Parser.genNodeIcon(config)
        });
        node.attributes.config = new ComponentClass(node);
        Ext.apply(node.attributes.config, config);
    }
}

export class ComponentClass extends BaseClass{
    public set xtype(v) {
        this.node.attributes.xtype = v;
        if (!this.node.attributes.barNode) {
            this.node.setText(Parser.genNodeText(<any>this));
            this.node.setIconCls(Parser.genNodeIcon(this));
        }
        (<any>this.node).isTarget = Parser.isXType(v, "container");
    }
    public get xtype(): string {
        var v = this.node.attributes.xtype;
        return !Ext.isEmpty(v)?v:undefined;
    }

    public set ref(v) {
        this.node.attributes.ref = v;
        if (!this.node.attributes.barNode) {
            this.node.setText(Parser.genNodeText(<any>this));
        }
    }
    public get ref(): string {
        var r = this.node.attributes.ref;
        if (r) {
            r = r.split("/").pop();
            return (<any>"../").repeat(this.node.getDepth() - 3) + r;

        }
        return this.node.attributes.ref;
    }

    public set actionId(v) {
        this.node.attributes.actionId = v;
        this.node.setText(Parser.genNodeText(this));
        this.node.setIconCls(Parser.genNodeIcon(this));
    }
    public get actionId(): string {
        return this.node.attributes.actionId;
    }

    public get items() : any[] {
        var isGrid = Parser.isXType(this.xtype, "grid") || Parser.isXType(this.xtype, "listview") || Parser.isXType(this.xtype, "treepanel") || ["tree", "grid"].some((t) => {return this.xtype && this.xtype.indexOf(t) != -1});
        var canHaveMenu = Parser.isXType(this.xtype, "button") || Parser.isXType(this.xtype, "menuitem");
        if (!isGrid && !canHaveMenu) {
            var items = this.node.childNodes.filter(node => ["tbar", "bbar", "fbar", "buttons", "contextmenu"].indexOf(node.text) == -1).map(node => node.attributes.config);
            return items.length > 0 ? items : undefined;
        }
    }
    public set items(v : any[]) {
        if (Array.isArray(v)) {
            v.forEach(config => {
                var node = this.node.appendChild({
                    nodeType: "node",
                    text: Parser.genNodeText(config),
                    iconCls: Parser.genNodeIcon(config)
                });
                node.attributes.config = new ComponentClass(node);
                Ext.apply(node.attributes.config, config);
            });
        }
    }

    public get menu() : any[] {
        var isGrid = Parser.isXType(this.xtype, "grid") || Parser.isXType(this.xtype, "listview") || Parser.isXType(this.xtype, "treepanel") || ["tree", "grid"].some((t) => {return this.xtype && this.xtype.indexOf(t) != -1});
        var canHaveMenu = Parser.isXType(this.xtype, "button") || Parser.isXType(this.xtype, "menuitem");
        if (!isGrid && canHaveMenu) {
            var items = this.node.childNodes.map(node => node.attributes.config);
            return items.length > 0 ? items : undefined;
        }
    }

    public set menu(v : any[]) {
        if (Array.isArray(v)) {
            v.forEach(config => {
                var node = this.node.appendChild({
                    nodeType: "node",
                    text: Parser.genNodeText(config),
                    iconCls: Parser.genNodeIcon(config)
                });
                node.attributes.config = new ComponentClass(node);
                Ext.apply(node.attributes.config, config);
            });
        }
    }

    public get columns() : any[] {
        var isGrid = Parser.isXType(this.xtype, "grid") || Parser.isXType(this.xtype, "listview") || Parser.isXType(this.xtype, "treepanel") || ["tree", "grid"].some((t) => {return this.xtype && this.xtype.indexOf(t) != -1});
        if (isGrid) {
            var items = this.node.childNodes.filter(node => ["tbar", "bbar", "fbar", "buttons", "contextmenu"].indexOf(node.text) == -1).map(node => node.attributes.config);
            return items.length > 0 ? items : undefined;
        }
    }
    public set columns(v : any[]) {
        if (Array.isArray(v)) {
            v.forEach(config => {
                var node = this.node.appendChild({
                    nodeType: "node",
                    iconCls: "icon-shape_align_top"
                });
                node.attributes.config = new ColumnClass(node);
                Ext.apply(node.attributes.config, config);
            });
        }
    }

    public get tbar() : any[]|any {
        var barNode = this.node.findChildBy(n => n.text == "tbar");
        if (barNode) {
            if (barNode.attributes.config) {
                return barNode.attributes.config;
            } else {
                return barNode.childNodes.map(n => n.attributes.config);
            }
        }
    }
    public set tbar(v : any[]|any) {
        if (v !== undefined) {
            var barNode = this.node.appendChild({
                nodeType: "node",
                text: "tbar",
                draggable: false,
                barNode: "tbar"
            });
            if (v.items || v.xtype) {
                var c = barNode.attributes.config = new ComponentClass(barNode);
                Ext.apply(c, v);
            } else if (Array.isArray(v)) {
                v.forEach(bar => {
                    var n = barNode.appendChild({
                        nodeType: "node"
                    });
                    n.attributes.config = new ComponentClass(n);
                    Ext.apply(n.attributes.config, bar);
                });
            }
        }
    }

    public get bbar() : any[]|any {
        var barNode = this.node.findChildBy(n => n.text == "bbar");
        if (barNode) {
            if (barNode.attributes.config) {
                return barNode.attributes.config;
            } else {
                return barNode.childNodes.map(n => n.attributes.config);
            }
        }
    }
    public set bbar(v : any[]|any) {
        if (v !== undefined) {
            var barNode = this.node.appendChild({
                nodeType: "node",
                text: "bbar",
                draggable: false,
                barNode: "bbar"
            });
            if (v.items || v.xtype) {
                var c = barNode.attributes.config = new ComponentClass(barNode);
                Ext.apply(c, v);
            } else if (Array.isArray(v)) {
                v.forEach(bar => {
                    var n = barNode.appendChild({
                        nodeType: "node"
                    });
                    n.attributes.config = new ComponentClass(n);
                    Ext.apply(n.attributes.config, bar);
                });
            }
        }
    }

    public get fbar() : any[]|any {
        var barNode = this.node.findChildBy(n => n.text == "fbar");
        if (barNode) {
            if (barNode.attributes.config) {
                return barNode.attributes.config;
            } else {
                return barNode.childNodes.map(n => n.attributes.config);
            }
        }
    }
    public set fbar(v : any[]|any) {
            if (v !== undefined) {
            var barNode = this.node.appendChild({
                nodeType: "node",
                text: "fbar",
                draggable: false,
                barNode: "fbar"
            });
            if (v.items || v.xtype) {
                var c = barNode.attributes.config = new ComponentClass(barNode);
                Ext.apply(c, v);
            } else if (Array.isArray(v)) {
                v.forEach(bar => {
                    var n = barNode.appendChild({
                        nodeType: "node"
                    });
                    n.attributes.config = new ComponentClass(n);
                    Ext.apply(n.attributes.config, bar);
                });
            }
        }
    }

    public get buttons() : any[] {
        var barNode = this.node.findChildBy(n => n.text == "buttons");
        if (barNode) {
            return barNode.childNodes.map(n => n.attributes.config);
        }
    }
    public set buttons(v : any[]) {
        if (Array.isArray(v)) {
            var barNode = this.node.appendChild({
                nodeType: "node",
                text: "buttons",
                draggable: false
            });
            v.forEach(bar => {
                var n = barNode.appendChild({
                    nodeType: "node"
                });
                n.attributes.config = new ComponentClass(n);
                Ext.apply(n.attributes.config, bar);
            });
        }
    }
    public get contextmenu() : any[] {
        var barNode = this.node.findChildBy(n => n.text == "contextmenu");
        if (barNode) {
            return barNode.childNodes.map(n => n.attributes.config);
        }
    }
    public set contextmenu(v : any[]) {
        if (Array.isArray(v)) {
            var barNode = this.node.appendChild({
                nodeType: "node",
                text: "contextmenu",
                draggable: false
            });
            v.forEach(bar => {
                var n = barNode.appendChild({
                    nodeType: "node"
                });
                n.attributes.config = new ComponentClass(n);
                Ext.apply(n.attributes.config, bar);
            });
        }
    }


}

export class Parser {

    private actions: Ext.ActionConfig[];
    private stores: Ext.data.StoreConfig[];
    private components: CompConf;

    componentsNode: Ext.tree.TreeNode;
    storesNode: Ext.tree.TreeNode;
    actionNode: Ext.tree.TreeNode;

    isParsing: boolean = false;

    // static refs: any = {};

    static esc(val: string): string {
        return val.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
    }

    static designerMarker = "/* designer */";
    static storesMarker = "/* stores */";
    static actionsMarker = "/* actDef */";
    static refsMarker = "/* refs */";
    static intfMarker = "/* intf */";
    static marker = {
        "intf": Parser.intfMarker,
        "refs": Parser.refsMarker,
        "actions": Parser.actionsMarker,
        "stores": Parser.storesMarker,
        "designer": Parser.designerMarker
    }

    static designerReg: string = `(${Parser.esc(Parser.designerMarker)})([\\s\\S]*?)\\1`;
    static storeReg: string = `(${Parser.esc(Parser.storesMarker)})([\\s\\S]*?)\\1`;
    static actDefReg: string = `(${Parser.esc(Parser.actionsMarker)})([\\s\\S]*?)\\1`;
    static refsReg: string = `(${Parser.esc(Parser.refsMarker)})([\\s\\S]*?)\\1`;
    static intfReg: string = `(${Parser.esc(Parser.intfMarker)})([\\s\\S]*?)\\1`;
    static regExps = {
        "intf": Parser.intfReg,
        "refs": Parser.refsReg,
        "actions": Parser.actDefReg,
        "stores": Parser.storeReg,
        "designer": Parser.designerReg
    }

    private designerRe: RegExp = new RegExp(Parser.designerReg);
    private storeRe: RegExp = new RegExp(Parser.storeReg);
    private actDefRe: RegExp = new RegExp(Parser.actDefReg);

    parseSource(rootNode: Ext.tree.TreeNode, source: string) {
        var a, s, c;
        this.isParsing = true;
        try {
            rootNode.removeAll(true);
            this.actionNode = rootNode.appendChild({
                nodeType: "node",
                text: "Actions",
                id: "actions",
                draggable: false,
                isTarget: false
            });
            this.storesNode = rootNode.appendChild({
                nodeType: "node",
                text: "Stores",
                id: "stores"
            });
            this.componentsNode = rootNode.appendChild({
                nodeType: "node",
                text: "Components",
                id: "comps",
                draggable: false,
                isTarget: false
            });
            a = this.actDefRe.exec(source);
            s = this.storeRe.exec(source);
            c = this.designerRe.exec(source);
            if (a) {
                eval(`this.actions = ${a[2]};`);
                this.genActions(rootNode);
            }

            if (s) {
                eval(`this.stores = ${s[2]};`);
                this.genStores(rootNode);
            }

            if (c) {
                eval(`this.components = ${c[2]};`);
                this.genComponents(rootNode);
            }
        } finally {
            rootNode.expand(true);
            this.isParsing = false;
        }
    }

    genActions(rootNode: Ext.tree.TreeNode) {
        this.actions.forEach((action) => {
            var node = this.actionNode.appendChild({
                nodeType: "node",
                text: action.actionId,
                iconCls: "icon-font",
                isTarget: false
            });
            node.attributes.config = new ActionClass(node);
            Ext.apply(node.attributes.config, action);
        });
    }

    genStores(rootNode: Ext.tree.TreeNode) {
        this.stores.forEach((store) => {
            var st = this.storesNode.appendChild({
                nodeType: "node",
                iconCls: "icon-database",
                text: `${store.storeId}: ${store.xtype}`,
                draggable: false
            });
            st.attributes.config = new StoreClass(st);

            Ext.apply(st.attributes.config, store);

        });
    }

    static isXType(compXtype: string, xtype: string) {
        var comp, type;
        comp = Ext.ComponentMgr.types[compXtype || "component"] || Ext.Component;
        type = Ext.ComponentMgr.types[xtype];

        if (comp == type || comp.prototype instanceof type) return true;
        return false;
    }

    private isPanel(xtype: string) {
        return Parser.isXType(xtype, "panel");
    }

    private isContainer(xtype: string) {
        return Parser.isXType(xtype, "container");
    }

    static isGrid(xtype: string): boolean {
        return Parser.isXType(xtype, "grid") || Parser.isXType(xtype, "listview") || Parser.isXType(xtype, "treegrid");
    }

    static genNodeText(config: CompConf) {
        if (config.actionId) {
            return config.actionId;
        }

        if (config.xtype) {
            if (config.ref) {
                return config.ref.split("/").pop() + ": " + config.xtype + ((<any>config).bind ? ` [${(<any>config).bind}]`:'');
            }
            return config.xtype;
        } else if (config.ref) {
            return config.ref.split("/").pop();
        }

        return "component";
    }

    private genNodeText(config: CompConf) {
        return Parser.genNodeText(config);
    }

    private genNodeIcon(config) {
        return Parser.genNodeIcon(config);
    }

    static genNodeIcon(config) {
        if (config.actionId) {
            if (config.node) {
                var tree: Ext.tree.TreePanel = (<Ext.tree.TreeNode>config.node).getOwnerTree();
                var actionsNode = tree.getNodeById("actions").findChildBy(node => node.text == config.actionId);
                return actionsNode.attributes.iconCls || "icon-font";
            }
            return "icon-font";
        }

        if (Parser.isXType(config.xtype, "grid")) {
            return "icon-application_view_detail";
        }
        if (Parser.isXType(config.xtype, "treepanel")) {
            return "icon-application_side_tree";
        }
        if (Parser.isXType(config.xtype, "panel")) {
            return "icon-application_form";
        }
        if (Parser.isXType(config.xtype, "container")) {
            return "icon-application_form";
        }
        if (Parser.isXType(config.xtype, "field")) {
            return "icon-textfield_rename";
        }
        return "icon-application";
    }

    genComponents(rootNode: Ext.tree.TreeNode) {
        var n = this.componentsNode.appendChild({
            nodeType: "node",
            text: this.genNodeText(this.components),
            iconCls: this.genNodeIcon(this.components)
        });
        n.attributes.config = new ComponentClass(n);
        Ext.apply(n.attributes.config, this.components);
    }

    types = Ext.apply(Ext.apply({}, Ext.grid.Column.types), Ext.ComponentMgr.types);

    processGui(config: any, scope) {
        // config = Ext.apply({}, config);
        // var iconCls = (icon: string) => {
            // Ext.util.CSS.createStyleSheet(`.${icon} {background-image: url(images/${icon.slice(5)}.png) !important}`);
        // }

        // if (config.iconCls != undefined) {
        //     iconCls(config.iconCls);
        // }
// Ext.grid.Column.types
        if (!this.types[config.xtype || "box"]) {
            config.html = "Unknown xtype: " + config.xtype;
            config.xtype = ((config.items || []).length > 0)?"container":"box";
        }

        if (config.actionId != undefined) {
            return scope[config.actionId];
        }

        if (typeof config.store == "string") {
            config.store = scope[config.store];
        }

        ["tbar", "bbar", "fbar", "items", "menu", "buttons", "columns"].forEach(prop => {
            if (config[prop] != undefined) {
                if (Array.isArray(config[prop])) {
                    config[prop] = config[prop].map(item => this.processGui(item, scope));
                } else {
                    config[prop] = this.processGui(config[prop], scope);
                }
            }
        });
        if (Array.isArray(config.plugins)) {
            config.plugins = config.plugins.filter(plugin => {
                return this.pluginExists(plugin);
            });
        }

        return config;
    }

    private pluginExists(plugin: string|any): boolean {
        if (typeof plugin == "string") {
            return !!Ext.ComponentMgr.ptypes[plugin];
        } else {
            return !!Ext.ComponentMgr.ptypes[plugin.ptype];
        }
    }

    getStoreInterface(storeNode: Ext.tree.TreeNode) {
        return `\n    interface I${storeNode.attributes.config.storeId} {\n` + storeNode.childNodes.map<string>(n => {
            var cfg = n.attributes.config;
            var tp = "string";
            switch (cfg.type) {
                case "int":
                case "integer":
                case "float":
                    tp = "number";
                    break;
                case "bool":
                case "boolean":
                    tp = "boolean";
                    break;
                case "date":
                    tp = "Date";
                    break;
                default:
                    break;
            }

            return `        ${cfg.name}?: ${tp}`;
        }).join(",\n") + "\n    }";
    }

    getStoresInterface() {
        return this.storesNode.childNodes.map<string>(n => {
            return this.getStoreInterface(n);
        }).join("") + "\n";
    }

    getRefsSource(type?: string) {
        type = type || ".ts";
        var _each, config = {};
        if (this.componentsNode && this.componentsNode.childNodes.length > 0) {
            config = this.componentsNode.firstChild.attributes.config;
        }
        return "\n" + this.storesNode.childNodes.reduce((p, n) => {
            var cfg = n.attributes.config;
            var ref = cfg.storeId;
            if (type == ".ts") {
                p += `        ${ref}: ${TypeMap[cfg.xtype] || "Ext.data.Store"}<I${cfg.storeId}>;\n`;
            } else {
                p += `        /** @type {${TypeMap[cfg.xtype] || "Ext.data.Store"}} */\n        ${ref}: undefined,\n`;
            }

            return p;
        },  this.actionNode.childNodes.reduce((p, n) => {
            var cfg = n.attributes.config;
            var ref = cfg.actionId;
            if (type == ".ts") {
                p += `        ${ref}: Ext.Action;\n`;
            } else {
                p += `        /** @type {Ext.Action} */\n        ${ref}: undefined,\n`;
            }

            return p;
        }, (_each = (cfg) => {
            var p: string = "";
            if (cfg.ref) {
                var ref = cfg.ref.split("/").pop();
                if (type == ".ts") {
                    p = `        ${ref}: ${TypeMap[cfg.xtype] || "Ext.Component"};\n`;
                } else {
                    p = `        /** @type {${TypeMap[cfg.xtype] || "Ext.Component"}} */\n$        ${ref}: undefined,\n`;
                }

            }
            ["tbar", "bbar", "items", "menu"].forEach(prop => {
                if (typeof cfg[prop] !== "undefined") {
                    if (Array.isArray(cfg[prop])) {
                        cfg[prop].forEach(c => {
                            p += _each(c);
                        });
                    } else {
                        p += _each(cfg[prop]);
                    }
                }
            });

            return p;
        })(config)));
    }

    getActionsSource(): string {
        return ENC.encode(this.actionNode.childNodes.map(node => node.attributes.config), 4);
        // return JSON.stringify(this.actionNode.childNodes.map(node => node.attributes.config), null, 4);
    }

    getStoresSource(): string {
        return ENC.encode(this.storesNode.childNodes.map(node => node.attributes.config), 4);
        // return JSON.stringify(this.storesNode.childNodes.map(node => node.attributes.config), null, 4);
    }

    getCompSource(): string {
        return ENC.encode(this.componentsNode.firstChild.attributes.config, 4);
        // return JSON.stringify(this.componentsNode.firstChild.attributes.config, null, 4);
    }

    clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    getGui() {
        var scope = {}, config;

        if (this.storesNode) {
            this.storesNode.childNodes.forEach(st => {
                var stConfig = Ext.apply({}, st.attributes.config);
                var storeId = stConfig.storeId;
                delete stConfig.storeId;
                var Cls = Ext.ComponentMgr.types[stConfig.xtype] || Ext.data.JsonStore;
                scope[storeId] = new Cls(stConfig);
            });
        }
        if (this.actionNode) {
            this.actionNode.childNodes.forEach(action => {
                var act = Ext.apply({}, action.attributes.config);
                scope[act.actionId] = new Ext.Action(act);
            });
        }

        config = this.processGui(this.clone(this.componentsNode.firstChild.attributes.config), scope);
        if (config.xtype == "window") {
            config.floating = false;
        }
        var syncCompsAndNodes = (idx, comp, compId) => {
            if (comp._node) {
                var node = this.componentsNode.getOwnerTree<Ext.tree.TreePanel>().getNodeById(comp._node);
                if (node) {
                    node.attributes.compId = compId;
                }
            }
        }
        Ext.ComponentMgr.all.on("add", syncCompsAndNodes);
        var comp = Ext.create(config, "panel");
        Ext.ComponentMgr.all.un("add", syncCompsAndNodes);
        return comp;
    }

}