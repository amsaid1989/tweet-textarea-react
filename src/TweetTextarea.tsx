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

import React, { useState, useEffect, useRef, forwardRef } from "react";
import patterns from "./lib/patterns";
import textareaListeners from "./lib/textareaListeners";
import customEvents from "./lib/customEvents";
import "./static/editorStyles.css";

const STORAGE_KEY = "highlightPattern";

export interface TweetTextareaProps
    extends Omit<
        React.HTMLAttributes<HTMLDivElement>,
        "onBeforeInput" | "onPaste" | "onInput" | "contentEditable"
    > {
    highlightClassName?: string;
    placeholder?: string;
    onTextUpdate?: (event: CustomEvent<string>) => void;
}

/**
 * TODO (Abdelrahman): rather than supporting the onBeforeInput and onInput
 * events, create a custom 'textchanged' event and add an onTextChanged
 * prop, for the users of the editor to use to pass their event listeners.
 *
 * The 'textchanged' event will be dispatched from the beforeInput, paste
 * and input listeners that are defined inside the component, whenever the
 * text inside the editor is changed.
 */
const TweetTextarea = forwardRef<HTMLDivElement | null, TweetTextareaProps>(
    (
        {
            className,
            highlightClassName,
            placeholder,
            onTextUpdate,
            ...htmlDivAttributes
        }: TweetTextareaProps,
        ref: React.ForwardedRef<HTMLDivElement>
    ): JSX.Element => {
        const editorRef = useRef<HTMLDivElement | null>(null);

        const [pattern, setPattern] = useState<RegExp | null>(null);

        const [text, setText] = useState<string>("");

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

        // Updated user defined ref whenever the internal ref updates
        useEffect(() => {
            if (ref) {
                if (typeof ref === "function") {
                    ref(editorRef.current);
                } else {
                    // Cast ref to a MutableRefObject, otherwise we won't
                    // be able to update its 'current' property
                    (
                        ref as React.MutableRefObject<HTMLDivElement | null>
                    ).current = editorRef.current;
                }
            }
        }, [editorRef.current]);

        // Assign user's event listeners
        useEffect(() => {
            if (!editorRef.current || !onTextUpdate) {
                return;
            }

            editorRef.current.addEventListener(
                customEvents.textUpdateEvent,
                onTextUpdate as EventListener
            );

            return () => {
                if (!editorRef.current || !onTextUpdate) {
                    return;
                }

                editorRef.current.removeEventListener(
                    customEvents.textUpdateEvent,
                    onTextUpdate as EventListener
                );
            };
        }, [editorRef.current, onTextUpdate]);

        /* EVENT LISTENERS */
        const beforeInputListener = (
            event: React.FormEvent<HTMLDivElement>
        ) => {
            if (!editorRef) {
                return;
            }

            textareaListeners.textareaBeforeInputListener(event, editorRef);

            setText(editorRef.current?.textContent || "");

            if (
                !editorRef.current?.textContent ||
                !event.isDefaultPrevented()
            ) {
                return;
            }

            customEvents.dispatchTextUpdateEvent(editorRef.current, {
                currentText: editorRef.current.textContent,
            });
        };

        const pasteListener = (event: React.ClipboardEvent<HTMLDivElement>) => {
            if (!editorRef || !pattern) {
                return;
            }

            textareaListeners.textareaPasteListener(
                event,
                editorRef,
                pattern,
                highlightClassName
            );

            setText(editorRef.current?.textContent || "");

            if (
                !editorRef.current?.textContent ||
                !event.isDefaultPrevented()
            ) {
                return;
            }

            customEvents.dispatchTextUpdateEvent(editorRef.current, {
                currentText: editorRef.current.textContent,
            });
        };

        const inputListener = (event: React.FormEvent<HTMLDivElement>) => {
            if (!editorRef || !pattern) {
                return;
            }

            textareaListeners.textareaInputListener(
                event,
                editorRef,
                pattern,
                highlightClassName
            );

            setText(editorRef.current?.textContent || "");

            if (!editorRef.current?.textContent) {
                return;
            }

            customEvents.dispatchTextUpdateEvent(editorRef.current, {
                currentText: editorRef.current.textContent,
            });
        };
        /* END EVENT LISTENERS */

        return (
            <div
                className={`tweet-textarea ${
                    className || "tweet-textarea-general-style"
                }`}
            >
                {text.length === 0 && placeholder && (
                    <div className="placeholder">{placeholder}</div>
                )}
                <div
                    {...htmlDivAttributes}
                    ref={editorRef}
                    className="input-area"
                    onBeforeInput={beforeInputListener}
                    onPaste={pasteListener}
                    onInput={inputListener}
                    contentEditable
                />
            </div>
        );
    }
);

export default TweetTextarea;
