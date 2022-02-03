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
                // paragraph.appendChild(document.createElement("br"));
                paragraph.innerHTML = "<br>";

                const paragraph2 = document.createElement("p");
                // paragraph2.appendChild(document.createElement("br"));
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
    insertParagraphOnEmptyEditor,
    deleteAllEditorChildren,
};

export default handlers;
