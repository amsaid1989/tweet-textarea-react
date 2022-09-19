import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
});

test.describe("Cashtags", async () => {
    test.describe("Text matches cashtag pattern", async () => {
        test("If the user types something after the $ character, and the result matches the cashtag pattern, it should be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div.input-area");

            await editor.type("Hello $google", { delay: 100 });

            const span = editor.locator("span");

            await expect(span).toBeVisible();
            await expect(await span.count()).toBe(1);
            await expect(span).toHaveText("$google");
        });

        test("A suffix made of an underscore and a maximum of two alphabetical characters is allowed and should be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div.input-area");

            await editor.type("Hello $google_uk", { delay: 100 });

            const span = editor.locator("span");

            await expect(span).toBeVisible();
            await expect(await span.count()).toBe(1);
            await expect(span).toHaveText("$google_uk");
        });

        test("If the suffix doesn't match the rules, then only the cashtag part will be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div.input-area");

            await editor.type("Hello $google_inc", { delay: 100 });

            const span = editor.locator("span");

            await expect(span).toBeVisible();
            await expect(await span.count()).toBe(1);
            await expect(span).toHaveText("$google");
        });

        test("When the user adds a non-word character after a sequence of word characters that match the cashtag pattern, then the formatting should stop before the non-word character", async ({
            page,
        }) => {
            const editor = page.locator("div.input-area");

            await editor.type("Hello $google-2022", { delay: 100 });

            const span = editor.locator("span");

            await expect(span).toBeVisible();
            await expect(await span.count()).toBe(1);
            await expect(span).toHaveText("$google");
        });

        test("If the user erases characters from a string that doesn't match the cashtag pattern, making it match, then the text should be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div.input-area");

            await editor.type("Hello $googleinc", { delay: 100 });

            for (let i = 0; i < 3; i++) {
                await editor.press("Backspace", { delay: 100 });
            }

            const span = editor.locator("span");

            await expect(span).toBeVisible();
            await expect(await span.count()).toBe(1);
            await expect(span).toHaveText("$google");
        });
    });
});
