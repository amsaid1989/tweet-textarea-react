export interface textUpdateDetail {
    currentText: string;
}

const textUpdateEvent = "textupdate";

function dispatchTextUpdateEvent(
    divElement: HTMLDivElement,
    eventDetail: textUpdateDetail
): void {
    const ev = new CustomEvent(textUpdateEvent, {
        detail: eventDetail,
    });

    divElement.dispatchEvent(ev);
}

const customEvents = {
    textUpdateEvent,
    dispatchTextUpdateEvent,
};

export default customEvents;
