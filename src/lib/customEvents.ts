export interface textUpdateDetail {
    currentText: string;
}

const textUpdateEvent = "textupdate";

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

const customEvents = {
    textUpdateEvent,
    dispatchTextUpdateEvent,
};

export default customEvents;
