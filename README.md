# TweetTextarea React Component

![GitHub](https://img.shields.io/github/license/amsaid1989/tweet-textarea-react) ![GitHub package.json version](https://img.shields.io/github/package-json/v/amsaid1989/tweet-textarea-react) ![GitHub contributors](https://img.shields.io/github/contributors/amsaid1989/tweet-textarea-react) ![GitHub last commit](https://img.shields.io/github/last-commit/amsaid1989/tweet-textarea-react)

![GitHub watchers](https://img.shields.io/github/watchers/amsaid1989/tweet-textarea-react?style=social) ![GitHub Repo stars](https://img.shields.io/github/stars/amsaid1989/tweet-textarea-react?style=social) ![GitHub forks](https://img.shields.io/github/forks/amsaid1989/tweet-textarea-react?style=social)

A simple React component that replicates the behaviour of Twitter's tweet input area. It detects and highlights URLs, hashtags, user mentions and cashtags.

The component is built from scratch and it doesn't rely on any dependencies (except for React itself), so it is a relatively lightweight component.

## Installation
---
You can install the component from npm using either `npm` or `yarn`:

```bash
npm install --save tweet-textarea-react
```

or:

```bash
yarn add tweet-textarea-react
```

## Usage
---
Once installed, you can start using the component immediately, but first, you need to import it:

```javascript
// ES6
import TweetTextarea from 'tweet-textarea-react'

// CommonJS
const TweetTextarea = require('tweet-textarea-react')
```

You can then render the component in your app:

```javascript
function App() {
    return <TweetTextarea />;
}
```

The `TweetTextarea` component supports all attributes that are supported by the `div` element, except for the ones that are required for the component to work. These are the `ref`, `contentEditable`, `onBeforeInput` and `onInput` attributes. If you try to pass any of these attributes, then your React app will probably not compile if you are using `Typescript`, or you attributes will be overridden if you are using `Javascript`.

The component comes with two sets of default styles applied. The first defines what the textarea itself looks like. This can be overridden by passing a custom class when using the component.

```javascript
function App() {
    return <TweetTextarea className="custom-class" />;
}
```

The second default style is the one that defines how URLs, hashtags, etc. will be highlighted. Currently, the component doesn't support overriding this style. However, this will be implemented soon.

## Licence
---
[MIT](https://mit-license.org/)

## Keywords
---
[react-component](https://www.npmjs.com/search?q=keywords:react-component) [react](https://www.npmjs.com/search?q=keywords:react) [tweet-textarea](https://www.npmjs.com/search?q=keywords:tweet-textarea)
