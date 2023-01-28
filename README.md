# TweetTextarea React Component

![GitHub](https://img.shields.io/github/license/amsaid1989/tweet-textarea-react) ![GitHub package.json version](https://img.shields.io/github/package-json/v/amsaid1989/tweet-textarea-react) ![GitHub contributors](https://img.shields.io/github/contributors/amsaid1989/tweet-textarea-react) ![GitHub last commit](https://img.shields.io/github/last-commit/amsaid1989/tweet-textarea-react)

![Firefox](https://img.shields.io/badge/firefox-supported-success?logo=firefox) ![Chrome](https://img.shields.io/badge/chrome-supported-success?logo=google-chrome) ![Brave](https://img.shields.io/badge/brave-supported-success?logo=brave) ![Safari](https://img.shields.io/badge/safari-not tested-critical?logo=safari) ![iOS](https://img.shields.io/badge/ios-not tested-critical?logo=ios) ![android](https://img.shields.io/badge/android-not tested-critical?logo=android)

![GitHub watchers](https://img.shields.io/github/watchers/amsaid1989/tweet-textarea-react?style=social) ![GitHub Repo stars](https://img.shields.io/github/stars/amsaid1989/tweet-textarea-react?style=social) ![GitHub forks](https://img.shields.io/github/forks/amsaid1989/tweet-textarea-react?style=social)

A simple React component that replicates the behaviour of Twitter's tweet input area. It detects and highlights URLs, hashtags, user mentions and cashtags.

The component is built from scratch and it doesn't rely on any dependencies (except for React itself), so it is a relatively lightweight component.

## Installation

You can install the component from npm using either `npm` or `yarn`:

```bash
npm install --save tweet-textarea-react
```

or:

```bash
yarn add tweet-textarea-react
```

## Usage

Once installed, you can start using the component immediately, but first, you need to import it:

```javascript
// ES6
import TweetTextarea from "tweet-textarea-react";

// CommonJS
const TweetTextarea = require("tweet-textarea-react");
```

You can then render the component in your app:

```javascript
function App() {
  return <TweetTextarea />;
}
```

The `TweetTextarea` component supports all attributes that are supported by the `div` element, except for `contentEditable`, `onBeforeInput`, `onPaste`, and `onInput` which are required for the component to work. If you try to pass any of these attributes to the component, then your React app will probably not compile if you are using `TypeScript`, or your attribute will be overridden if you are using `JavaScript`.

The component comes with two sets of default styles applied. The first defines what the textarea itself looks like. This can be overridden by passing a custom class when using the component.

```javascript
function App() {
  return <TweetTextarea className="custom-class" />;
}
```

The second default style is the one that defines how URLs, hashtags, etc. will be highlighted. This can be overridden by passing a class name to the `highlightClassName` attribute.

```javascript
function App() {
  return <TweetTextarea highlightClassName="custom-highlight" />;
}
```

If you would like to use the component as part of an app where a parent component can pass text to and receive text from the `TweetTextarea` component, you will need to use a combination of the `value`, `cursorPosition`, `onTextUpdate` and `onCursorChange` attributes. They all work together to maintain the internal state of the component and ensure that the parent component is updated when that state changes.

Here is a simple example of a parent component that passes all of those attributes to the `TweetTextarea` component.

```typescript
function App() {
  const { tweetText, setTweetText } = useState<string>("");
  const { textCursorPosition, setTextCursorPosition } =
    useState<ICursorChangeDetail>({ start: 0, end: 0 });

  return (
    <TweetTextarea
      value={tweetText}
      cursorPosition={textCursorPosition}
      onTextUpdate={handleTextUpdate}
      onCursorChange={handleCursorPositionChange}
    />
  );
}
```

As you can see from this example, the `value` attribute requires a simple string. However, the `cursorPosition` attribute requires an object of type `ICursorChangeDetail` which is exported by the component. This object needs to include two properties of the type `number`. The properties are `start` and `end`.

To update the parent component's state from the `TweetTextarea` component, you will need to use the two event listeners passed to the `onTextUpdate` and `onCursorChange` attributes.

Here is an example of what these two event listeners could look like (Code defining state objects and rendering the component is removed for brevity)

```typescript
function App() {
    ...

    const handleTextUpdate = (event) => {
        setTweetText(event.detail.currentText);
    }

    const handleCursorPositionChange = (event) => {
        setTextCursorPosition(event.detail)
    }

    ...
}
```

Going in the opposite direction (i.e. updating the `TweetTextarea` internal state from the parent component) is slightly more complicated at the moment. There may be a chance to simplify this process in the future, but for now, you will need to make sure that all the attributes (`value`, `cursorPosition`, `onTextUpdate` and `onCursorChange`) are passed to the `TweetTextarea`. You will then need to create a function that correctly inserts the text, updates the cursor position and updates the state of parent component, prompting an update to the internal state of the `TweetTextarea` component.

The following is an example of a simple function that uses the `tweetText` and `textCursorPosition` state objects to insert a text into the `TweetTextarea` component, making sure to update the cursor position accordingly.

```typescript
function App() {
    ...

    const insertTextAtCursor = (textToInsert) => {
        // Split the text at the cursor position
        const before = tweetText.slice(0, textCursorPosition.start);
        const after = tweetText.slice(textCursorPosition.end);

        // Insert the new text
        const updatedText = before + textToInsert + after;

        // Calculate the new cursor position
        const newCursorPosition = textCursorPosition.start + textToInsert.length;

        // Update the parent component state
        setTextCursorPosition({start: newCursorPosition, end: newCursorPosition});
        setTweetText(updatedText);
    }

    ...
}
```

Once the state of the parent component is updated, and assuming you passed all the attributes correctly, the internal state of the `TweetTextarea` component will be updated to reflect the changes made in the parent component.

## Contributing

Contributions are more than welcome. If you have any features you would like to add to the component, please fork the project, add your code and then open a pull request.

After forking the project, you will need to clone it locally. To do so, first create a new directory somewhere on your local system.

```bash
mkdir TweetTextarea
cd TweetTextarea
```

Next, you need to clone the repository:

```bash
git clone https://github.com/amsaid1989/tweet-textarea-react.git
```

This will clone the repository in a directory called `tweet-textarea-react`. Make sure you don't change the name of the directory since the project relies on the name for building the component and connecting it to the test app that you will create next.

For simplicity, use `create-react-app` to create the test app. If you would like the app to use `JavaScript`, you can run either of the following commands:

```bash
# npm
npx create-react-app test_app

# yarn
yarn create react-app test_app
```

Alternatively, if you would like to use `TypeScript`, run either of the following commands:

```bash
# npm
npx create-react-app test_app --template typescript

# yarn
yarn create react-app test_app --template typescript
```

Next, install the component's dependencies and build it to make sure it is actually working, before you start changing it:

```bash
cd tweet-textarea-react

# npm
npm install
npm build

# yarn
yarn install
yarn build
```

This will build the component and automatically add it to the test app we created above.

You then need to import the component into the test app and render it.

```javascript
import TweetTextarea from "tweet-textarea-react";

function App() {
  return <TweetTextarea />;
}
```

Then, navigate to the test app and start it:

```bash
cd ../test_app

# npm
npm start

# yarn
yarn start
```

In your browser, navigate to the location of the app (usually `localhost:3000` when using `create-react-app`).

You should now see the component rendered and you should be able to type text into it. Additionally, URLs, hashtags, user mentions and cashtags should be highlighted properly.

If all of that works properly for you, then you are ready to make any changes you would like to add to the component.

## Building the component in watch mode

When developing, it is always better to use watch mode, where any changes made to the code are automatically reflected, without having to manually build the component every time.

Although the component uses [rollup](https://www.rollupjs.org/guide/en/) for bundling, there is currently an issue that prevents the component from being properly built and added to the test app when using `rollup`'s watch mode.

Therefore, the project currently relies on a [Visual Studio Code](https://code.visualstudio.com/) task to build the code. To trigger this task automatically, the project currently relies on the [Trigger Task on Save](https://open-vsx.org/extension/Gruntfuggly/triggertaskonsave) extension. If you would like to build the component automatically every time you make a change to it, you will need to use `Visual Studio Code` and the `Trigger Task on Save` extension. The configuration for the task and how to trigger it is already provided in the repository, so it should work out of the box once you install the extension.

> `NOTE`
>
> Using the `Trigger Task on Save` with `Visual Studio Code` is not very robust. Sometimes building the component would fail. In this case, you will need to build the component again. Usually, it succeeds on the second time.

If you don't want to use `Visual Studio Code`, you will need to configure your own text editor/IDE to achieve the same result.

## Testing

To test that the component works across different browsers/devices, the project uses Microsoft's [Playrwright](https://playwright.dev/) library. If you would like to learn more about the library and how it works, you can refer to their [official documentation](https://playwright.dev/docs/intro).

To run the tests, you will first need to install the browsers supported by `Playwright` as well as the dependencies needed to run those browsers:

```bash
# npm
npx playwright install
npx playwright install-deps

# yarn
yarn playwright install
yarn playwright install-deps
```

Once complete, you can now run the tests:

```bash
# npm
npm test

# yarn
yarn test
```

> `NOTE`
>
> This will run all tests across all browsers and devices, which means it will take a little bit of time to finish running all the tests.

If you want to run tests for a specific browser/device or run only specific tests, please refer to the [Playwright documentation](https://playwright.dev/docs/intro#command-line) and to the [project's Playwright configuration](./playwright.config.ts) for the supported browsers/devices.

## Licence

[MIT](https://mit-license.org/)
