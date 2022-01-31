import React, { useState, useEffect, useRef } from "react";
import patterns from "./utils/patterns";
import handlers from "./utils/handlers";

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
                // TODO (Abdelrahman): Figure out how to handle the differences
                // between Firefox and Chrome
                handlers.insertParagraphOnEmptyEditor(editorRef.current);
            }
        }
    };
    const inputListener = (event: React.FormEvent<HTMLDivElement>) => {
        if (editorRef) {
            if (editorRef.current) {
                if (editorRef.current.childNodes.length === 1) {
                    const child = editorRef.current.firstChild;

                    if ((child as HTMLElement)?.tagName !== "P") {
                        const inputType = (event.nativeEvent as InputEvent)
                            .inputType;

                        if (
                            inputType &&
                            (inputType === "deleteContentBackward" ||
                                inputType === "deleteContentForward") &&
                            editorRef.current?.textContent?.length === 0
                        ) {
                            handlers.deleteAllEditorChildren(editorRef.current);
                        }
                    }
                }
            }
        }
    };
    /* END EVENT LISTENERS */

    const style: React.CSSProperties = {
        padding: "1em",
        border: "solid 1px black",
    };

    return (
        <div
            id="editor"
            ref={editorRef}
            style={style}
            onBeforeInput={beforeInputListener}
            onInput={inputListener}
            contentEditable
        />
    );
}
