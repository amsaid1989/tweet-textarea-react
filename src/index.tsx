import React, { useState, useEffect } from "react";
import getPattern, { patternFromString } from "./utils/patterns";

const STORAGE_KEY = "highlightPattern";

export default function TweetTextarea(): JSX.Element {
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
            setPattern(patternFromString(storedPattern));
        }

        getPattern()
            .then((highlightPattern) => {
                storage.setItem(STORAGE_KEY, highlightPattern.source);

                setPattern(highlightPattern);
            })
            .catch((err) => console.error(err));
    }, []);

    const inputHandler = (event: React.FormEvent<HTMLDivElement>) => {
        if (pattern) {
            const editor = event.currentTarget;
            const text = editor.textContent;

            if (text) {
                const matches = Array.from(text.matchAll(pattern));

                let indices: { [index: string]: number } = {};

                for (const match of matches) {
                    const fullMatch = match[0];
                    const str = match[1] || match[2] || match[3] || match[4];

                    for (let i = 0; i < fullMatch.length; i++) {
                        if (
                            fullMatch[i] === str[0] &&
                            match.index !== undefined
                        ) {
                            indices[match.index + i] = str.length;
                            break;
                        }
                    }
                }

                if (Object.keys(indices).length > 0) {
                    while (editor.firstChild) {
                        editor.removeChild(editor.firstChild);
                    }

                    if (
                        event.type === "input" &&
                        event.nativeEvent.data === " "
                    ) {
                        editor.textContent = text.slice(0, text.length - 1);

                        const textNode = document.createTextNode("\u00A0");

                        editor.appendChild(textNode);
                    } else {
                        editor.textContent = text;
                    }

                    const sortFunc = (a: string, b: string): number => {
                        return Number(b) - Number(a);
                    };

                    const keys = Object.keys(indices).sort(sortFunc);

                    const sel = window.getSelection();
                    if (sel) {
                        const range = sel.getRangeAt(0);

                        if (range) {
                            if (
                                editor.firstChild &&
                                editor.firstChild.nodeType === 3
                            ) {
                                for (const key of keys) {
                                    range.setStart(
                                        editor.firstChild,
                                        Number(key)
                                    );
                                    range.setEnd(
                                        editor.firstChild,
                                        Number(key) + indices[key]
                                    );

                                    const highlightNode =
                                        document.createElement("span");
                                    highlightNode.style.color = "red";

                                    range.surroundContents(highlightNode);
                                }
                            }

                            range.setEnd(editor, editor.childNodes.length);
                            range.collapse();
                        }
                    }
                }
            }
        }
    };

    const style: React.CSSProperties = {
        padding: "1em",
        border: "solid 1px black",
    };

    return (
        <div id="editor" style={style} onInput={inputHandler} contentEditable />
    );
}
