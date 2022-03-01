import {
    INodeAndOffset,
    INodeTriplet,
    INullNodeAndOffset,
    IRangeStartAndEnd,
} from "./types";

function formatAfterUserInput(range: Range, pattern: RegExp) {
    let { node, offset } = getStartNodeAndOffset(range);

    if (node === null || offset === null) {
        return;
    }

    const { start, end } = getStartAndEnd(node as Element);
    const { node: startNode, offset: startOffset } = start;
    const { node: endNode, offset: endOffset } = end;

    if (startNode !== node && startNode.textContent?.length !== undefined) {
        // Calculating the cursor position. If the previous node
        // is different from the current node, we add its text
        // length to the offset already defined.
        offset += startNode.textContent.length;
    }

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

    repositionCursorAfterUserInputFormat(range, parentData, offset);
}

function formatAfterNewParagraph(range: Range, pattern: RegExp) {
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
    const { node: parentParagraph, offset: offsetInParent } = parentAndOffset;
    const { active: node, start, end } = nodeTriplet;
    const { node: startNode, offset: startOffset } = start;
    const { node: endNode, offset: endOffset } = end;

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
    range.setStart(textNode, textNode.textContent?.length || 0);
    range.collapse(true);

    format(range, textNode, pattern);
}

function repositionCursorAfterUserInputFormat(
    range: Range,
    paragraphAndOffset: INodeAndOffset,
    offset: number
): void {
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

                if (child.nodeType === 3) {
                    range.setStart(child, offset);
                } else {
                    if (child.firstChild) {
                        range.setStart(child.firstChild, offset);
                    }
                }
                range.collapse(true);

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

                if (finalNode) {
                    range.setStart(finalNode, 0);
                } else {
                    range.setStart(span, 0);
                }

                range.collapse(true);
            }
        }
    }
}

function prepParagraphForReformatting(range: Range, paragraph: Element): Text {
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

        range.setStart(paragraph2, 0);
        range.collapse(true);
    } else {
        const textNode = document.createTextNode(keyboardKey);

        paragraph.appendChild(textNode);
        editor.appendChild(paragraph);

        range.setStart(textNode, 1);
        range.collapse(true);
    }
}

function pasteTextInEmptyEditor(editor: HTMLDivElement, textNode: Text): void {
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

    range.setStart(textNode, textNode.textContent?.length || 0);
    range.collapse(true);
}

function addNonBreakingSpace(range: Range, node: Node): void {
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

    range.setStart(textNode, 1);
    range.collapse(true);
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

function findNodeInParent(parent: Node, node: Node): number | undefined {
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

function getStartNodeAndOffset(
    range: Range
): INodeAndOffset | INullNodeAndOffset {
    let node = range.startContainer as Element;
    let offset = range.startOffset;

    if (node.tagName === "P") {
        /**
         * Addresses a behavior where if a user deletes
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
            range.setStart(node, 0);
            return { node: null, offset: null };
        }

        if (!(node.nodeType === 3)) {
            node = node.firstChild as Element;
        }

        if (node.textContent?.length !== undefined) {
            offset = node.textContent.length;
        }

        range.setStart(node, offset);
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
