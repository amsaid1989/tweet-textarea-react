/**
 * The MIT License (MIT)
 *
 * Copyright © 2022 Abdelrahman Said
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the “Software”), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
 * LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
 * OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import textareaUtils from "./textareaUtils";

function textareaBeforeInputListener(
    event: React.FormEvent<HTMLDivElement>,
    editorRef: React.MutableRefObject<HTMLDivElement | null>
): void {
    const selection = document.getSelection();

    if (!editorRef.current || !selection) {
        return;
    }

    const range = selection?.getRangeAt(0);

    if (!range) {
        return;
    }

    const selectedText = range?.toString();

    if (
        !range.collapsed &&
        selectedText &&
        selectedText.length === editorRef.current?.textContent?.length
    ) {
        /**
         * If the user has all the text in the editor selected and they
         * type something, then all the text and the child nodes of the
         * editor will be removed first, before the new text is added.
         */
        textareaUtils.deleteAllEditorChildren(editorRef.current);
    }

    if (editorRef.current?.childNodes.length === 0) {
        /**
         * Handles the special case where no child node exists in the
         * editor and the user types something. In this case, we want
         * a paragraph to be created first, so the text ends up added
         * to the paragraph rather than as an immediate child to
         * the editor.
         */
        event.preventDefault();

        const inputEvent = event as unknown as InputEvent;
        const data = inputEvent.data;
        const keyboardKey =
            data === "\n" || data === "\r" ? "Enter" : inputEvent.data;

        if (keyboardKey) {
            textareaUtils.insertParagraphOnEmptyEditor(
                editorRef.current,
                keyboardKey
            );
        }
    }

    if ((event as unknown as InputEvent).data === " ") {
        /**
         * Handles when user inputs a Space character by converting
         * the input using the unicode literal for the non-breaking
         * space.
         *
         * This is mainly to avoid an issue with Firefox where the
         * user would add a space character at the end of a formatted
         * node would sometimes get deleted, causing issues with
         * the formatting.
         */
        let node = range.startContainer;
        const { startOffset } = range;

        if (
            node.parentElement?.tagName === "SPAN" &&
            startOffset === node.textContent?.length
        ) {
            event.preventDefault();

            textareaUtils.addNonBreakingSpace(range, node);
        }
    }
}

function textareaInputListener(
    event: React.FormEvent<HTMLDivElement>,
    editorRef: React.MutableRefObject<HTMLDivElement | null>,
    pattern: RegExp,
    highlightClassName?: string
): void {
    const inputType = (event.nativeEvent as InputEvent).inputType;

    if (!editorRef.current || !inputType) {
        return;
    }

    if (editorRef.current.childNodes.length === 1) {
        if (
            textareaUtils.isDeletionEvent(inputType) &&
            editorRef.current?.textContent?.length === 0
        ) {
            /**
             * When user deletes all text in the editor, we remove
             * all of the editor's nodes and return. No formatting
             * will be required, because there is no text in the
             * editor.
             */
            textareaUtils.deleteAllEditorChildren(editorRef.current);
            return;
        } else if (
            inputType === "insertFromPaste" &&
            editorRef.current.childNodes[0].nodeType === 3
        ) {
            /**
             * Handles the special case when the user pastes text
             * into an empty editor. In this case, the text will
             * be added inside a text node that is an immediate
             * child to the editor. We need to remove that node,
             * add a paragraph to the editor, and then add that
             * text node into the paragraph.
             */
            const textNode = editorRef.current.childNodes[0] as Text;

            if (!textNode) {
                return;
            }

            textareaUtils.deleteAllEditorChildren(editorRef.current);

            textareaUtils.pasteTextInEmptyEditor(editorRef.current, textNode);
        }
    }

    const sel = document.getSelection();

    if (!sel) {
        return;
    }

    const range = sel.getRangeAt(0);

    if (!range) {
        return;
    }

    if (inputType === "insertParagraph") {
        /**
         * When user presses Enter, creating a new paragraph, recalculate
         * the formatting for the current and previous paragraphs
         */
        textareaUtils.formatAfterNewParagraph(
            range,
            pattern,
            highlightClassName
        );
    } else {
        textareaUtils.formatAfterUserInput(range, pattern, highlightClassName);
    }

    editorRef.current.normalize();
}

const textareaListeners = {
    textareaBeforeInputListener,
    textareaInputListener,
};

export default textareaListeners;
