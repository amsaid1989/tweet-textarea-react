import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
});

test.describe("Hashtags", async () => {
    test.describe("Text matches hashtag pattern", async () => {
        test("If the user types something after the #, and the result matches the hashtag pattern, it should be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("Hello #100DaysOfCode", { delay: 50 });

            const span = editor.locator("span");

            await expect(span).toBeVisible();
            await expect(await span.count()).toBe(1);
            await expect(span).toHaveText("#100DaysOfCode");
            await expect(span).toHaveClass("highlight");
        });

        test("When the user adds a non-word character after a sequence of word characters that match the hashtag pattern, then the formatting should stop before the non-word character", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("Hello #100DaysOfCode-2022", { delay: 50 });

            const span = editor.locator("span");
            const html = await editor.innerHTML();

            await expect(span).toBeVisible();
            await expect(await span.count()).toBe(1);
            await expect(span).toHaveText("#100DaysOfCode");
            await expect(span).toHaveClass("highlight");
        });

        test("If the user erases characters from a string that doesn't match the hashtag pattern, making it match, then the text should be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("Hello #100-days", { delay: 50 });

            for (let i = 0; i < 4; i++) {
                await editor.press("ArrowLeft");
            }

            await editor.press("Backspace");

            const span = editor.locator("span");
            const html = await editor.innerHTML();

            await expect(span).toBeVisible();
            await expect(await span.count()).toBe(1);
            await expect(span).toHaveText("#100days");
            await expect(span).toHaveClass("highlight");
        });
    });
});
