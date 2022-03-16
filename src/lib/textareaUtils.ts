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

import {
    INodeAndOffset,
    INodeTriplet,
    INullNodeAndOffset,
    IRangeStartAndEnd,
} from "./types";

function formatAfterUserInput(range: Range, pattern: RegExp) {
    /**
     * The main formatting function that handles what happens
     * when the user types some text into the editor.
     *
     * It works by constructing a triplet of nodes from the
     * current node where the user is adding the text, as well
     * as the previous and next nodes if they exist.
     */
    let { node, offset } = getCurrentNodeAndOffset(range);

    if (node === null || offset === null) {
        return;
    }

    const { start, end } = getStartAndEnd(node as Element);
    const { node: startNode, offset: startOffset } = start;
    const { node: endNode, offset: endOffset } = end;

    if (startNode !== node && startNode.textContent?.length !== undefined) {
        // Get the cursor position. If the previous node is
        // different from the current node, we add its text
        // length to the offset already retrieved from the
        // range.
        offset += startNode.textContent.length;
    }

    /**
     * Find where the node triplet is in the parent paragraph.
     */

    const parentParagraph = startNode.parentElement;

    if (!parentParagraph || parentParagraph.childNodes.length === 0) {
        return;
    }

    const offsetInParent = findNodeInParent(parentParagraph, startNode);

    if (offsetInParent === undefined) {
        return;
    }

    const parentData: INodeAndOffset = {
        node: parentParagraph,
        offset: offsetInParent,
    };

    const nodeTriplet: INodeTriplet = {
        active: node,
        start: {
            node: startNode,
            offset: startOffset,
        },
        end: {
            node: endNode,
            offset: endOffset,
        },
    };

    formatNodeTriplet(range, pattern, parentData, nodeTriplet);

    repositionCursorAfterUserInputFormat(parentData, offset);
}

function formatAfterNewParagraph(range: Range, pattern: RegExp) {
    /**
     * Handles formatting the text after the user presses
     * the Enter key.
     *
     * It retrieves the new paragraph that was created as
     * a result of pressing Enter, as well as the previous
     * paragraph, removes all formatting from them entirely
     * to ensure that formatting isn't applied to some text
     * that shouldn't be formatted, and finally it checks
     * both paragraphs and formats any text that needs to
     * be formatted.
     */
    const currentParagraph = getCurrentParagraph(range);

    const previousParagraph = currentParagraph?.previousElementSibling;

    if (previousParagraph) {
        const textNode = prepParagraphForReformatting(range, previousParagraph);

        format(range, textNode, pattern, previousParagraph);
    }

    if (currentParagraph) {
        const textNode = prepParagraphForReformatting(range, currentParagraph);

        format(range, textNode, pattern, currentParagraph);
    }
}

function formatNodeTriplet(
    range: Range,
    pattern: RegExp,
    parentAndOffset: INodeAndOffset,
    nodeTriplet: INodeTriplet
): void {
    /**
     * Helper function to format a node triplet made of
     * the current node where the user is adding the text
     * as well as the nodes before and after it.
     */
    const { node: parentParagraph, offset: offsetInParent } = parentAndOffset;
    const { active: node, start, end } = nodeTriplet;
    const { node: startNode, offset: startOffset } = start;
    const { node: endNode, offset: endOffset } = end;

    // Select all text in the three nodes and delete it
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);

    const text = range.toString();

    range.deleteContents();

    /**
     * Remove the nodes from their parent because
     * it looks like range.deleteContents() doesn't
     * always delete the nodes.
     */
    node.parentElement?.removeChild(node);
    startNode.parentElement?.removeChild(startNode);
    endNode.parentElement?.removeChild(endNode);

    range.setStart(parentParagraph, offsetInParent);
    range.collapse(true);

    const textNode = document.createTextNode(text);
    range.insertNode(textNode);

    setCursorPosition(textNode, textNode.textContent?.length || 0);

    format(range, textNode, pattern);
}

function repositionCursorAfterUserInputFormat(
    paragraphAndOffset: INodeAndOffset,
    offset: number
): void {
    /**
     * Resets the cursor position to where it was in the text
     * before the formatting was applied.
     *
     * It goes over the nodes that were added during the formatting
     * adding the length of each one of them until it reaches a node
     * that makes the length longer than the offset provided to
     * the function. It set the cursor to that node.
     */
    const { node: parentParagraph, offset: offsetInParent } =
        paragraphAndOffset;

    let currentLength = 0;
    for (let i = offsetInParent; i < parentParagraph.childNodes.length; i++) {
        const child = parentParagraph.childNodes[i];

        if (child.textContent?.length !== undefined) {
            if (currentLength + child.textContent.length < offset) {
                currentLength += child.textContent.length;
            } else {
                offset -= currentLength;

                let startNode: Node = child;
                if (child.nodeType !== 3) {
                    if (child.firstChild) {
                        startNode = child.firstChild;
                    }
                }

                setCursorPosition(startNode, offset);

                break;
            }
        }
    }
}

function format(
    range: Range,
    textNode: Text,
    pattern: RegExp,
    finalNode?: Element
): void {
    /**
     * The function that actually matches the text against the regex
     * pattern and applies the formatting to the text.
     *
     * It gets all matches in the text, then applies formatting to
     * each one of them in reverse order.
     *
     * The reason why the formatting should be applied in reverse
     * is because that formatting them the other way around would
     * make the indices calculated by the matchAll function invalid,
     * making it necessary to run the match function again on the
     * text that hasn't been formatted yet.
     */
    const matches = textNode.textContent?.matchAll(pattern);

    if (matches) {
        const matchArr = Array.from(matches).reverse();

        for (const match of matchArr) {
            const textMatch = match[1] || match[2] || match[3] || match[4];

            if (textMatch && match.index !== undefined) {
                const start =
                    match[0] === textMatch ? match.index : match.index + 1;

                range.setStart(textNode, start);
                range.setEnd(textNode, start + textMatch.length);

                const span = document.createElement("span");
                span.classList.add("highlight");

                range.surroundContents(span);

                let startNode: Node = span;
                if (finalNode) {
                    startNode = finalNode;
                }

                setCursorPosition(startNode, 0);
            }
        }
    }
}

function prepParagraphForReformatting(range: Range, paragraph: Element): Text {
    /**
     * Prepares a paragraph node for reformatting by removing
     * all child nodes from the paragraph and adding the text
     * as a plain text node with no formatting.
     */
    range.selectNodeContents(paragraph);

    const text = range.toString();

    range.deleteContents();

    while (paragraph.firstChild) {
        paragraph.removeChild(paragraph.firstChild);
    }

    const textNode = document.createTextNode(text);

    paragraph.appendChild(textNode);

    /**
     * We add a <br> element if the paragraph has no text
     * because if we don't the editor won't expand to include
     * the new paragraph
     */
    if (text.length === 0) {
        paragraph.appendChild(document.createElement("br"));
    }

    return textNode;
}

function insertParagraphOnEmptyEditor(
    editor: HTMLDivElement,
    keyboardKey: string
): void {
    /**
     * Inserts a paragraph when the user first starts typing
     * in the editor.
     *
     * If the user typed some text, then only 1 paragraph
     * would be added containing the text that the user
     * added.
     *
     * If the user pressed the Enter key, 2 paragraphs would
     * be added with no text in any of them.
     */
    const sel = document.getSelection();

    if (!sel) {
        return;
    }

    const range = sel.getRangeAt(0);

    if (!range) {
        return;
    }

    const paragraph = document.createElement("p");

    if (keyboardKey === "Enter") {
        paragraph.innerHTML = "<br>";

        const paragraph2 = document.createElement("p");
        paragraph2.innerHTML = "<br>";

        editor.appendChild(paragraph);
        editor.appendChild(paragraph2);

        setCursorPosition(paragraph2, 0);
    } else {
        const textNode = document.createTextNode(keyboardKey);

        paragraph.appendChild(textNode);
        editor.appendChild(paragraph);

        setCursorPosition(textNode, 1);
    }
}

function pasteTextInEmptyEditor(editor: HTMLDivElement, textNode: Text): void {
    /**
     * Handles pasting text in an empty editor. In this case, the text
     * initially gets pasted in a text node that is an immediate child
     * of the editor node.
     *
     * The function takes that text node and adds it as a child inside
     * a paragraph node.
     */
    const sel = document.getSelection();

    if (!sel) {
        return;
    }

    const range = sel.getRangeAt(0);

    if (!range) {
        return;
    }

    const paragraph = document.createElement("p");
    paragraph.appendChild(textNode);

    editor.appendChild(paragraph);

    setCursorPosition(textNode, textNode.textContent?.length || 0);
}

function addNonBreakingSpace(range: Range, node: Node): void {
    /**
     * Adds a text node with a non-breaking space character
     * after a formatted span element.
     */
    const spanElement = node.parentElement;

    if (!spanElement || !spanElement.parentElement) {
        return;
    }

    let offsetInParent = findNodeInParent(
        spanElement.parentElement,
        spanElement
    );

    if (offsetInParent === undefined) {
        return;
    }

    offsetInParent++;

    range.setStart(spanElement.parentElement, offsetInParent);
    range.collapse(true);

    const textNode = document.createTextNode("\u00A0");

    range.insertNode(textNode);

    setCursorPosition(textNode, 1);
}

function deleteAllEditorChildren(editor: HTMLDivElement): void {
    while (editor.firstChild) {
        editor.removeChild(editor.firstChild);
    }
}

function isDeletionEvent(inputType: string): boolean {
    return (
        inputType === "deleteContentBackward" ||
        inputType === "deleteContentForward" ||
        inputType === "deleteByCut"
    );
}

function setCursorPosition(node: Node, offset: number): void {
    /**
     * Sets the start container of the range and collapses
     * the range to the start.
     */
    const sel = document.getSelection();

    if (!sel) {
        return;
    }

    const range = sel.getRangeAt(0);

    if (!range) {
        return;
    }

    sel.removeAllRanges();

    range.setStart(node, offset);
    range.collapse(true);

    sel.addRange(range);
}

function findNodeInParent(parent: Node, node: Node): number | undefined {
    /**
     * Iterates over all child nodes of the parent looking
     * for the node.
     *
     * Returns the index of the node if found or undefined.
     */
    let offsetInParent: number | undefined;

    for (let i = 0; i < parent.childNodes.length; i++) {
        const child: ChildNode = parent.childNodes[i];

        if (child === node) {
            offsetInParent = i;
            break;
        }
    }

    return offsetInParent;
}

function getCurrentNodeAndOffset(
    range: Range
): INodeAndOffset | INullNodeAndOffset {
    /**
     * Calculates the current node from the start container
     * of the range.
     *
     * The start container is the node where the user is
     * adding the text.
     *
     * If the text node is the immediate child of the
     * paragraph, then it returns the text node as
     * the current node.
     *
     * Otherwise, it finds the immediate child of the
     * paragraph and returns it.
     */
    let node = range.startContainer as Element;
    let offset = range.startOffset;

    if (node.tagName === "P") {
        /**
         * Addresses a behavior where if the user deletes
         * the last character in a text node, the node
         * will be automatically deleted making the
         * parent paragraph the startContainer of the
         * range rather than any text node.
         */
        const lastChildBeforeOffset = node.childNodes[offset - 1] as Element;

        if (lastChildBeforeOffset) {
            node = lastChildBeforeOffset;
        } else {
            // Handles special case which occurs when
            // user deletes all text of a paragraph
            // without deleting the paragraph itself.
            // In this case, startContainer will be
            // the paragraph as well, but there will
            // be nothing to format, so we just set
            // the range to start of the paragraph
            // and return.
            setCursorPosition(node, 0);
            return { node: null, offset: null };
        }

        if (!(node.nodeType === 3)) {
            node = node.firstChild as Element;
        }

        if (node.textContent?.length !== undefined) {
            /**
             * In the case where startContainer is the paragraph,
             * we need to set the offset to the end of the text
             * node after we get it because the original offset
             * was for the location of the node in the parent
             * paragraph rather than the cursor position in the
             * text.
             */
            offset = node.textContent.length;
        }

        setCursorPosition(node, offset);
    }

    if (node.nodeType === 3) {
        // Check if the text node is the immediate child
        // of the paragraph. If not because it is formatted,
        // then set node to the span element which contains
        // the text node.
        if (node.parentElement?.tagName === "SPAN") {
            node = node.parentElement;
        }
    }

    return { node, offset };
}

function getStartAndEnd(currentNode: Element): IRangeStartAndEnd {
    /**
     * Calculate the previous and next nodes based on
     * the current node.
     */
    const prevNode =
        currentNode.previousSibling || currentNode.previousElementSibling;
    let nextNode = currentNode.nextSibling || currentNode.nextElementSibling;
    if (nextNode) {
        if (
            (nextNode as Element).tagName === "BR" ||
            ((nextNode as Element).tagName === "SPAN" &&
                !nextNode.textContent?.length)
        ) {
            if ((nextNode as Element).tagName === "SPAN") {
                nextNode.parentElement?.removeChild(nextNode);
            }

            nextNode = currentNode;
        }
    }

    const startNode = prevNode || currentNode;
    const startOffset = 0;
    const endNode = nextNode || currentNode;
    const endOffset =
        endNode.nodeType === 3 && endNode.textContent?.length !== undefined
            ? endNode.textContent.length
            : 1;

    const output: IRangeStartAndEnd = {
        start: {
            node: startNode,
            offset: startOffset,
        },
        end: {
            node: endNode,
            offset: endOffset,
        },
    };

    return output;
}

function getCurrentParagraph(range: Range): Element | undefined {
    /**
     * When the user presses Enter, the startContainer will be
     * different based on whether the user pressed Enter at the
     * end of a paragraph creating a new empty paragraph, or
     * in the middle of a paragraph to create a paragraph that
     * contains the remainder of the text.
     *
     * In the first case, the startContainer will be the new
     * paragraph. In the second case, the startContainer will
     * be the first text node of the new paragraph.
     */
    let currentParagraph: Element | undefined;
    if (range.startContainer.nodeType === 3) {
        const parentElement = range.startContainer.parentElement;

        if (!parentElement) {
            return undefined;
        }

        if (parentElement.tagName === "P") {
            currentParagraph = parentElement;
        } else {
            if (!parentElement.parentElement) {
                return undefined;
            }

            currentParagraph = parentElement.parentElement;
        }
    } else if ((range.startContainer as Element).tagName === "P") {
        currentParagraph = range.startContainer as Element;
    }

    return currentParagraph;
}

const textareaUtils = {
    formatAfterUserInput,
    formatAfterNewParagraph,
    insertParagraphOnEmptyEditor,
    pasteTextInEmptyEditor,
    addNonBreakingSpace,
    deleteAllEditorChildren,
    isDeletionEvent,
};

export default textareaUtils;
