import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
});

test.describe("Hashtags", async () => {
    test.describe("No match for hashtag pattern", async () => {
        test("When the user type the # character alone, nothing should be formatted", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("Hello #", { delay: 50 });

            const p = editor.locator("p");
            const span = editor.locator("span");

            await expect(span).toBeHidden();
            await expect(await p.count()).toBe(1);
            await expect(p).toHaveText("Hello #");
        });

        test("If the user types word characters after the #, but the result doesn't match the hashtag pattern, it shouldn't be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("Hello #100", { delay: 50 });

            const p = editor.locator("p");
            const span = editor.locator("span");

            await expect(span).toBeHidden();
            await expect(await p.count()).toBe(1);
            await expect(p).toHaveText("Hello #100");
        });

        test("If the user types non-word characters immediately after the #, it shouldn't be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("Hello #-hello", { delay: 50 });

            const p = editor.locator("p");
            const span = editor.locator("span");

            await expect(span).toBeHidden();
            await expect(await p.count()).toBe(1);
            await expect(p).toHaveText("Hello #-hello");
        });

        test("When the user erases characters from a string that matches the hashtag pattern, making it no longer matching, the highlighting should be removed", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("Hello #100days", { delay: 50 });

            for (let i = 0; i < 4; i++) {
                await editor.press("Backspace");
            }

            const p = editor.locator("p");
            const span = editor.locator("span");

            await expect(span).toBeHidden();
            await expect(await p.count()).toBe(1);
            await expect(p).toHaveText("Hello #100");
        });

        test("If the user adds word characters immediately before a highlighted hashtag, with no non-word characters separating them, then the highlighting should be removed", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("Hello #100days", { delay: 50 });

            const p = editor.locator("p");
            const span = editor.locator("span");

            for (let i = 0; i < 8; i++) {
                await editor.press("ArrowLeft");
            }

            await editor.type("from", { delay: 50 });

            await expect(span).toBeHidden();
            await expect(await p.count()).toBe(1);
            await expect(p).toHaveText("Hello from#100days");
        });
    });
});
