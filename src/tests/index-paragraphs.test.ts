import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
});

test.describe("Paragraphs", async () => {
    test("When user types some text, a paragraph element is created to contain that text", async ({
        page,
    }) => {
        const editor = page.locator("div#editor");

        await editor.type("Hello from TweetTextarea");

        const html = await editor.innerHTML();

        await expect(html).toBe("<p>Hello from TweetTextarea<br></p>");
    });

    test("When user presses Enter in an empty editor, it should create new paragraphs", async ({
        page,
    }) => {
        const editor = page.locator("div#editor");

        await editor.press("Enter");

        const html = await editor.innerHTML();

        await expect(html).toBe("<p><br></p><p><br></p>");
    });

    test("When user presses Backspace in an empty paragraph, it should be deleted", async ({
        page,
    }) => {
        const editor = page.locator("div#editor");

        await editor.press("Enter");

        await editor.press("Backspace");

        let html = await editor.innerHTML();

        await expect(html).toBe("<p><br></p>");

        await editor.press("Backspace");

        html = await editor.innerHTML();

        await expect(html).toBe("");
    });
});
