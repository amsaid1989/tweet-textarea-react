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
			data === "\n" || data === "\r"
				? "Enter"
				: data === " "
					? "Space"
					: inputEvent.data;

		if (keyboardKey) {
			textareaUtils.insertParagraphOnEmptyEditor(
				editorRef.current,
				keyboardKey
			);
		}
	}

	if (range.startContainer === editorRef.current) {
		/**
		 * Addresses a bug in Firefox where sometimes when the user
		 * selects all the text inside the editor and then deselects
		 * it using the right arrow key, the text cursor would end up
		 * in the textarea itself rather than any node within it.
		 *
		 * In this case, we get the paragraph before the startOffset
		 * (To avoid getting the one at the startOffset, which won't
		 * exist since the cursor would probably be at the end of the
		 * text). We then set the cursor to the end of that paragraph.
		 */
		const index = range.startOffset - 1;
		const paragraph = editorRef.current.childNodes[index];

		textareaUtils.setCursorPosition(paragraph, paragraph.childNodes.length);
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

			textareaUtils.addNonBreakingSpaceAfterFormattedElement(range, node);
		}
	}
}

function textareaPasteListener(
	event: React.ClipboardEvent<HTMLDivElement>,
	editorRef: React.MutableRefObject<HTMLDivElement | null>,
	pattern: RegExp,
	highlightClassName?: string
): void {
	event.preventDefault();

	const selection = document.getSelection();
	const range = selection?.getRangeAt(0);

	if (!editorRef.current || !range) {
		return;
	}

	const { startContainer, startOffset, endContainer } = range;

	if (range.toString().length === editorRef.current.textContent?.length) {
		/**
		 * If user has all text in the editor selected and they paste
		 * something, delete all the child nodes of the editor
		 */
		textareaUtils.deleteAllEditorChildren(editorRef.current);
	} else {
		/**
		 * Otherwise, delete whatever is selected
		 */
		range.deleteContents();
	}

	/**
	 * Split the text to be pasted at the new lines and create
	 * a paragraph element for each line
	 */
	const lines = event.clipboardData.getData("text/plain").split("\n");
	const paragraphs = lines.map((line) => {
		const p = document.createElement("p");
		p.textContent = line;

		if (line.length === 0) {
			p.appendChild(document.createElement("br"));
		}

		return p;
	});

	/**
	 * Get the text length of the last paragraph element to
	 * use it when setting the cursor at the end
	 */
	let lastParagraphLength =
		paragraphs[paragraphs.length - 1].textContent?.length || 0;

	let paragraphsToFormat: HTMLParagraphElement[] = [];

	if (editorRef.current.childNodes.length === 0) {
		paragraphs.forEach((node) => editorRef.current?.appendChild(node));

		paragraphsToFormat = paragraphs;
	} else {
		const startParagraph = textareaUtils.getParentParagraph(startContainer);
		const endParagraph = textareaUtils.getParentParagraph(endContainer);

		if (!startParagraph) {
			return;
		}

		/**
		 * Handles pasting text on a non-empty editor. In this case,
		 * we find the start paragraph inside the editor, so we can
		 * add the text of the first paragraph element to it and add
		 * the subsequent paragraphs after it
		 */
		let paragraphOffsetInEditor = textareaUtils.findNodeInParent(
			editorRef.current,
			startParagraph
		);

		/**
		 * Next, starting from the second paragraph of the paragraphs
		 * to be added, we add each one of them to the editor
		 */
		paragraphs.slice(1).forEach((node) => {
			if (!editorRef.current || paragraphOffsetInEditor === undefined) {
				return;
			}

			paragraphOffsetInEditor++;

			textareaUtils.setCursorPosition(
				editorRef.current,
				paragraphOffsetInEditor
			);

			range.insertNode(node);
		});

		if (startParagraph !== endParagraph) {
			/**
			 * Handles what happens if the user selects text across
			 * multiple paragraphs before pasting. In this case,
			 * the start paragraph will get the text of the first
			 * paragraph element added to it, and the last paragraph
			 * element will get the text of the end paragraph added
			 * to it. The end paragraph will then be removed from
			 * the editor.
			 */

			/**
			 * The order is important. We first have to start by adding
			 * any necessary text to the last paragraph of the paragraphs
			 * to be pasted. This is because if we only have one paragraph
			 * to paste, then the element itself won't be added to the
			 * editor. Instead, its text content will be added to an
			 * existing paragraph, which means that trying to modify
			 * the text content of the to-be-added paragraph element is
			 * not going to be reflected in the editor.
			 */
			if (endParagraph) {
				if (
					endParagraph.textContent === undefined ||
					endParagraph.textContent === null
				) {
					return;
				}

				const lastParagraph = paragraphs[paragraphs.length - 1];

				textareaUtils.appendTextToParagraph(
					lastParagraph,
					endParagraph.textContent
				);

				endParagraph.parentElement?.removeChild(endParagraph);
			}
		} else {
			/**
			 * Handles what happens if the user pastes text inside
			 * one paragraph. In this case, the text inside the
			 * paragraph will be selected from the cursor position
			 * to the end of the paragraph, and it will be removed.
			 * It will later, be added to the last paragraph element.
			 *
			 * Then, the text of the first paragraph element will be
			 * added to the start paragraph.
			 */
			range.setStart(startContainer, startOffset);
			range.setEnd(startParagraph, startParagraph.childNodes.length);

			const text = range.toString();

			range.deleteContents();

			const lastParagraph = paragraphs[paragraphs.length - 1];

			textareaUtils.appendTextToParagraph(lastParagraph, text);
		}

		if (paragraphs.length === 1) {
			/**
			 * Addresses a bug where the cursor position would
			 * not be set correctly the last word of the last
			 * paragraph element to be pasted when there is
			 * only one paragraph element to add.
			 *
			 * This is due to the fact that the text length
			 * stored in the lastParagraphLength variable
			 * won't be correct because it doesn't take into
			 * account the length of the existing text in the
			 * start paragraph to which to the text of the
			 * first paragraph element will be added.
			 */

			if (startParagraph.textContent?.length !== undefined) {
				lastParagraphLength += startParagraph.textContent.length;
			}
		}

		if (
			startParagraph.textContent === undefined ||
			startParagraph.textContent === null
		) {
			return;
		}

		/**
		 * Add the text from the first paragraph to be pasted
		 * to the startParagraph
		 */
		if (
			paragraphs[0].textContent !== undefined &&
			paragraphs[0].textContent !== null
		) {
			textareaUtils.appendTextToParagraph(
				startParagraph,
				paragraphs[0].textContent
			);
		}

		paragraphsToFormat = [startParagraph, ...paragraphs.slice(1)];
	}

	textareaUtils.formatParagraphsAfterPasting(
		paragraphsToFormat,
		lastParagraphLength,
		range,
		pattern,
		highlightClassName
	);

	editorRef.current.normalize();
}

function textareaInputListener(
	event: React.FormEvent<HTMLDivElement>,
	editorRef: React.MutableRefObject<HTMLDivElement | null>,
	pattern: RegExp,
	repeat: boolean,
	repeatCount: number,
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

	if (inputType === "insertParagraph" || inputType == "insertLineBreak") {
		/**
		 * When user presses Enter, creating a new paragraph, recalculate
		 * the formatting for the current and previous paragraphs
		 */

		if (inputType === "insertLineBreak") {
			// TODO (Abdelrahman): There is still a bug with the code where if there is
			// a text like "Hello #100DaysOfCode from Abdelrahman" and the cursor is
			// after "100" and user presses Shift+Enter, only the test "DaysOfCode"
			// would be moved to the new line

			let currentParagraph: Element | undefined;
			let currentNode = range.startContainer;
			let startOffset = range.startOffset;
			let endOffset = currentNode.childNodes.length;

			if (
				currentNode.nodeType === 3 ||
				(currentNode as Element).tagName === "SPAN"
			) {
				currentParagraph = currentNode.parentNode as Element;
			}

			if (
				currentNode.nodeType === 3 &&
				currentParagraph &&
				currentParagraph.tagName === "P"
			) {
				/**
				 * Handle how Google Chrome behaves differently from Firefox
				 */
				const offsetInParent = textareaUtils.findNodeInParent(
					currentParagraph,
					currentNode
				);

				if (offsetInParent !== undefined) {
					currentNode = currentParagraph;
					startOffset = offsetInParent;
				}
			} else if (
				(currentNode as Element).tagName === "SPAN" ||
				(currentNode.nodeType === 3 &&
					currentParagraph &&
					currentParagraph.tagName === "SPAN")
			) {
				if (currentParagraph && currentParagraph.tagName === "SPAN") {
					/**
					 * Handle how Google Chrome behaves differently from Firefox
					 */
					currentParagraph = currentParagraph.parentNode as Element;

					if (currentNode.textContent) {
						endOffset = currentNode.textContent.length;
					}
				} else {
					endOffset = currentNode.childNodes.length;
				}
			}

			if (!currentParagraph) {
				currentParagraph = currentNode as HTMLParagraphElement;
			}

			range.setStart(currentNode, startOffset);
			range.setEnd(currentNode, endOffset);

			const newParagraph = document.createElement("p");
			range.surroundContents(newParagraph);

			if (currentNode.nodeType === 3) {
				currentNode = currentNode.parentNode as Element;
			}

			currentNode.removeChild(newParagraph);

			const parent = currentParagraph.parentNode;

			if (parent) {
				const offset = textareaUtils.findNodeInParent(parent, currentParagraph);

				if (offset !== undefined) {
					range.setStart(parent, offset + 1);
					range.setEnd(parent, offset + 1);
				}

				range.insertNode(newParagraph);

				range.setStart(newParagraph, 0);
				range.collapse(true);
			}
		}

		textareaUtils.formatAfterNewParagraph(range, pattern, highlightClassName);
	} else {
		textareaUtils.formatAfterUserInput(
			range,
			pattern,
			repeat,
			repeatCount,
			highlightClassName
		);
	}

	editorRef.current.normalize();
}

const textareaListeners = {
	textareaBeforeInputListener,
	textareaPasteListener,
	textareaInputListener,
};

export default textareaListeners;
