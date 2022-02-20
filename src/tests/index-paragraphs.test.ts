import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
});

test.describe("Paragraphs", async () => {
    test("When user types some text, a paragraph element is created to contain that text", async ({
        page,
    }) => {
        const editor = page.locator("div.tweet-textarea");

        await editor.type("Hello from TweetTextarea", { delay: 50 });

        const p = editor.locator("p");

        await expect(p).toBeVisible();

        await expect(await p.count()).toBe(1);

        await expect(p).toHaveText("Hello from TweetTextarea");
    });

    test("When user presses Enter in an empty editor, it should create new paragraphs", async ({
        page,
    }) => {
        const editor = page.locator("div.tweet-textarea");

        await editor.press("Enter");

        const p = editor.locator("p");

        await expect(await p.count()).toBe(2);

        await expect(
            (await p.allTextContents()).every((text) => text === "")
        ).toBeTruthy();
    });

    test("When user presses Backspace in an empty paragraph, it should be deleted", async ({
        page,
    }) => {
        const editor = page.locator("div.tweet-textarea");

        await editor.press("Enter");

        await editor.press("Backspace");

        const p = editor.locator("p");

        await expect(await p.count()).toBe(0);
    });
});
