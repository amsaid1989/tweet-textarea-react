import React, { useState, useEffect, useRef } from "react";
import patterns from "./utils/patterns";
import handlers from "./utils/handlers";
import "./static/editorStyles.css";

const STORAGE_KEY = "highlightPattern";

export default function TweetTextarea(): JSX.Element {
    const editorRef = useRef<HTMLDivElement | null>(null);

    const [pattern, setPattern] = useState<RegExp | null>(null);

    // Get pattern from storage and run the get pattern function on load
    useEffect(() => {
        // TODO (Abdelrahman): Look into testing for the availability
        // of localStorage before trying to use it.
        const storage = window.localStorage;
        const storedPattern = storage.getItem(STORAGE_KEY);

        // Use the locally stored pattern if it exists while the
        // componenet fetches the updated list of top-level
        // domains
        if (storedPattern && storedPattern.trim() !== "") {
            setPattern(patterns.patternFromString(storedPattern));
        }

        patterns
            .initPattern()
            .then((highlightPattern) => {
                storage.setItem(STORAGE_KEY, highlightPattern.source);

                setPattern(highlightPattern);
            })
            .catch((err) => console.error(err));
    }, []);

    /* EVENT LISTENERS */
    const beforeInputListener = (event: React.FormEvent<HTMLDivElement>) => {
        if (editorRef) {
            const selection = document.getSelection();
            const range = selection?.getRangeAt(0);
            const selectedText = range?.toString();

            if (
                range &&
                !range.collapsed &&
                selectedText &&
                selectedText.length === editorRef.current?.textContent?.length
            ) {
                handlers.deleteAllEditorChildren(editorRef.current);
            }

            if (editorRef.current?.childNodes.length === 0) {
                event.preventDefault();

                const inputEvent = event as unknown as InputEvent;
                const data = inputEvent.data;
                const keyboardKey =
                    data === "\n" || data === "\r" ? "Enter" : inputEvent.data;

                if (keyboardKey) {
                    handlers.insertParagraphOnEmptyEditor(
                        editorRef.current,
                        keyboardKey
                    );
                }
            }

            if (range && (event as unknown as InputEvent).data === " ") {
                /**
                 * Handles when user inputs a Space character by converting
                 * the input using the unicode literal for the non-breaking
                 * space.
                 */
                let node = range.startContainer;
                const { startOffset } = range;

                if (
                    node.parentElement?.tagName === "SPAN" &&
                    startOffset === node.textContent?.length
                ) {
                    event.preventDefault();

                    node = node.parentElement;

                    let offsetInParent: number | undefined;

                    const paragraphNode = node.parentElement;

                    if (paragraphNode) {
                        for (
                            let i = 0;
                            i < paragraphNode.childNodes.length;
                            i++
                        ) {
                            const child = paragraphNode.childNodes[i];

                            if (child === node) {
                                offsetInParent = i + 1;
                                break;
                            }
                        }

                        if (offsetInParent !== undefined) {
                            range.setStart(paragraphNode, offsetInParent);
                            range.collapse(true);

                            const textNode = document.createTextNode("\u00A0");

                            range.insertNode(textNode);

                            range.setStart(textNode, 1);
                            range.collapse(true);
                        }
                    }

                    if (editorRef.current) {
                        editorRef.current.normalize();
                    }
                }
            }
        }
    };
    const inputListener = (event: React.FormEvent<HTMLDivElement>) => {
        if (editorRef) {
            if (editorRef.current) {
                const inputType = (event.nativeEvent as InputEvent).inputType;

                if (editorRef.current.childNodes.length === 1) {
                    if (
                        inputType &&
                        (inputType === "deleteContentBackward" ||
                            inputType === "deleteContentForward") &&
                        editorRef.current?.textContent?.length === 0
                    ) {
                        handlers.deleteAllEditorChildren(editorRef.current);
                        return;
                    }
                }

                if (inputType && inputType !== "insertParagraph") {
                    const sel = document.getSelection();

                    if (sel) {
                        const range = sel.getRangeAt(0);

                        if (range) {
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
                                const lastChildBeforeOffset = node.childNodes[
                                    offset - 1
                                ] as Element;

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
                                    return;
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
                                if (node.parentElement?.tagName === "SPAN") {
                                    node = node.parentElement;
                                }
                            }

                            const prevNode =
                                node.previousSibling ||
                                node.previousElementSibling;
                            let nextNode =
                                node.nextSibling || node.nextElementSibling;
                            if (
                                nextNode &&
                                (nextNode as Element).tagName === "BR"
                            ) {
                                nextNode = node;
                            }

                            const startNode = prevNode || node;
                            const startOffset = 0;
                            const endNode = nextNode || node;
                            const endOffset =
                                endNode.nodeType === 3 &&
                                endNode.textContent?.length !== undefined
                                    ? endNode.textContent.length
                                    : 1;

                            if (
                                startNode !== node &&
                                startNode.textContent?.length !== undefined
                            ) {
                                offset += startNode.textContent.length;
                            }

                            const parentParagraph = startNode.parentElement;
                            let offsetInParent: number | undefined;
                            if (
                                parentParagraph &&
                                parentParagraph.childNodes.length > 0
                            ) {
                                for (
                                    let i = 0;
                                    i < parentParagraph.childNodes.length;
                                    i++
                                ) {
                                    if (
                                        parentParagraph.childNodes[i] ===
                                        startNode
                                    ) {
                                        offsetInParent = i;
                                        break;
                                    }
                                }

                                if (offsetInParent !== undefined) {
                                    range.setStart(startNode, startOffset);
                                    range.setEnd(endNode, endOffset);

                                    const text = range.toString();

                                    range.deleteContents();

                                    node.parentElement?.removeChild(node);
                                    startNode.parentElement?.removeChild(
                                        startNode
                                    );
                                    endNode.parentElement?.removeChild(endNode);

                                    range.setStart(
                                        parentParagraph,
                                        offsetInParent
                                    );
                                    range.collapse(true);

                                    const textNode =
                                        document.createTextNode(text);
                                    range.insertNode(textNode);
                                    range.setStart(
                                        textNode,
                                        textNode.textContent?.length || 0
                                    );
                                    range.collapse(true);

                                    if (pattern) {
                                        handlers.format(
                                            range,
                                            textNode,
                                            pattern
                                        );
                                    }

                                    let currentLength = 0;
                                    for (
                                        let i = offsetInParent;
                                        i < parentParagraph.childNodes.length;
                                        i++
                                    ) {
                                        const child =
                                            parentParagraph.childNodes[i];

                                        if (
                                            child.textContent?.length !==
                                            undefined
                                        ) {
                                            if (
                                                currentLength +
                                                    child.textContent.length <
                                                offset
                                            ) {
                                                currentLength +=
                                                    child.textContent.length;
                                            } else {
                                                offset -= currentLength;

                                                if (child.nodeType === 3) {
                                                    range.setStart(
                                                        child,
                                                        offset
                                                    );
                                                } else {
                                                    if (child.firstChild) {
                                                        range.setStart(
                                                            child.firstChild,
                                                            offset
                                                        );
                                                    }
                                                }
                                                range.collapse(true);

                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    /**
                     * When user presses Enter, creating a new paragraph, recalculate
                     * the formatting for the current and previous paragraphs
                     */
                    const sel = document.getSelection();

                    if (sel) {
                        const range = sel.getRangeAt(0);

                        if (range) {
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
                                const parentElement =
                                    range.startContainer.parentElement;

                                if (parentElement) {
                                    if (parentElement.tagName === "P") {
                                        currentParagraph = parentElement;
                                    } else {
                                        if (parentElement.parentElement) {
                                            currentParagraph =
                                                parentElement.parentElement;
                                        }
                                    }
                                }
                            } else if (
                                (range.startContainer as Element).tagName ===
                                "P"
                            ) {
                                currentParagraph =
                                    range.startContainer as Element;
                            }

                            const previousParagraph =
                                currentParagraph?.previousElementSibling;

                            if (previousParagraph) {
                                const textNode =
                                    handlers.prepParagraphForReformatting(
                                        range,
                                        previousParagraph
                                    );

                                if (pattern) {
                                    handlers.format(
                                        range,
                                        textNode,
                                        pattern,
                                        previousParagraph
                                    );
                                }
                            }

                            if (currentParagraph) {
                                const textNode =
                                    handlers.prepParagraphForReformatting(
                                        range,
                                        currentParagraph
                                    );

                                if (pattern) {
                                    handlers.format(
                                        range,
                                        textNode,
                                        pattern,
                                        currentParagraph
                                    );
                                }
                            }
                        }
                    }
                }

                editorRef.current.normalize();
            }
        }
    };
    /* END EVENT LISTENERS */

    return (
        <div
            className="tweet-textarea"
            ref={editorRef}
            onBeforeInput={beforeInputListener}
            onInput={inputListener}
            contentEditable
        />
    );
}
