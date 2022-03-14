/**
 * The MIT License (MIT)
 *
 * Copyright © 2022 Abdelrahman Said
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the “Software”), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
 * LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
 * OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

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
