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
    const selection = document.getSelection();

    if (selection) {
        const range = selection.getRangeAt(0);

        if (range) {
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
    }
}

function deleteAllEditorChildren(editor: HTMLDivElement): void {
    while (editor.firstChild) {
        editor.removeChild(editor.firstChild);
    }
}

const handlers = {
    format,
    prepParagraphForReformatting,
    insertParagraphOnEmptyEditor,
    deleteAllEditorChildren,
};

export default handlers;
