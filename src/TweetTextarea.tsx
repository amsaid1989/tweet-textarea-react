import React, { useState, useEffect, useRef } from "react";
import patterns from "./lib/patterns";
import textareaListeners from "./lib/textareaListeners";
import "./static/editorStyles.css";

const STORAGE_KEY = "highlightPattern";

interface highlightStyle {
    highlightClassName?: string;
}

type TweetTextareaProps = Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "ref" | "onBeforeInput" | "onInput" | "contentEditable"
> &
    highlightStyle;

export default function TweetTextarea(props: TweetTextareaProps): JSX.Element {
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
        if (!editorRef) {
            return;
        }

        textareaListeners.textareaBeforeInputListener(event, editorRef);
    };

    const inputListener = (event: React.FormEvent<HTMLDivElement>) => {
        if (!editorRef || !pattern) {
            return;
        }

        textareaListeners.textareaInputListener(event, editorRef, pattern);
    };
    /* END EVENT LISTENERS */

    return (
        <div
            {...props}
            className={props.className || "tweet-textarea"}
            ref={editorRef}
            onBeforeInput={beforeInputListener}
            onInput={inputListener}
            contentEditable
        />
    );
}
