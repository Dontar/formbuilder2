import * as Ext from "ext";
import * as CM from "codemirror";
import * as FS from "./filesys";
import * as nodeFS from "fs";
import * as PATH from "path";
import * as ELC from "electron";

import {SourceEditor} from "./SourceEditor";
import {Parser, ActionClass, StoreClass, StoreFieldClass, ColumnClass} from "./Parser";
import {ComponentMenu} from "./ComponentMenu";
import * as PropEditors from "./PropEditors";
import {PropEditorMenu} from "./PropEditorMenu";

import * as CT from "./ComponentTree";

var remote = ELC.remote;
var Menu = remote.Menu;

// var Range: typeof AceAjax.Range = ace.require("ace/range").Range;
// var Search: typeof AceAjax.Search = ace.require("ace/search").Search;
// var Document: typeof AceAjax.Document = ace.require("ace/document").Document;
// var EditSession: typeof AceAjax.EditSession = ace.require("ace/edit_session").EditSession;

interface IUserModel {

}

Ext.grid.PropertyRecord = Ext.data.Record.create([
    {name:'name',type:'string'},
    'value',
    {name: "type", type: "string"},
    {name: "class", type: "string"},
    {name: "order", type: "int"}
]);

class PropertyStoreHack extends Ext.grid.PropertyStore {
    store: Ext.data.Store<any>;
    private source: any;
    constructor(grid, source?) {
        super(grid, source);
        this.store = new Ext.data.GroupingStore({
            recordType : <any>Ext.grid.PropertyRecord,
            sortInfo: {field: "order", direction: "DESC"},
            groupDir:"DESC",
            groupField: "order"
        });
        this.store.on('update', this.onUpdate,  this);
        if(source){
            this.setSource(source);
        }
    }
    constructProps(xtype): any[] {
        // var xtype = (cfg.xtype)?cfg.xtype:(cfg.items)?"container":"box";
        var props = require("./tpl/props2.json");
        var xtypeDef = props.classes.find((item) => {
            return item.xtype == xtype;
        });
        if (xtypeDef) {
            var cfgs: any[] = [];
            var pth = (<string>xtypeDef.path).split("/");
            (<any[]>props.classes).filter((item) => {
                return pth.indexOf(item.xtype) != -1;
            }).forEach(item => {
                item.cfg.forEach(c => {
                    cfgs.push({
                        "class": item.cls,
                        order: pth.indexOf(item.xtype),
                        name: c.name,
                        type: c.type
                    });
                });
            });
            return cfgs;
        }
        return [];
    }
    setSource(o, xtype?) {
        this.source = o;
        this.store.removeAll();
        if (o) {
            if (!xtype) {
                xtype = (o.xtype)?o.xtype:(o.items)?"container":"box";
            }
            var data = [];
            this.constructProps(xtype).forEach(p => {
                if (
                    ["tbar", "bbar", "fbar", "items", "menu", "buttons", "columns", "node", "fields", "_node"].indexOf(p.name) == -1 &&
                    typeof o[p.name] !== "function"
                ) {
                    p.value = o[p.name];
                    if (p.value == undefined) {
                        p.value = Ext.ns(p.class).prototype[p.name];
                    }
                    if (!this.isEditableValue(p.value)) try {
                        p.value = JSON.stringify(p.value);
                    } catch (e) {
                        return;
                    }
                    data.push(new Ext.grid.PropertyRecord(p, p.name));
                }

            });

            this.store.loadRecords({ records: data }, {}, true);
        }
    }
}

Ext.grid.PropertyStore = PropertyStoreHack;

Ext.override(Ext.grid.PropertyGrid, {
    setSource(o, xtype) {
        this.propStore.setSource(o, xtype);
    }
});

Ext.override(Ext.grid.PropertyColumnModel, {
    getCellEditor(colIndex, rowIndex) {
        var p = this.store.getProperty(rowIndex),
            n = p.data.name,
            t: string = p.data.type,
            val = p.data.value;
        if(this.grid.customEditors[n]){
            return this.grid.customEditors[n];
        }
        if(Ext.isDate(val)){
            return this.editors.date;
        }else if(typeof val == 'number'){
            return this.editors.number;
        }else if(typeof val == 'boolean'){
            return this.editors['boolean'];
        }else{
            if (t.toLowerCase().indexOf("date") != -1) {
                return this.editors.date;
            } else if (t.toLowerCase().indexOf("number") != -1) {
                return this.editors.number;
            } else if (t.toLowerCase().indexOf("boolean") != -1) {
                return this.editors['boolean'];
            } else {
                return this.editors.string;
            }
        }
    }
});

Ext.override(Ext.grid.PropertyColumnModel, {
    renderProp(prop, meta, rec) {
        var cls = rec.data.class,
            vl = rec.data.value,
            dv = Ext.ns(cls).prototype[prop];
        if (vl != dv) {
            return `<b><i>${prop}</i></b>`;
        }
        return prop;
    }
});

class GroupingViewPlugin implements Ext.IExtPlugin {
    init(grid: Ext.grid.GridPanel) {
        grid.getView = function() {
        if (!this.view) {
            this.view = new Ext.grid.GroupingView(this.viewConfig);
        }

        return this.view;
        }
    }
}
Ext.preg("GroupingViewPlugin", GroupingViewPlugin);

Ext.reg("SearchField", (<any>Ext.ux.form).SearchField);

Ext.override((<any>Ext.ux.form).SearchField, {
    onTrigger1Click(){
        if(this.hasSearch){
            this.el.dom.value = '';
            this.store.clearFilter();
            this.triggers[0].hide();
            this.hasSearch = false;
        }
    },

    onTrigger2Click(){
        var v = this.getRawValue();
        if(v.length < 1){
            this.onTrigger1Click();
            return;
        }
        this.store.filter(this.paramName, v, true);
        this.hasSearch = true;
        this.triggers[0].show();
    }
});

export class MainWindow extends Ext.Viewport {
    /* refs */
        treeFiles: Ext.tree.TreePanel;
        panelCenter: Ext.TabPanel;
        panelDesign: Ext.Panel;
        comp254: Ext.TabPanel;
        treeStruct: Ext.tree.TreePanel;
        treeCmpList: Ext.tree.TreePanel;
        grdProps: Ext.grid.PropertyGrid;
        edFilter: Ext.Component;
/* refs */
    edSource: SourceEditor;

    storePropGrid: Ext.data.Store<any>;

    parser: Parser = new Parser();

    model: IUserModel & {
        [field: string]: any;
        assign?: (o: any) => void;
    }

    currentFile: Ext.tree.TreeNode;
    currentFileNode: Ext.tree.TreeNode;

    fileEditor: Ext.tree.TreeEditor;
    updatingSource: boolean;

    compMenu: ComponentMenu;

    _selectionBox: Ext.Element;
    get selectionBox(): Ext.Element {
        if (!this._selectionBox) {
            this._selectionBox = Ext.get("selectionBox");
            this._selectionBox.setVisibilityMode(Ext.Element.DISPLAY);
        }
        return this._selectionBox;
    }

    _mouseBox: Ext.Element;
    get mouseBox(): Ext.Element {
        if (!this._mouseBox) {
            this._mouseBox = Ext.get("mouseBox");
            this._mouseBox.setVisibilityMode(Ext.Element.DISPLAY);
        }
        return this._mouseBox;
    }

    /* methods */

    on_panelCenter_tabchange(sender, tab) {
        if (tab != this.panelDesign) {
            this.edSource.editor.refresh();
        }
    }

    on_panelDesign_afterrender() {
        var selectNodeByCompEl = (el: HTMLElement) => {
            var compEl = el, found = false;
            while (compEl != document.body) {
                if (compEl.id.indexOf("ext-comp") != -1) {
                    found = true;
                    break;
                }
                compEl = compEl.parentElement;
            }
            if (found) {
                var comp = Ext.getCmp<Ext.BoxComponent>(compEl.id);
                if (comp) {
                    if ((<any>comp)._node) {
                        this.treeStruct.getNodeById((<any>comp)._node).select();
                    }
                }
            }
        }

        this.mouseBox.show();
        setTimeout(() => {
            this.mouseBox.alignTo(this.panelDesign.el, "tl-tl");
            this.mouseBox.setSize(this.panelDesign.el.getSize())
            this.panelDesign.on("resize", () => {
                this.mouseBox.alignTo(this.panelDesign.el, "tl-tl");
                this.mouseBox.setSize(this.panelDesign.el.getSize())
            });

        }, 500)
        this.mouseBox.on("click", (e: Ext.EventObject, el: HTMLElement) => {
            this.mouseBox.hide();
            var htmlEl = document.elementFromPoint(e.getPageX(), e.getPageY());
            this.mouseBox.show();
            selectNodeByCompEl(<HTMLElement>htmlEl);
            (<HTMLElement>htmlEl).click();
        });
        this.mouseBox.on("contextmenu", (e: Ext.EventObject, el: HTMLElement) => {
            this.mouseBox.hide();
            var htmlEl = document.elementFromPoint(e.getPageX(), e.getPageY());
            this.mouseBox.show();
            e.preventDefault();
            selectNodeByCompEl(<HTMLElement>htmlEl);
            setTimeout(() => {
                this.compMenu.updateMenusState(this.treeStruct.getSelectionModel().getSelectedNode());
                this.compMenu.showAt(e.getXY());
            }, 0);
        });


        // this.panelDesign.el.on("click", (e: Ext.EventObject, el: HTMLElement) => {
        //     e.preventDefault();
        //     selectNodeByCompEl(el);
        // });
        // this.panelDesign.el.on("contextmenu", (e: Ext.EventObject, el) => {
        // });
    }
    on_panelDesign_deactivate() {
        this.selectionBox.hide();
        this.mouseBox.hide();
    }
    on_panelDesign_activate() {
        var node = this.treeStruct.getSelectionModel().getSelectedNode();
        if (node) {
            this.selectionBox.show();
        }
        this.mouseBox.show();
    }

    on_fileEditor_complete(sender: Ext.tree.TreeEditor, newVal, oldVal) {
        var stat;
        var newName: any = PATH.parse(sender.editNode.id);
        newName.base = newVal;
        newName = PATH.format(newName);
        FS.stat(sender.editNode.id).then(() => {
            return FS.rename(sender.editNode.id, newName);
        }, () => {
            if (this.treeFiles.getSelectionModel().getSelectedNode().isLeaf()) {
                return FS.writeFile(newName, "");
            } else {
                return FS.mkdir(newName);
            }
        }).then(() => {
            sender.editNode.setId(newName);
        });
    }

    refreshFromUserEdit: Ext.util.DelayedTask = new Ext.util.DelayedTask(() => {
        var data = this.edSource.editor.getValue();
        try {
            if (data.search(/\/\* (?:designer|actDef|stores) \*\//) > -1) {
                this.parser.parseSource(this.treeStruct.getRootNode(), data);
                this.grdProps.setSource(null);
                this.panelDesign.removeAll(true);
                this.panelDesign.update("");

                this.panelDesign.add(this.parser.getGui());
                if (!this.panelDesign.hidden) {
                    this.panelDesign.doLayout();
                }
            }
        } catch (e) {
            this.panelDesign.removeAll(true);
            this.panelDesign.update(`<h3>${(<Error>e).message}</h3><div>${((<Error>e).stack || "").split("\n").join("<br/>")}</div>`);
        }
    });
    // onFileEdit(e: AceAjax.EditorChangeEvent) {
    onFileEdit(e) {
        setTimeout((updatingSource) => {
            if (!this.edSource.editor.getDoc().isClean()) {
                this.panelCenter.getComponent<Ext.Panel>(1).setTitle("*Source");
                if (!updatingSource)
                    this.refreshFromUserEdit.delay(1500);
            } else {
                this.panelCenter.getComponent<Ext.Panel>(1).setTitle("Source");
            }
        }, 0, this.updatingSource);
    }

    on_treeFiles_beforeselect(sender, newNode, oldNode) {
        if (!this.edSource.editor.getDoc().isClean()) {
            Ext.Msg.confirm("Warning", "You have unsaved changes. Do you want to save them?", (btn) => {
                if (btn == "yes") {
                    FS.writeFile(oldNode.id, this.edSource.editor.getValue()).then(() => {
                        this.panelCenter.getComponent<Ext.Panel>(1).setTitle("Source");
                        this.edSource.editor.getDoc().markClean();
                        newNode.select();
                    }, err => {
                        Ext.MessageBox.setIcon(Ext.MessageBox.ERROR);
                        Ext.Msg.alert("Error", err.message);
                    });
                }
            });
            return false;
        }
    }

    saving: boolean = false;
    refreshFromFileWatch(e, filename: string) {
        if (!this.saving) {
            if (!this.edSource.editor.getDoc().isClean()) {
                Ext.Msg.confirm("Warning", "You have unsaved changes. Do you want to save them?", (btn) => {
                    if (btn == "yes") {
                        FS.writeFile(this.currentFile.id, this.edSource.editor.getValue()).then(() => {
                            this.panelCenter.getComponent<Ext.Panel>(1).setTitle("Source");
                            this.edSource.editor.getDoc().markClean();
                            this.refreshFromFileSelect.delay(10);
                        }, err => {
                            Ext.MessageBox.setIcon(Ext.MessageBox.ERROR);
                            Ext.Msg.alert("Error", err.message);
                        });
                    }
                });
            } else {
                this.refreshFromFileSelect.delay(10);
            }
        }
    }

    fsWatcher: nodeFS.FSWatcher;

    refreshFromFileSelect: Ext.util.DelayedTask = new Ext.util.DelayedTask(() => {
        var refreshDesign = (data: string) => {
            try {
                if (data.search(/\/\* (?:designer|actDef|stores) \*\//) > -1) {
                    this.parser.parseSource(this.treeStruct.getRootNode(), data);
                    this.grdProps.setSource(null);
                    this.panelDesign.add(this.parser.getGui());
                    if (!this.panelDesign.hidden) {
                        this.panelDesign.doLayout();
                    }
                } else {
                    this.parser.isParsing = true;
                    this.treeStruct.getRootNode().removeAll();
                    this.parser.isParsing = false;
                }
            } catch (e) {
                this.panelDesign.removeAll(true);
                this.panelDesign.update(`<h3>${(<Error>e).message}</h3><div>${(<Error>e).stack.split("\n").join("<br/>")}</div>`);
            }
        }
        this.panelDesign.removeAll(true);
        this.panelDesign.update("");

        FS.readFile(this.currentFile.id).then((data) => {
            var mode = CM.findModeByExtension(PATH.extname(this.currentFile.id).slice(1));
            if (mode) {
                CM.requireMode(mode.mode, () => {
                    this.edSource.editor.setOption('mode', mode.mime);
                });
            } else {
                this.edSource.editor.setOption('mode', null);
            }
            this.updatingSource = true;
            this.edSource.editor.setValue(data);
            this.edSource.editor.getDoc().clearHistory();
            this.edSource.editor.getDoc().markClean();
            refreshDesign(data);
            this.onFileEdit(null);
            this.updatingSource = false;

            if (this.fsWatcher) {
                this.fsWatcher.close();
            }
            this.fsWatcher = nodeFS.watch(this.currentFile.id, this.refreshFromFileWatch.bind(this));
        });
    });

    on_treeFiles_selectionchange(sender, node: Ext.tree.TreeNode) {
        if (!node) return;
        this.currentFileNode = node;
        if (node.isLeaf()) {
            this.currentFile = node;
            this.selectionBox.hide();
            this.refreshFromFileSelect.delay(100);
        }
    }

    on_treeStruct_selectionchange(sender, node: Ext.tree.TreeNode) {
        if (node) {

            setTimeout(() => {
                var xtype, cfg = node.attributes.config;
                if (cfg instanceof ActionClass) {xtype = "Ext.Action"}
                if (cfg instanceof StoreClass) {xtype = cfg.xtype || "store"}
                if (cfg instanceof StoreFieldClass) {xtype = "Ext.data.Field"}
                if (cfg instanceof ColumnClass) {xtype = cfg.xtype || "gridcolumn"}

                (<any>this.grdProps).setSource(node.attributes.config || {}, xtype);
            }, 100);
            // this.grdProps.setSource(this.constructPropObj(node.attributes.config || {}));

            if (node.attributes.compId && this.panelCenter.getActiveTab() == this.panelDesign) try {
                var cmp = Ext.getCmp<Ext.BoxComponent>(node.attributes.compId);
                if (cmp.ownerCt && cmp.ownerCt instanceof Ext.TabPanel) {
                    (<Ext.TabPanel>cmp.ownerCt).setActiveTab(cmp);
                }
                // this.selectionBox = !this.selectionBox?Ext.get("selectionBox"):this.selectionBox;
                this.selectionBox.show();
                if (cmp.el) {
                    this.selectionBox.dom.style.zIndex = cmp.el.dom.style.zIndex + 1;
                }
                this.selectionBox.setBox(cmp.getBox(), true);
            } catch (e) {
                console.error(e);
            }
        }
    }

    getSrcPartRange(part: "refs" | "actions" | "stores" | "designer" | "intf"): CM.Range {
        var doc = this.edSource.editor.getDoc();
        var range = this.search(new RegExp(Parser.regExps[part], "g"));
        if (range) {
            range.from.ch += Parser.marker[part].length;
            range.to.ch -= Parser.marker[part].length;
            range.from = doc.clipPos(range.from);
            range.to = doc.clipPos(range.to);
        }
        return range;
    }

    updateSource() {
        this.updatingSource = true;
        try {
            var doc = this.edSource.editor.getDoc(), range;

            this.edSource.editor.operation(() => {

                if (range = this.getSrcPartRange("intf")) {
                    doc.replaceRange(this.parser.getStoresInterface(), range.from, range.to);
                }
                if (range = this.getSrcPartRange("refs")) {
                    doc.replaceRange(this.parser.getRefsSource(PATH.parse(this.currentFile.id).ext), range.from, range.to);
                }
                if (range = this.getSrcPartRange("actions")) {
                    doc.replaceRange(this.parser.getActionsSource(), range.from, range.to);
                }
                if (range = this.getSrcPartRange("stores")) {
                    doc.replaceRange(this.parser.getStoresSource(), range.from, range.to);
                }
                if (range = this.getSrcPartRange("designer")) {
                    doc.replaceRange(this.parser.getCompSource(), range.from, range.to);
                }
            });

        } finally {
            this.updatingSource = false;
        }
    }

    updateDesignPanel() {
        if (!this.parser.isParsing /*&& node.isAncestor(this.parser.componentsNode)*/) {
            (() => {
                this.panelDesign.removeAll(true);
                this.panelDesign.update("");
                try {
                    this.panelDesign.add(this.parser.getGui());
                    if (!this.panelDesign.hidden) {
                        this.panelDesign.doLayout();
                    }
                } catch (e) {
                    this.panelDesign.removeAll(true);
                    this.panelDesign.update(`<h3>${(<Error>e).message}</h3><div>${((<Error>e).stack || "").split("\n").join("<br/>")}</div>`);
                }
                this.updateSource();
            }).defer(300);
        }
    }

    search(needle: string | RegExp): CM.Range {
        var regExp;
        if (typeof needle === "string") {
            regExp = new RegExp(Parser.esc(needle), "g");
        } else {
            regExp = needle;
        }
        var source = this.edSource.editor.getValue();
        var rgResult = regExp.exec(source);
        if (rgResult) {
            var doc = this.edSource.editor.getDoc();
            var from = doc.posFromIndex(rgResult.index);
            var to = doc.posFromIndex(regExp.lastIndex);
            return { from, to };
        }
    }

    addMethod(methodName: string, body?: string[]) {
        var doc = this.edSource.editor.getDoc();
        var range = this.search("/* methods */");
        if (range) {
            doc.setSelection(range.to);

            doc.replaceSelection([
                "",
                // `        ${methodName}() {`,
                `${methodName}() {`,
                "",
                // "        }",
                "}",
                ""
            ].join(doc.lineSeparator()), "end");
            this.edSource.editor.indentSelection();
        }
    }

    on_treeStruct_beforedblclick(node: Ext.tree.TreeNode, e: Ext.EventObject) {
        var cfg = (node.attributes.config || {});
        var doc = this.edSource.editor.getDoc();
        if (cfg.actionId) {
            var range = this.search(`on_${cfg.actionId}_handler`);
            if (range) {
                this.edSource.editor.scrollIntoView(range.from);
                doc.setSelection(range.from, range.to);
            } else {
                this.addMethod(`on_${cfg.actionId}_handler`);
            }
            return false;
        }
        if (cfg.storeId) {
            var range = this.search(new RegExp("storeId\\s*:\\s*" + `\"${cfg.storeId}\"`, "g"));
            if (range) {
                this.edSource.editor.scrollIntoView(range.from);
                doc.setSelection(range.from, range.to);
                return false;
            }
        }
        if (cfg.ref) {
            var range = this.search(new RegExp("ref\\s*:\\s*" + `\"${Parser.esc(cfg.ref)}\"`, "g"));
            if (range) {
                this.edSource.editor.scrollIntoView(range.from);
                doc.setSelection(range.from, range.to);
                return false;
            }
        }
    }

    on_compMenu_layoutchanged(node) {
        this.grdProps.setSource(node.attributes.config);
        this.updateDesignPanel();
    }

    on_treeStruct_append(tree, parent, node: Ext.tree.TreeNode, index) {
        this.updateDesignPanel();
    }

    on_treeStruct_remove(tree, parent, node) {
        this.updateDesignPanel();
    }

    on_treeStruct_movenode(tree, node, oldParent, newParent, index) {
        this.updateDesignPanel();
    }

    on_grdProps_beforepropertychange(src: any, prop: string, newVal, oldVal) {
        if (typeof newVal === "string") {
            if (/^[\[\{]/.test(newVal.trim())) {
                try {
                    src[prop] = JSON.parse(newVal);
                    this.storePropGrid.getById(prop).commit();
                    return false;
                } catch (e) {
                    src[prop] = newVal;
                }
            }
        }
    }

    on_storePropGrid_update(store, record, operation) {
        if (operation == Ext.data.Record.EDIT) {
            // var node = this.treeStruct.getSelectionModel().getSelectedNode();
            this.updateDesignPanel();
        }
    }

    on_storePropGrid_remove(store, record, index) {
        var node = this.treeStruct.getSelectionModel().getSelectedNode();
        node.attributes.config[record.id] = undefined;
        this.updateDesignPanel();
    }

    on_edSource_afterrender() {
        this.edSource.editor.on("change", this.onFileEdit.bind(this));
    }

    on_panelDesign_resize(sender, adjWidth, adjHeight, rawWidth, rawHeight) {
        var s = this.treeStruct.getSelectionModel();
        this.on_treeStruct_selectionchange(s, s.getSelectedNode());
    }

    private getFileTypeIcon(fileType: string) {
        var iconCls = "icon-" + fileType.substr(1);
        if (Ext.util.CSS.getRule("." + iconCls) != null) {
            return iconCls;
        }
        return undefined;
    }

    getDir(path: string, cb: (result, e) => void, scope?: any) {
        scope = scope || this;
        FS.readdir(path).then(files => {
            cb.call(scope, files.map(item => {
                return {
                    id: item.path,
                    text: item.name,
                    leaf: !item.stat.isDirectory(),
                    iconCls: this.getFileTypeIcon(PATH.extname(item.path))
                }
            }), { status: true });
        }, (err) => {
            cb.call(scope, null, err);
        });
    }

    initComponent() {

        Ext.form.DateField.prototype.altFormats += "|c";
        this.initActions();
        this.initStores();
        this.initGui();
        super.initComponent();

        this.initModel({ /* bind */ /* bind */ });

        this.storePropGrid = this.grdProps.getStore();
        (<any>this.edFilter).store = this.storePropGrid;

        this.fileEditor = new Ext.tree.TreeEditor(this.treeFiles, {
            xtype: "textfield"
        });
        this.compMenu = new ComponentMenu(this.treeStruct);

        this.treeFiles.getRootNode().setId((remote.process.argv.length > 1) ? remote.process.argv[1] : ".");
        var loader = this.treeFiles.getLoader();
        loader.directFn = this.getDir.bind(this);
        loader.baseAttrs = {
            singleClickExpand: true
        }
        this.treeFiles.getRootNode().expand();

        var treeSorter = new Ext.tree.TreeSorter(this.treeFiles, {
            folderSort: true
        });

        this.edSource = new SourceEditor(<CM.EditorConfiguration>{
            gutters: ["CodeMirror-linenumbers"],
            lineNumbers: true,
            indentUnit: 4
        });
        (<Ext.Container>this.panelCenter.items.item(1)).add(this.edSource);
        (<any>this.grdProps).customEditors = PropEditors.getPropEditors(this.treeStruct, this.grdProps);
        var propGridMenu = new PropEditorMenu(this.grdProps);
        this.autoConnect();

        var pcm: Ext.grid.PropertyColumnModel = <Ext.grid.PropertyColumnModel>this.grdProps.getColumnModel();
        pcm.setConfig([
            {header: pcm.nameText, width:50, sortable: true, dataIndex:'name', id: 'name', menuDisabled:true},
            {header: pcm.valueText, width:50, resizable:false, dataIndex: 'value', id: 'value', menuDisabled:true},
            {header: "Class", dataIndex: 'order', hidden: true, groupRenderer: (v, m, r) => {return r.data.class;}}
        ]);

        this.treeCmpList.setRootNode(CT.getRootCfg());

    }

    initActions() {
        var actions = /* actDef */[]/* actDef */;
        actions.forEach(action => {
            this[action.actionId] = new Ext.Action(action);
        });
    }

    initStores() {
        var stores = /* stores */[]/* stores */;
        stores.forEach(store => {
            var storeId = store.storeId;
            delete store.storeId;
            this[storeId] = Ext.create(store);
        });
    }

    initGui() {
        Ext.apply(this, this.processGui(/* designer */{
                layout:"border",
                items:[{
                        title:"Files",
                        animate:true,
                        autoScroll:true,
                        useArrows:true,
                        rootVisible:false,
                        root:{
                            nodeType:"async",
                            text:"Root",
                            id:"."
                        },
                        region:"west",
                        width:300,
                        split:true,
                        xtype:"treepanel",
                        ref:"treeFiles"
                    },{
                        region:"center",
                        activeTab:0,
                        deferredRender:false,
                        layoutOnTabChange:true,
                        xtype:"tabpanel",
                        ref:"panelCenter",
                        items:[{
                                title:"Design",
                                layout:"fit",
                                bodyStyle:"padding: 5px;background-color: #dfe8f6",
                                bodyBorder:false,
                                xtype:"panel",
                                ref:"../panelDesign"
                            },{
                                title:"Source",
                                layout:"fit",
                                xtype:"panel"
                            }]
                    },{
                        region:"east",
                        width:300,
                        layout:"border",
                        split:true,
                        xtype:"container",
                        items:[{
                                region:"north",
                                activeTab:0,
                                split:true,
                                height:400,
                                xtype:"tabpanel",
                                ref:"../comp254",
                                items:[{
                                        enableDD:true,
                                        animate:true,
                                        autoScroll:true,
                                        useArrows:true,
                                        rootVisible:false,
                                        root:{
                                            nodeType:"node",
                                            text:"Root",
                                            draggable:false,
                                            id:"root"
                                        },
                                        title:"Structure",
                                        xtype:"treepanel",
                                        ref:"../../treeStruct"
                                    },{
                                        title:"Components",
                                        autoScroll:true,
                                        xtype:"treepanel",
                                        ref:"../../treeCmpList"
                                    }]
                            },{
                                region:"center",
                                plugins:["GroupingViewPlugin"],
                                xtype:"propertygrid",
                                ref:"../grdProps",
                                tbar:[{
                                        xtype:"tbfill"
                                    },{
                                        fieldLabel:"Field Label",
                                        store:"storePropGrid",
                                        paramName:"name",
                                        xtype:"SearchField",
                                        ref:"../../../edFilter"
                                    }]
                            }]
                    }]
            }/* designer */));
    }

    processGui(config: any) {
        if (typeof config.actionId === "string") {
            return this[config.actionId];
        }

        if (typeof config.store === "string") {
            config.store = this[config.store];
        }

        ["tbar", "bbar", "fbar", "items", "menu", "buttons"].forEach(prop => {
            if (config[prop] != undefined) {
                config[prop] = config[prop].map(this.processGui.bind(this));
            }
        });

        return config;
    }

    initModel(bind: { [field: string]: Ext.form.Field }) {
        var model: any = this.model || {};
        model.assign = function (o) {
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
                Ext.apply(model, v);
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
    }
}

import {getMainMenu} from "./MainMenu";

Ext.onReady(() => {
    var appView = new MainWindow();
    Menu.setApplicationMenu(getMainMenu(appView));
});
