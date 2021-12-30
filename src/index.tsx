import React from "react";

export default function TweetTextarea(): JSX.Element {
    const style: React.CSSProperties = {
        padding: "1em",
        border: "solid 1px black",
    };

    return <div id="editor" style={style} contentEditable />;
}
