import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
});

test.describe("Mentions", async () => {
    test.describe("Mentions relation to other entities", async () => {
        test.describe("Mentions in relation to other mentions", async () => {
            test("If the user types the @ character immediately before a highlighted mention, with no characters separating them, then the highlighting will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("Hello @amsaid", { delay: 50 });

                for (let i = 0; i < 7; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("@", { delay: 50 });

                const p = editor.locator("p");
                const span = editor.locator("span");

                await expect(span).toBeHidden();
                await expect(await p.count()).toBe(1);
                await expect(p).toHaveText("Hello @@amsaid");
            });

            test("If the user types the @ character, followed by other word characters, immediately before a highlighted hashtag, with no characters separating them, then the highlighting will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("Hello @amsaid", { delay: 50 });

                const p = editor.locator("p");
                const span = editor.locator("span");

                for (let i = 0; i < 7; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("@abdelrahman", { delay: 50 });

                await expect(span).toBeHidden();
                await expect(await p.count()).toBe(1);
                await expect(p).toHaveText("Hello @abdelrahman@amsaid");
            });

            test("If the user types the @ character after a highlighted mention, then the highlighting will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("Hello @amsaid1989@", { delay: 50 });

                const p = editor.locator("p");
                const span = editor.locator("span");

                await expect(span).toBeHidden();
                await expect(await p.count()).toBe(1);
                await expect(p).toHaveText("Hello @amsaid1989@");
            });

            test("If we have multiple mentions one after the other, with no non-word characters separating them, then none of them should be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("@amsaid@abdelrahman", { delay: 50 });

                const p = editor.locator("p");
                const span = editor.locator("span");

                await expect(span).toBeHidden();
                await expect(await p.count()).toBe(1);
                await expect(p).toHaveText("@amsaid@abdelrahman");
            });
        });
    });
});
