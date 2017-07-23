import * as PATH from "path";
import {remote, app} from "electron";
import * as FILE from "./filesys";
import {MainWindow} from "./FormBuilder"

class FileCommands {
    currentFileNode: Ext.tree.TreeNode;
    currentFile: Ext.tree.TreeNode;
    constructor(private appView: MainWindow) { }
    newFile(menuItem: Electron.MenuItem, win: Electron.BrowserWindow) {
        var node = this.currentFileNode;
        var n = node.appendChild({
            id: PATH.join(node.id, "New file"),
            text: "New file",
            leaf: true
        });
        node.expand();
        n.select();
        this.appView.fileEditor.triggerEdit.defer(100, this.appView.fileEditor, [n]);

    }
    newTSmain(menuItem: Electron.MenuItem, win: Electron.BrowserWindow) {
        var node = this.currentFileNode;
        var n = node.appendChild({
            id: PATH.join(node.id, "main.ts"),
            text: "main.ts",
            leaf: true
        });
        FILE.writeFile(n.id, require("./tpl/ts/main.tpl")).then(() => {
            node.expand();
            n.select();
            this.appView.fileEditor.triggerEdit.defer(100, this.appView.fileEditor, [n]);
        });

    }
    newTScontainer(menuItem: Electron.MenuItem, win: Electron.BrowserWindow) {
        var node = this.currentFileNode;
        var n = node.appendChild({
            id: PATH.join(node.id, "container.ts"),
            text: "container.ts",
            leaf: true
        });
        FILE.writeFile(n.id, require("./tpl/ts/container.tpl")).then(() => {
            node.expand();
            n.select();
            this.appView.fileEditor.triggerEdit.defer(100, this.appView.fileEditor, [n]);
        });

    }
    newTSpanel(menuItem: Electron.MenuItem, win: Electron.BrowserWindow) {
        var node = this.currentFileNode;
        var n = node.appendChild({
            id: PATH.join(node.id, "panel.ts"),
            text: "panel.ts",
            leaf: true
        });
        FILE.writeFile(n.id, require("./tpl/ts/panel.tpl")).then(() => {
            node.expand();
            n.select();
            this.appView.fileEditor.triggerEdit.defer(100, this.appView.fileEditor, [n]);
        });

    }
    newTSwindow(menuItem: Electron.MenuItem, win: Electron.BrowserWindow) {
        var node = this.currentFileNode;
        var n = node.appendChild({
            id: PATH.join(node.id, "window.ts"),
            text: "window.ts",
            leaf: true
        });
        FILE.writeFile(n.id, require("./tpl/ts/window.tpl")).then(() => {
            node.expand();
            n.select();
            this.appView.fileEditor.triggerEdit.defer(100, this.appView.fileEditor, [n]);
        });

    }
    newTSindex(menuItem: Electron.MenuItem, win: Electron.BrowserWindow) {
        var node = this.currentFileNode;
        var n = node.appendChild({
            id: PATH.join(node.id, "index.html"),
            text: "intex.html",
            leaf: true
        });
        FILE.writeFile(n.id, require("./tpl/ts/index.html.tpl")).then(() => {
            node.expand();
            n.select();
            this.appView.fileEditor.triggerEdit.defer(100, this.appView.fileEditor, [n]);
        });

    }
    newJS(menuItem: Electron.MenuItem, win: Electron.BrowserWindow) {
        var node = this.currentFileNode;
        var n = node.appendChild({
            id: PATH.join(node.id, "New_file.js"),
            text: "New_file.js",
            leaf: true
        });
        FILE.writeFile(n.id, require("./tpl/js/JSTemplate.tpl")).then(() => {
            node.expand();
            n.select();
            this.appView.fileEditor.triggerEdit.defer(100, this.appView.fileEditor, [n]);
        });
    }
    newFolder(menuItem: Electron.MenuItem, win: Electron.BrowserWindow) {
        var node = this.currentFileNode;
        FILE.stat(node.id).then((stats) => {
            if (stats.isDirectory()) {
                var n = node.appendChild({
                    id: PATH.join(node.id, "New folder"),
                    text: "New folder",
                    leaf: false
                });
                node.expand();
                n.select();
                this.appView.fileEditor.triggerEdit.defer(100, this.appView.fileEditor, [n]);
            }
        });
    }
    openFile(menuItem: Electron.MenuItem, win: Electron.BrowserWindow) {
        var dialog = remote.dialog;
        dialog.showOpenDialog(win, { properties: ["openFile"] }, (files) => { });
    }
    openFolder(menuItem: Electron.MenuItem, win: Electron.BrowserWindow) {
        var dialog = remote.dialog;
        dialog.showOpenDialog(win, { properties: ["openDirectory"] }, (files) => {
            this.appView.treeFiles.getRootNode().id = files[0];
            (<Ext.tree.AsyncTreeNode>this.appView.treeFiles.getRootNode()).reload();
        });
    }
    renameFileFolder(menuItem: Electron.MenuItem, win: Electron.BrowserWindow) {
        var node = this.currentFileNode;
        if (node) {
            this.appView.fileEditor.triggerEdit(node);
        }
    }
    deleteFileFolder(menuItem: Electron.MenuItem, win: Electron.BrowserWindow) {
        var node = this.currentFileNode;
        FILE.stat(node.id).then(
            stats => stats.isDirectory() ? FILE.rmdir(node.id) : FILE.unlink(node.id)
        ).then(
            () => { node.remove(true); },
            err => {
                Ext.Msg.setIcon(Ext.MessageBox.ERROR);
                Ext.Msg.alert("Error", err.message);
            }
        );
    }
    revertFile(menuItem: Electron.MenuItem, win: Electron.BrowserWindow) {
        this.appView.on_treeFiles_selectionchange(this.appView.treeFiles.getSelectionModel(), this.appView.currentFile);
    }
    closeFile(menuItem: Electron.MenuItem, win: Electron.BrowserWindow) {

    }
    saveFile(menuItem: Electron.MenuItem, win: Electron.BrowserWindow) {
        var selectedFile = this.currentFile;
        this.appView.saving = true;
        FILE.writeFile(selectedFile.id, this.appView.edSource.editor.getValue()).then(() => {
            this.appView.panelCenter.getComponent<Ext.Panel>(1).setTitle("Source");
            this.appView.edSource.editor.getDoc().clearHistory();
            this.appView.edSource.editor.getDoc().markClean();
            this.appView.saving = false;
        }, err => {
            Ext.MessageBox.setIcon(Ext.MessageBox.ERROR);
            Ext.Msg.alert("Error", err.message);
            this.appView.saving = false;
        });
    }
}

export function getMainMenu(appView: MainWindow) {
    var c = new FileCommands(appView);
    var fileMenu = remote.Menu.buildFromTemplate([
        {
            label: "New File",
            submenu: [
                {
                    label: "New JavaScript",
                    click: c.newJS.bind(c)
                }, {
                    label: "New TypeScript",
                    submenu: [
                        {label: "index", click: c.newTSindex.bind(c)},
                        {label: "main", click: c.newTSmain.bind(c)},
                        {label: "container", click: c.newTScontainer.bind(c)},
                        {label: "panel", click: c.newTSpanel.bind(c)},
                        {label: "window", click: c.newTSwindow.bind(c)}
                    ]
                    // click: c.newTS.bind(c)
                }, {
                    label: "Other...",
                    click: c.newFile.bind(c)
                }
            ]
        },
        {
            label: "New Folder",
            accelerator: "CmdOrCtrl+Shift+N",
            click: c.newFolder.bind(c)
        },
        {
            type: "separator"
        },
        // {
        //     label: "Open File...",
        //     accelerator: "Ctrl+O",
        //     click: c.openFile.bind(c)
        // },
        {
            label: "Open Folder...",
            accelerator: "Ctrl+Shift+O",
            click: c.openFolder.bind(c)
        },
        {
            type: "separator"
        },
        {
            label: "Save",
            accelerator: "Ctrl+S",
            click: c.saveFile.bind(c)
        },
        {
            type: "separator"
        },
        {
            label: "Rename",
            click: c.renameFileFolder.bind(c)
        },
        {
            label: "Revert File",
            click: c.revertFile.bind(c)
        },
        // {
        //     label: "Close File",
        //     click: c.closeFile.bind(c)
        // },
        {
            label: "Delete",
            click: c.deleteFileFolder.bind(c)
        },
        {
            type: "separator"
        },
        {
            label: "Exit",
            role: "close"
        }
    ]);
    var editMenu = remote.Menu.buildFromTemplate([
        {
            label: 'Undo',
            accelerator: 'CmdOrCtrl+Z',
            role: 'undo'
        },
        {
            label: 'Redo',
            accelerator: 'Shift+CmdOrCtrl+Z',
            role: 'redo'
        },
        {
            type: 'separator'
        },
        {
            label: 'Cut',
            accelerator: 'CmdOrCtrl+X',
            role: 'cut'
        },
        {
            label: 'Copy',
            accelerator: 'CmdOrCtrl+C',
            role: 'copy'
        },
        {
            label: 'Paste',
            accelerator: 'CmdOrCtrl+V',
            role: 'paste'
        },
        {
            label: 'Select All',
            accelerator: 'CmdOrCtrl+A',
            role: 'selectall'
        }
    ]);
    var viewMenu = remote.Menu.buildFromTemplate([
        {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click: function(item, focusedWindow) {
                if (focusedWindow)
                    focusedWindow.reload();
            }
        },
        {
            label: 'Toggle Full Screen',
            accelerator: (function() {
                if (process.platform == 'darwin')
                    return 'Ctrl+Command+F';
                else
                    return 'F11';
            })(),
            click: function(item, focusedWindow) {
                if (focusedWindow)
                    focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
            }
        },
        {
            label: 'Toggle Developer Tools',
            accelerator:  'F12',
            click: function(item, focusedWindow) {
                if (focusedWindow)
                    focusedWindow.webContents.openDevTools();
            }
        }
    ]);

    appView.treeFiles.getSelectionModel().on("selectionchange", (sender, node: Ext.tree.TreeNode) => {
        if (node) {
            c.currentFileNode = node;
            if (node.isLeaf()) c.currentFile = node;
            var m = fileMenu.items;
            (<any>m[0]).enabled = !node.isLeaf();
            (<any>m[1]).enabled = !node.isLeaf();
            (<any>m[5]).enabled = node.isLeaf() && appView.edSource.editor.getDoc().isClean();

        }
    });

    appView.treeFiles.on("contextmenu", (node, e) => {
        node.select();
        var [x, y] = e.getXY();
        setTimeout(() => {fileMenu.popup(remote.getCurrentWindow(), {x, y});});

        // e.stopEvent();
    });
    appView.treeFiles.on("containercontextmenu", (tree: Ext.tree.TreePanel, e) => {
        c.currentFileNode = tree.getRootNode();
        var [x, y] = e.getXY();
        (<any>fileMenu.items[0]).enabled = true;
        (<any>fileMenu.items[1]).enabled = true;
        setTimeout(() => {fileMenu.popup(remote.getCurrentWindow(), {x, y});});
        // e.stopEvent();
    });

    if (!appView.edSource.rendered) {
        appView.edSource.on("render", (sender: Ext.form.Field) => {
            var el = sender.getEl();
            el.on("contextmenu", (e: Ext.EventObject, el: HTMLElement) => {
                e.stopEvent();
                var [x, y] = e.getXY();
                editMenu.popup(remote.getCurrentWindow(), {x, y});
            });
        });
    } else {
        var el = appView.edSource.getEl();
        el.on("contextmenu", (e: Ext.EventObject, el: HTMLElement) => {
            e.stopEvent();
            var [x, y] = e.getXY();
            editMenu.popup(remote.getCurrentWindow(), {x, y});
        });
    }

    var mainMenu = new remote.Menu();
    mainMenu.append(new remote.MenuItem({ label: "File", submenu: fileMenu }));
    mainMenu.append(new remote.MenuItem({ label: "Edit", submenu: editMenu }));
    mainMenu.append(new remote.MenuItem({ label: "View", submenu: viewMenu }));
    return mainMenu;
}