import textareaUtils from "./textareaUtils";
export interface textUpdateDetail {
    currentText: string;
}

export interface curorChangeDetail {
    start: number;
    end: number;
}

interface nullCurorChangeDetail {
    start: null;
    end: null;
}

const textUpdateEvent = "textupdate";
const cursorChangeEvent = "cursorchange";

function getCurrentText(divElement: HTMLDivElement): string {
    const paragraphs = Array.from(divElement.childNodes);

    if (paragraphs.length === 0) {
        return "";
    }

    return paragraphs.map((p) => p.textContent).join("\n");
}

function dispatchTextUpdateEvent(divElement: HTMLDivElement): void {
    const ev = new CustomEvent<textUpdateDetail>(textUpdateEvent, {
        detail: {
            currentText: getCurrentText(divElement),
        },
    });

    divElement.dispatchEvent(ev);
}

function getCursorLocation(
    divElement: HTMLDivElement,
    range: Range
): curorChangeDetail | nullCurorChangeDetail {
    let start: number;
    let end: number;

    if (divElement.childNodes.length === 0) {
        start = end = 0;

        return { start, end };
    }

    let { startContainer, startOffset, endContainer, endOffset } = range;

    if (startContainer === divElement && endContainer === divElement) {
        const paragraphsBeforeStartOffset = Array.from(
            divElement.childNodes
        ).slice(0, startOffset);

        if (paragraphsBeforeStartOffset.length === 0) {
            start = 0;
        } else {
            // Calculate how many new line characters will be in the
            // text. If the cursor is at the last paragraph of the
            // textarea, then the number of new line characters will be
            // 1 subtracted from the number of paragraphs inside the
            // textarea, because the last paragraph won't have a new
            // line. Otherwise, it will be the number of all paragraphs
            // before the cursor position.
            const newlineCount =
                paragraphsBeforeStartOffset.length <
                divElement.childNodes.length
                    ? paragraphsBeforeStartOffset.length
                    : paragraphsBeforeStartOffset.length - 1;

            start = paragraphsBeforeStartOffset.reduce((curLength, p) => {
                if (p.textContent?.length === undefined) {
                    return curLength;
                }

                return curLength + p.textContent.length;
            }, newlineCount);
        }

        const paragraphsBeforeEndOffset = Array.from(
            divElement.childNodes
        ).slice(0, endOffset);

        if (paragraphsBeforeEndOffset.length === 0) {
            end = 0;
        } else {
            // Calculate how many new line characters will be in the
            // text. If the cursor is at the last paragraph of the
            // textarea, then the number of new line characters will be
            // 1 subtracted from the number of paragraphs inside the
            // textarea, because the last paragraph won't have a new
            // line. Otherwise, it will be the number of all paragraphs
            // before the cursor position.
            const newlineCount =
                paragraphsBeforeEndOffset.length < divElement.childNodes.length
                    ? paragraphsBeforeEndOffset.length
                    : paragraphsBeforeEndOffset.length - 1;

            end = paragraphsBeforeEndOffset.reduce((curLength, p) => {
                if (p.textContent?.length === undefined) {
                    return curLength;
                }

                return curLength + p.textContent.length;
            }, newlineCount);
        }

        return { start, end };
    }

    /**
     * NOTE (Abdelrahman): We shouldn't need to check if the
     * startContainer or the endContainer are actually the textarea
     * itself beyond this point.
     *
     * We handle the case when both startContainer and endContainer
     * are the textarea above and, based on testing the component
     * multiple times, it looks like when one of them is the textarea,
     * the other one is always the textarea as well.
     */

    /**
     * GET THE START AND END PARAGRAPHS
     */
    const startParagraph = textareaUtils.getParentParagraph(startContainer);
    const endParagraph = textareaUtils.getParentParagraph(endContainer);

    if (!startParagraph || !endParagraph) {
        return { start: null, end: null };
    }

    /**
     * CALCULATE TEXT LENGTH BEFORE START AND END PARAGRAPHS
     */
    const startPIndex = textareaUtils.findNodeInParent(
        divElement,
        startParagraph
    );
    const endPIndex = textareaUtils.findNodeInParent(divElement, endParagraph);

    if (startPIndex === undefined || endPIndex === undefined) {
        return { start: null, end: null };
    }

    const paragraphsBeforeStart = Array.from(divElement.childNodes).slice(
        0,
        startPIndex
    );

    if (paragraphsBeforeStart.length === 0) {
        start = 0;
    } else {
        // Calculate how many new line characters will be in the
        // text. If the cursor is at the last paragraph of the
        // textarea, then the number of new line characters will be
        // 1 subtracted from the number of paragraphs inside the
        // textarea, because the last paragraph won't have a new
        // line. Otherwise, it will be the number of all paragraphs
        // before the cursor position.
        const newlineCount =
            paragraphsBeforeStart.length < divElement.childNodes.length
                ? paragraphsBeforeStart.length
                : paragraphsBeforeStart.length - 1;

        start = paragraphsBeforeStart.reduce((curLength, p) => {
            if (p.textContent?.length === undefined) {
                return curLength;
            }

            return curLength + p.textContent.length;
        }, newlineCount);
    }

    const paragraphsBeforeEnd = Array.from(divElement.childNodes).slice(
        0,
        endPIndex
    );

    if (paragraphsBeforeEnd.length === 0) {
        end = 0;
    } else {
        // Calculate how many new line characters will be in the
        // text. If the cursor is at the last paragraph of the
        // textarea, then the number of new line characters will be
        // 1 subtracted from the number of paragraphs inside the
        // textarea, because the last paragraph won't have a new
        // line. Otherwise, it will be the number of all paragraphs
        // before the cursor position.
        const newlineCount =
            paragraphsBeforeEnd.length < divElement.childNodes.length
                ? paragraphsBeforeEnd.length
                : paragraphsBeforeEnd.length - 1;

        end = paragraphsBeforeEnd.reduce((curLength, p) => {
            if (p.textContent?.length === undefined) {
                return curLength;
            }

            return curLength + p.textContent.length;
        }, newlineCount);
    }

    /**
     * Add the length of all the nodes from the start of the current
     * paragraph and up to the cursor
     */

    if ((startContainer as Element).tagName === "P") {
        if (
            startContainer.textContent?.length !== undefined &&
            startContainer.textContent.length > 0
        ) {
            const nodesBeforeStartOffset = Array.from(
                startContainer.childNodes
            ).slice(0, startOffset);

            start = nodesBeforeStartOffset.reduce((curLength, node) => {
                if (node.textContent?.length === undefined) {
                    return curLength;
                }

                return curLength + node.textContent.length;
            }, start);
        }
    }

    if ((endContainer as Element).tagName === "P") {
        if (
            endContainer.textContent?.length !== undefined &&
            endContainer.textContent.length > 0
        ) {
            const nodesBeforeEndOffset = Array.from(
                endContainer.childNodes
            ).slice(0, endOffset);

            end = nodesBeforeEndOffset.reduce((curLength, node) => {
                if (node.textContent?.length === undefined) {
                    return curLength;
                }

                return curLength + node.textContent.length;
            }, end);
        }
    }

    if (startContainer.nodeType === 3) {
        start += startOffset;

        const paragraphImmediateChild =
            startContainer.parentElement?.tagName === "P"
                ? startContainer
                : startContainer.parentElement;

        if (!paragraphImmediateChild) {
            return { start: null, end: null };
        }

        const immediateChildIndex = textareaUtils.findNodeInParent(
            startParagraph,
            paragraphImmediateChild
        );

        if (immediateChildIndex === undefined) {
            return { start: null, end: null };
        }

        const nodesBeforeCurrent = Array.from(startParagraph.childNodes).slice(
            0,
            immediateChildIndex
        );

        start = nodesBeforeCurrent.reduce((curLength, node) => {
            if (node.textContent?.length === undefined) {
                return curLength;
            }

            return curLength + node.textContent.length;
        }, start);
    }

    if (endContainer.nodeType === 3) {
        end += endOffset;

        const paragraphImmediateChild =
            endContainer.parentElement?.tagName === "P"
                ? endContainer
                : endContainer.parentElement;

        if (!paragraphImmediateChild) {
            return { start: null, end: null };
        }

        const immediateChildIndex = textareaUtils.findNodeInParent(
            endParagraph,
            paragraphImmediateChild
        );

        if (immediateChildIndex === undefined) {
            return { start: null, end: null };
        }

        const nodesBeforeCurrent = Array.from(endParagraph.childNodes).slice(
            0,
            immediateChildIndex
        );

        end = nodesBeforeCurrent.reduce((curLength, node) => {
            if (node.textContent?.length === undefined) {
                return curLength;
            }

            return curLength + node.textContent.length;
        }, end);
    }

    return { start, end };
}

function dispatchCursorChangeEvent(
    divElement: HTMLDivElement,
    range: Range
): void {
    const { start, end } = getCursorLocation(divElement, range);

    if (start === null || end === null) {
        return;
    }

    const ev = new CustomEvent<curorChangeDetail>(cursorChangeEvent, {
        detail: { start, end },
    });

    divElement.dispatchEvent(ev);
}

const customEvents = {
    textUpdateEvent,
    cursorChangeEvent,
    dispatchTextUpdateEvent,
    dispatchCursorChangeEvent,
};

export default customEvents;
