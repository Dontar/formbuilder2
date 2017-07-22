import * as CM from "codemirror";

import "codemirror/lib/codemirror.css";
import "codemirror/mode/meta";

import "codemirror/addon/comment/comment";
import "codemirror/addon/comment/continuecomment";

import "codemirror/addon/dialog/dialog.css";
import "codemirror/addon/dialog/dialog";

import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/continuelist";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/edit/matchtags";
import "codemirror/addon/edit/trailingspace";

import "codemirror/addon/mode/loadmode";
import "codemirror/addon/mode/simple";

import "codemirror/addon/search/searchcursor";
import "codemirror/addon/search/jump-to-line";
import "codemirror/addon/search/match-highlighter";
import "codemirror/addon/search/search";

import "codemirror/addon/selection/active-line";
import "codemirror/addon/selection/mark-selection";
import "codemirror/addon/selection/selection-pointer";

import "codemirror/addon/hint/anyword-hint";
import "codemirror/addon/hint/css-hint";
import "codemirror/addon/hint/html-hint";
import "codemirror/addon/hint/javascript-hint";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/hint/sql-hint";
import "codemirror/addon/hint/xml-hint";

import "codemirror/theme/mdn-like.css";

export class SourceEditor extends Ext.BoxComponent {
    editor: CM.Editor;

    constructor(config?: Ext.BoxComponentConfig|CM.EditorConfiguration) {
        super(config);
        CM.modeURL = "lib/codemirror-5.12/mode/%N/%N";
    }

    onRender(ct, position) {
        super.onRender(ct, position);
        this.editor = CM(this.getEl().dom, Ext.apply(this.initialConfig, {
            matchTags: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            extraKeys: {"Ctrl-Space": "autocomplete"},
            autoCloseTags: true,
            highlightSelectionMatches: true,
            styleActiveLine: true,
            styleSelectedText: true,
            selectionPointer: true,
            theme: "mdn-like"
        }));
        this.editor.refresh();
    }
    onResize(adjWidth, adjHeight, rawWidth, rawHeight) {
        super.onResize(adjWidth, adjHeight, rawWidth, rawHeight);
        this.editor.setSize(adjWidth, adjHeight);
        this.editor.refresh();
    }
}
Ext.reg('sourceeditor', SourceEditor);
