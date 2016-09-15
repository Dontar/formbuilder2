/// <reference path="../typings/tsd.d.ts" />

import * as CM from "lib/codemirror-5.12/lib/codemirror";

import "css!lib/codemirror-5.12/lib/codemirror.css";
import "lib/codemirror-5.12/mode/meta";

import "lib/codemirror-5.12/addon/comment/comment";
import "lib/codemirror-5.12/addon/comment/continuecomment";

import "css!lib/codemirror-5.12/addon/dialog/dialog.css";
import "lib/codemirror-5.12/addon/dialog/dialog";

import "lib/codemirror-5.12/addon/edit/closebrackets";
import "lib/codemirror-5.12/addon/edit/closetag";
import "lib/codemirror-5.12/addon/edit/continuelist";
import "lib/codemirror-5.12/addon/edit/matchbrackets";
import "lib/codemirror-5.12/addon/edit/matchtags";
import "lib/codemirror-5.12/addon/edit/trailingspace";

import "lib/codemirror-5.12/addon/mode/loadmode";
import "lib/codemirror-5.12/addon/mode/simple";

import "lib/codemirror-5.12/addon/search/searchcursor";
import "lib/codemirror-5.12/addon/search/jump-to-line";
import "lib/codemirror-5.12/addon/search/match-highlighter";
import "lib/codemirror-5.12/addon/search/search";

import "lib/codemirror-5.12/addon/selection/active-line";
import "lib/codemirror-5.12/addon/selection/mark-selection";
import "lib/codemirror-5.12/addon/selection/selection-pointer";

import "lib/codemirror-5.12/addon/hint/anyword-hint";
import "lib/codemirror-5.12/addon/hint/css-hint";
import "lib/codemirror-5.12/addon/hint/html-hint";
import "lib/codemirror-5.12/addon/hint/javascript-hint";
import "css!lib/codemirror-5.12/addon/hint/show-hint.css";
import "lib/codemirror-5.12/addon/hint/show-hint";
import "lib/codemirror-5.12/addon/hint/sql-hint";
import "lib/codemirror-5.12/addon/hint/xml-hint";

import "css!lib/codemirror-5.12/theme/mdn-like.css";

export class SourceEditor extends Ext.BoxComponent {
    editor: CodeMirror.Editor;

    constructor(config?: Ext.BoxComponentConfig|CodeMirror.EditorConfiguration) {
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
