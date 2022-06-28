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
            start = textareaUtils.sumTextLengthOfParagraphsArray(
                paragraphsBeforeStartOffset as HTMLParagraphElement[],
                divElement
            );
        }

        const paragraphsBeforeEndOffset = Array.from(
            divElement.childNodes
        ).slice(0, endOffset);

        if (paragraphsBeforeEndOffset.length === 0) {
            end = 0;
        } else {
            end = textareaUtils.sumTextLengthOfParagraphsArray(
                paragraphsBeforeEndOffset as HTMLParagraphElement[],
                divElement
            );
        }

        return { start, end };
    }

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
        start = textareaUtils.sumTextLengthOfParagraphsArray(
            paragraphsBeforeStart as HTMLParagraphElement[],
            divElement
        );
    }

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
            const nodesBeforeEndOffset = Array.from(
                endContainer.childNodes
            ).slice(0, endOffset);

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

    /**
     * DEBUG (Abdelrahman): Dispatching many custom events in quick succession
     * seems to bring the browser to a crawl. If the user types some text very
     * quickly, the browser tab stops responding and nothing that the user types
     * after that appears in the textarea. Worst of all, it doesn't seem to
     * recover from that.
     *
     * After brief investigation, it seems that the culprit is the dispatchEvent
     * function rather than the code in the getCursorLocation function, because
     * even dispatching a simple number, seems to cause the issue.
     */
    divElement.dispatchEvent(ev);
}

const customEvents = {
    textUpdateEvent,
    cursorChangeEvent,
    dispatchTextUpdateEvent,
    dispatchCursorChangeEvent,
};

export default customEvents;
