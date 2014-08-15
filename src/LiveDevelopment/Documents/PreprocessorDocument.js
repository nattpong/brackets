/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */

/**
 * PreprocessorDocument manages a single LESS or SASS source document
 *
 * __HIGHLIGHTING__
 *
 * PreprocessorDocument supports highlighting all DOMNode corresponding to the rule at 
 * the cursor position in the editor.
 *
 */
define(function PreprocessorDocumentModule(require, exports, module) {
    "use strict";

    var _               = require("thirdparty/lodash"),
        CSSUtils        = require("language/CSSUtils"),
        EditorManager   = require("editor/EditorManager"),
        HighlightAgent  = require("LiveDevelopment/Agents/HighlightAgent"),
        Inspector       = require("LiveDevelopment/Inspector/Inspector");

    /**
     * @constructor
     * @param {!Document} doc The source document from Brackets
     * @param {?Editor} editor The editor for this document. This is not used here since
     *                  we always need to get the active editor for a preprocessor document
     *                  and not the one passed in `editor`.
     */
    var PreprocessorDocument = function PreprocessorDocument(doc, editor) {
        this.doc = doc;

        this.onCursorActivity = this.onCursorActivity.bind(this);

        // Add a ref to the doc since we're listening for change events
        this.doc.addRef();
        this.onActiveEditorChange = this.onActiveEditorChange.bind(this);
        $(EditorManager).on("activeEditorChange", this.onActiveEditorChange);
        this.onActiveEditorChange(null, EditorManager.getActiveEditor(), null);
    };

    /** Close the document */
    PreprocessorDocument.prototype.close = function close() {
        $(this.doc).off(".PreprocessorDocument");
        $(EditorManager).off("activeEditorChange", this.onActiveEditorChange);
        this.doc.releaseRef();
        this.detachFromEditor();
    };

    PreprocessorDocument.prototype.attachToEditor = function (editor) {
        this.editor = editor;
        
        if (this.editor) {
            $(this.editor).on("cursorActivity.PreprocessorDocument", this.onCursorActivity);
            this.updateHighlight();
        }
    };
    
    PreprocessorDocument.prototype.detachFromEditor = function () {
        if (this.editor) {
            HighlightAgent.hide();
            $(this.editor).off(".PreprocessorDocument");
            this.editor = null;
        }
    };

    PreprocessorDocument.prototype.updateHighlight = function () {
        if (Inspector.config.highlight && this.editor) {
            var editor = this.editor,
                codeMirror = editor._codeMirror,
                selectors = [];
            _.each(this.editor.getSelections(), function (sel) {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, (sel.reversed ? sel.end : sel.start));
                if (selector) {
                    selectors.push(selector);
                }
            });
            if (selectors.length) {
                HighlightAgent.rule(selectors.join(","));
            } else {
                HighlightAgent.hide();
            }
        }
    };
    
    /** Event Handlers *******************************************************/

    /** Triggered on cursor activity of the editor */
    PreprocessorDocument.prototype.onCursorActivity = function onCursorActivity(event, editor) {
        this.updateHighlight();
    };

    /** Triggered when the active editor changes */
    PreprocessorDocument.prototype.onActiveEditorChange = function (event, newActive, oldActive) {
        this.detachFromEditor();
        
        if (newActive && newActive.document === this.doc) {
            this.attachToEditor(newActive);
        }
    };
    
    // Export the class
    module.exports = PreprocessorDocument;
});
