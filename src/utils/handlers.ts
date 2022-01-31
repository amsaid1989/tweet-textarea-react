function insertParagraphOnEmptyEditor(editor: HTMLDivElement): void {
    const selection = document.getSelection();

    if (selection) {
        const range = selection.getRangeAt(0);

        if (range) {
            const paragraph = document.createElement("p");
            const textNode = document.createTextNode("");
            // TODO (Abdelrahman): Figure out how to import CSS
            // paragraph.style.margin = "0";
            // paragraph.style.padding = "0";

            paragraph.appendChild(textNode);
            editor.appendChild(paragraph);

            range.setStart(textNode, 0);
            range.collapse(true);
        }
    }
}

function deleteAllEditorChildren(editor: HTMLDivElement) {
    while (editor.firstChild) {
        editor.removeChild(editor.firstChild);
    }
}

const handlers = {
    insertParagraphOnEmptyEditor,
    deleteAllEditorChildren,
};

export default handlers;
