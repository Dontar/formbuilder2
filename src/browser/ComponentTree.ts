var data: {classes: any[]} = require("./tpl/props2.json");

class Components {
    cls: string;
    path: string;
    xtype: string;

    nodeType: string = "async";
    depth: number;

    expanded: boolean = true;

    constructor(data: any) {
        this.cls = data.cls;
        this.path = data.path;
        this.xtype = data.xtype;
        this.depth = this.path.split("/").length;
    }

    get id(): string {
        return this.xtype;
    }

    get text(): string {
        return this.cls;
    }

    get children(): any[] {
        return data.classes.filter((item) => {
            return item.path.indexOf(this.path) != -1 && item.path.split("/").length == this.depth + 1;
        }).map((item) => {
            return new Components(item);
        });
    }
}

export function getRootCfg() {
    return new Components({
        "cls": "Ext.util.Observable",
        "path": "Ext.util.Observable",
        "xtype": "Ext.util.Observable"
    });
}