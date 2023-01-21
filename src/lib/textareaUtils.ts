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
	ICurorChangeDetail,
	INullCurorChangeDetail,
} from "./types";
import { validSymbolsExistPattern } from "./patterns";

function formatAfterUserInput(
	range: Range,
	pattern: RegExp,
	repeat: boolean,
	repeatCount: number,
	highlightClassName?: string
) {
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

	formatNodeTriplet(
		range,
		pattern,
		parentData,
		nodeTriplet,
		repeat,
		repeatCount,
		highlightClassName
	);

	repositionCursorInParagraph(parentData, offset);
}

function formatAfterNewParagraph(
	range: Range,
	pattern: RegExp,
	highlightClassName?: string
) {
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

		format(range, textNode, pattern, highlightClassName, previousParagraph);
	}

	if (currentParagraph) {
		const textNode = prepParagraphForReformatting(range, currentParagraph);

		format(range, textNode, pattern, highlightClassName, currentParagraph);
	}
}

function formatParagraphsAfterPasting(
	paragraphsToFormat: HTMLParagraphElement[],
	lastParagraphLength: number,
	range: Range,
	pattern: RegExp,
	highlightClassName?: string
): void {
	/**
	 * Format each paragraph
	 */
	paragraphsToFormat.forEach((node) => {
		if (node.firstChild && node.firstChild.nodeType === 3) {
			format(range, node.firstChild as Text, pattern, highlightClassName);
		}
	});

	const lastParagraph = paragraphsToFormat[paragraphsToFormat.length - 1];

	if (!lastParagraph) {
		return;
	}

	/**
	 * Calculate the final cursor position
	 */
	repositionCursorInParagraph(
		{ node: lastParagraph, offset: 0 },
		lastParagraphLength
	);
}

function formatNodeTriplet(
	range: Range,
	pattern: RegExp,
	parentAndOffset: INodeAndOffset,
	nodeTriplet: INodeTriplet,
	repeat: boolean,
	repeatCount: number,
	highlightClassName?: string
): void {
	/**
	 * Helper function to format a node triplet made of
	 * the current node where the user is adding the text
	 * as well as the nodes before and after it.
	 */

	if (repeat && repeatCount > 6) {
		return;
	}

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

	format(range, textNode, pattern, highlightClassName);
}

function formatAfterUpdatingTextFromParent(
	editor: HTMLDivElement,
	range: Range,
	pattern: RegExp,
	updatedText: string,
	highlightClassName?: string
): void {
	/**
	 * When the text is updated by the parent component, this function splits
	 * the text into paragraphs and adds them to textarea, formatting any parts
	 * that fit the RegExp pattern passed as an argument.
	 */

	const splitParagraphs = updatedText.split("\n");
	const paragraphElements = splitParagraphs.map((text) => {
		const p = document.createElement("p");
		p.textContent = text;
		p.appendChild(document.createElement("br"));
		return p;
	});

	paragraphElements.forEach((p) => {
		editor.appendChild(p);
	});

	for (let i = 0; i < editor.childNodes.length; i++) {
		const node = editor.childNodes[i];
		if (!node || (node.firstChild as Element).tagName === "BR") {
			continue;
		}

		format(range, node.firstChild as Text, pattern, highlightClassName);
	}
}

function format(
	range: Range,
	textNode: Text,
	pattern: RegExp,
	highlightClassName?: string,
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

	if (
		!textNode.textContent ||
		!textNode.textContent.match(validSymbolsExistPattern)
	) {
		return;
	}

	const matches = textNode.textContent.matchAll(pattern);

	if (!matches) {
		return;
	}

	const matchArr = Array.from(matches).reverse();

	if (matchArr.length === 0) {
		return;
	}

	for (const match of matchArr) {
		const textMatch = match[1] || match[2] || match[3] || match[4];

		if (textMatch && match.index !== undefined) {
			const start = match[0] === textMatch ? match.index : match.index + 1;

			range.setStart(textNode, start);
			range.setEnd(textNode, start + textMatch.length);

			const span = document.createElement("span");
			span.classList.add("highlight");
			span.classList.add(
				highlightClassName || "tweet-textarea-entity-highlighting"
			);

			range.surroundContents(span);

			let startNode: Node = span;
			if (finalNode) {
				startNode = finalNode;
			}

			setCursorPosition(startNode, 0);
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
		const text = keyboardKey === "Space" ? "\u00A0" : keyboardKey;

		const textNode = document.createTextNode(text);

		paragraph.appendChild(textNode);
		editor.appendChild(paragraph);

		setCursorPosition(textNode, 1);
	}
}

function addNonBreakingSpaceAfterFormattedElement(
	range: Range,
	node: Node
): void {
	/**
	 * Adds a text node with a non-breaking space character
	 * after a formatted span element.
	 */
	const spanElement = node.parentElement;

	if (!spanElement || !spanElement.parentElement) {
		return;
	}

	let offsetInParent = findNodeInParent(spanElement.parentElement, spanElement);

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

function repositionCursorInParagraph(
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
	const { node: parentParagraph, offset: offsetInParent } = paragraphAndOffset;

	let currentLength = 0;
	for (let i = offsetInParent; i < parentParagraph.childNodes.length; i++) {
		const child = parentParagraph.childNodes[i];

		if ((child as Element).tagName === "BR") {
			// Addresses an issue where the repositioning won't work correctly
			// if the cursor is supposed to be at the end of a paragraph
			++currentLength;
		}

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

function repositionCursorInTextarea(
	editor: HTMLDivElement,
	cursorPosition: ICurorChangeDetail
): void {
	/**
	 * Sets the cursor position to where the user wants it in the textarea.
	 * It is useful to set the cursor in the correct position, when it gets
	 * updated by the parent component.
	 *
	 * It works by adding the length of each paragraph in the editor and once
	 * the length goes over the start location passed in the cursorPosition
	 * argument, it means that the cursor should be in the current paragraph.
	 */

	if (editor.childNodes.length === 0) {
		return;
	}

	// TODO (Abdelrahman): Figure out if there is ever a need to extract the
	// end from the cursorPosition
	let { start } = cursorPosition;
	let startParagraph: ChildNode | undefined;

	let textLengthToEndOfCurrentParagraph = 0;
	for (let i = 0; i < editor.childNodes.length; i++) {
		const currentParagraph = editor.childNodes[i];

		if (
			currentParagraph.textContent === undefined ||
			currentParagraph.textContent?.length === undefined
		) {
			continue;
		}

		// NOTE (Abdelrahman): We add 1 to account for the newline character
		textLengthToEndOfCurrentParagraph +=
			currentParagraph.textContent.length + 1;

		if (textLengthToEndOfCurrentParagraph >= start) {
			startParagraph = currentParagraph;

			// We remove the length of the current paragraph to get the cursor
			// offset inside of it
			start -=
				textLengthToEndOfCurrentParagraph -
				(currentParagraph.textContent.length + 1);

			break;
		}
	}

	if (startParagraph === undefined) {
		return;
	}

	repositionCursorInParagraph({ node: startParagraph, offset: 0 }, start);
}

function appendTextToParagraph(
	paragraph: HTMLParagraphElement,
	text: string
): void {
	paragraph.textContent += text;

	if (
		paragraph.textContent?.length === 0 &&
		paragraph.childNodes.length === 0
	) {
		paragraph.appendChild(document.createElement("br"));
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

function getParentParagraph(node: Node): HTMLParagraphElement | null {
	/**
	 * Utility function to go up the node hierarchy looking for
	 * the parent paragraph of the node provided
	 */
	let parent: HTMLParagraphElement | null = null;

	if ((node as Element).tagName === "P") {
		return node as HTMLParagraphElement;
	}

	let currentNode = node;
	while (currentNode.parentElement) {
		if (currentNode.parentElement.tagName === "P") {
			parent = currentNode.parentElement as HTMLParagraphElement;
			break;
		} else {
			currentNode = currentNode.parentElement;
		}
	}

	return parent;
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

	if (node.tagName === "DIV") {
		/**
		 * Addresses a bug where when the user presses the
		 * Delete button (triggering the deleteContentForward
		 * event) in an empty paragraph, the startContainer of
		 * the range ends up being the editor node itself.
		 *
		 * In this case, since we don't need to do any formatting,
		 * we just set the cursor to the paragraph at the
		 * current offset and return an object with null node
		 * and null offset, so the formatting logic isn't
		 * triggered.
		 */
		const currentParagraph = node.childNodes[offset - 1];

		setCursorPosition(currentParagraph, currentParagraph.childNodes.length);

		return { node: null, offset: null };
	}

	if (node.tagName === "P") {
		/**
		 * Addresses a behavior where if the user deletes
		 * the last character in a text node, the node
		 * will be automatically deleted making the
		 * parent paragraph the startContainer of the
		 * range rather than any text node.
		 *
		 * It also handles the case when the user presses
		 * the Delete button, triggering the deleteContentForward
		 * event while at the start of a paragraph.
		 */
		const childIndex = offset - 1 >= 0 ? offset - 1 : 0;
		const lastChildBeforeOffset = node.childNodes[childIndex] as Element;

		if (lastChildBeforeOffset && lastChildBeforeOffset.tagName !== "BR") {
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

		if (offset > 0 && node.textContent?.length !== undefined) {
			/**
			 * In the case where startContainer is the paragraph,
			 * we need to set the offset to the end of the text
			 * node after we get it because the original offset
			 * was for the location of the node in the parent
			 * paragraph rather than the cursor position in the
			 * text.
			 *
			 * We only do that if the cursor wasn't at the beginning
			 * of the paragraph. If the cursor, was at the beginning
			 * of the paragraph (i.e. offset is 0), then we leave
			 * it as it is.
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

function getTextNodeAtStart(
	originNode: Node,
	startOffset: number
): INodeAndOffset | INullNodeAndOffset {
	const currentNode = getCurrentNodeFromOrigin(originNode, startOffset);

	if (!currentNode) {
		return { node: null, offset: null };
	}

	let finalOffset = 0;

	const textNode = findTextNode(currentNode);

	if (textNode) {
		if (startOffset === originNode.childNodes.length) {
			/**
			 * If the originNode isn't a text node and the startOffset
			 * is at the very end of the originNode, then we need to
			 * set the cursor to the end of the text node rather
			 * than the start
			 */
			if (textNode.textContent?.length !== undefined) {
				finalOffset = textNode.textContent.length;
			}
		}

		return { node: textNode, offset: finalOffset };
	}

	return { node: null, offset: null };
}

function getTextNodeAtEnd(
	originNode: Node,
	endOffset: number
): INodeAndOffset | INullNodeAndOffset {
	const currentNode = getCurrentNodeFromOrigin(originNode, endOffset);

	if (!currentNode) {
		return { node: null, offset: null };
	}

	const textNode = findTextNode(currentNode);

	if (textNode) {
		if (textNode.textContent?.length !== undefined) {
			return { node: textNode, offset: textNode.textContent.length };
		}
	}

	return { node: null, offset: null };
}

function getCurrentNodeFromOrigin(originNode: Node, offset: number): Node {
	/**
	 * Utility function that returns the current childNode of the originNode.
	 * If offset is at the end of the originNode, then it returns the last
	 * childNode, unless the last childNode is a line break element, then it
	 * returns the child before last.
	 */
	let index = offset === originNode.childNodes.length ? offset - 1 : offset;

	if ((originNode.childNodes[index] as Element).tagName === "BR") {
		index -= 1;
	}

	return originNode.childNodes[index];
}

function findTextNode(node: Node): Text | null {
	if (node.nodeType === 3) {
		return node as Text;
	}

	let current = node;

	while (current.firstChild) {
		if (current.firstChild.nodeType === 3) {
			return current.firstChild as Text;
		}

		current = node.firstChild as Node;
	}

	return null;
}

function sumTextLengthOfNodesArray(
	arr: Node[],
	initialValue: number = 0
): number {
	/**
	 * Utility function that calculates the text length of all the nodes in an
	 * array.
	 */

	return arr.reduce((curLength, p) => {
		if (p.textContent?.length === undefined) {
			return curLength;
		}

		return curLength + p.textContent.length;
	}, initialValue);
}

function sumTextLengthOfParagraphsArray(
	arr: HTMLParagraphElement[],
	parentElement: Element
): number {
	/**
	 * Utility function that calculates the text length of all paragraph
	 * elements in an array, taking into account the number of newline
	 * characters between these paragraph elements.
	 */

	// Calculate how many new line characters will be in the
	// text. If the cursor is at the last paragraph of the
	// textarea, then the number of new line characters will be
	// 1 subtracted from the number of paragraphs inside the
	// textarea, because the last paragraph won't have a new
	// line. Otherwise, it will be the number of all paragraphs
	// before the cursor position.
	const newlineCount =
		arr.length < parentElement.childNodes.length ? arr.length : arr.length - 1;

	return sumTextLengthOfNodesArray(arr, newlineCount);
}

function getTextLengthBeforeCurrentTextNode(
	textNode: Text,
	parentParagraph: HTMLParagraphElement
): number {
	/**
	 * Utililty function that calculates the text length of all the nodes
	 * before a selected text node in a paragraph.
	 * It returns the text length if the calculation is successful or a negative
	 * error code.
	 */

	const INVALID = -1;

	// Find the immediate child of the paragrpah. If the text node is formatted
	// then the immediate child would be its parent element. Otherwise, it
	// would be the text node itself.
	const paragraphImmediateChild =
		textNode.parentElement?.tagName === "P" ? textNode : textNode.parentElement;

	if (!paragraphImmediateChild) {
		return INVALID;
	}

	const immediateChildIndex = textareaUtils.findNodeInParent(
		parentParagraph,
		paragraphImmediateChild
	);

	if (immediateChildIndex === undefined) {
		return INVALID;
	}

	const nodesBeforeCurrent = Array.from(parentParagraph.childNodes).slice(
		0,
		immediateChildIndex
	);

	return sumTextLengthOfNodesArray(nodesBeforeCurrent, 0);
}

function getCurrentText(divElement: HTMLDivElement): string {
	const paragraphs = Array.from(divElement.childNodes);

	if (paragraphs.length === 0) {
		return "";
	}

	return paragraphs.map((p) => p.textContent).join("\n");
}

function getCursorLocation(
	divElement: HTMLDivElement,
	range: Range
): ICurorChangeDetail | INullCurorChangeDetail {
	let start: number;
	let end: number;

	if (divElement.childNodes.length === 0) {
		start = end = 0;

		return { start, end };
	}

	let { startContainer, startOffset, endContainer, endOffset } = range;

	if (startContainer === divElement) {
		const paragraphsBeforeStartOffset = Array.from(divElement.childNodes).slice(
			0,
			startOffset
		);

		if (paragraphsBeforeStartOffset.length === 0) {
			start = 0;
		} else {
			start = textareaUtils.sumTextLengthOfParagraphsArray(
				paragraphsBeforeStartOffset as HTMLParagraphElement[],
				divElement
			);
		}
	} else {
		/**
		 * GET THE START PARAGRAPH
		 */
		const startParagraph = textareaUtils.getParentParagraph(startContainer);

		if (!startParagraph) {
			return { start: null, end: null };
		}

		/**
		 * CALCULATE TEXT LENGTH BEFORE START PARAGRAPH
		 */
		const startPIndex = textareaUtils.findNodeInParent(
			divElement,
			startParagraph
		);

		if (startPIndex === undefined) {
			return { start: null, end: null };
		}

		const paragraphsBeforeStart = Array.from(divElement.childNodes).slice(
			0,
			startPIndex
		);

		if (paragraphsBeforeStart.length === 0) {
			start = 0;
		} else {
			start = textareaUtils.sumTextLengthOfParagraphsArray(
				paragraphsBeforeStart as HTMLParagraphElement[],
				divElement
			);
		}

		/**
		 * Add the length of all the nodes from the start of the current
		 * paragraph and up to the cursor
		 */

		if ((startContainer as Element).tagName === "P") {
			/**
			 * Handle the case when startContainer is a paragraph. In this case, we
			 * add the length of all the child nodes of the paragraph up to, but
			 * excluding, the node at startOffset.
			 */

			if (
				startContainer.textContent?.length !== undefined &&
				startContainer.textContent.length > 0
			) {
				const nodesBeforeStartOffset = Array.from(
					startContainer.childNodes
				).slice(0, startOffset);

				start = textareaUtils.sumTextLengthOfNodesArray(
					nodesBeforeStartOffset,
					start
				);
			}
		} else if (startContainer.nodeType === 3) {
			/**
			 * Handle the case when startContainer is a text node. In this case, we
			 * sum the length of all the nodes before the startContainer in the
			 * parent paragraph, then we increment the result by startOffset.
			 */

			const textLengthBeforeStartContainer =
				textareaUtils.getTextLengthBeforeCurrentTextNode(
					startContainer as Text,
					startParagraph
				);

			if (textLengthBeforeStartContainer < 0) {
				return { start: null, end: null };
			}

			start += startOffset + textLengthBeforeStartContainer;
		}
	}

	if (endContainer === divElement) {
		const paragraphsBeforeEndOffset = Array.from(divElement.childNodes).slice(
			0,
			endOffset
		);

		if (paragraphsBeforeEndOffset.length === 0) {
			end = 0;
		} else {
			end = textareaUtils.sumTextLengthOfParagraphsArray(
				paragraphsBeforeEndOffset as HTMLParagraphElement[],
				divElement
			);
		}
	} else {
		/**
		 * GET THE END PARAGRAPH
		 */
		const endParagraph = textareaUtils.getParentParagraph(endContainer);

		if (!endParagraph) {
			return { start: null, end: null };
		}

		/**
		 * CALCULATE TEXT LENGTH BEFORE END PARAGRAPH
		 */
		const endPIndex = textareaUtils.findNodeInParent(divElement, endParagraph);

		const paragraphsBeforeEnd = Array.from(divElement.childNodes).slice(
			0,
			endPIndex
		);

		if (paragraphsBeforeEnd.length === 0) {
			end = 0;
		} else {
			end = textareaUtils.sumTextLengthOfParagraphsArray(
				paragraphsBeforeEnd as HTMLParagraphElement[],
				divElement
			);
		}

		if ((endContainer as Element).tagName === "P") {
			/**
			 * Handle the case when endContainer is a paragraph. In this case, we
			 * add the length of all the child nodes of the paragraph up to, but
			 * excluding, the node at endOffset.
			 */

			if (
				endContainer.textContent?.length !== undefined &&
				endContainer.textContent.length > 0
			) {
				const nodesBeforeEndOffset = Array.from(endContainer.childNodes).slice(
					0,
					endOffset
				);

				end = textareaUtils.sumTextLengthOfNodesArray(
					nodesBeforeEndOffset,
					end
				);
			}
		} else if (endContainer.nodeType === 3) {
			/**
			 * Handle the case when endContainer is a text node. In this case, we
			 * sum the length of all the nodes before the endContainer in the
			 * parent paragraph, then we increment the result by endOffset.
			 */

			const textLengthBeforeEndContainer =
				textareaUtils.getTextLengthBeforeCurrentTextNode(
					endContainer as Text,
					endParagraph
				);

			if (textLengthBeforeEndContainer < 0) {
				return { start: null, end: null };
			}
			end += endOffset + textLengthBeforeEndContainer;
		}
	}

	return { start, end };
}

const textareaUtils = {
	formatAfterUserInput,
	formatAfterNewParagraph,
	formatParagraphsAfterPasting,
	formatAfterUpdatingTextFromParent,
	insertParagraphOnEmptyEditor,
	addNonBreakingSpaceAfterFormattedElement,
	deleteAllEditorChildren,
	repositionCursorInTextarea,
	isDeletionEvent,
	appendTextToParagraph,
	setCursorPosition,
	findNodeInParent,
	getParentParagraph,
	getTextNodeAtStart,
	getTextNodeAtEnd,
	sumTextLengthOfNodesArray,
	sumTextLengthOfParagraphsArray,
	getTextLengthBeforeCurrentTextNode,
	getCurrentText,
	getCursorLocation,
};

export default textareaUtils;
