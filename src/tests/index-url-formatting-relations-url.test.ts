import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
});

test.describe("URLs", async () => {
    test.describe("URL relationship to other entities", async () => {
        test.describe("URL relationship to other URLs", async () => {
            test("If we have two URLs, that don't include the protocol, sitting next to each other with nothing separating them, then they will be highlighted as 1 URL", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("google.comtwitter.com", { delay: 100 });

                const span = editor.locator("span");

                await expect(span).toBeVisible();
                await expect(await span.count()).toBe(1);
                await expect(span).toHaveText("google.comtwitter.com");
                await expect(span).toHaveClass("highlight");
            });

            test("If we have two URLs, with the first one including the protocol, sitting next to each other with nothing separating them, then they will be highlighted as 1 URL", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("https://google.comtwitter.com", {
                    delay: 100,
                });

                const span = editor.locator("span");

                await expect(span).toBeVisible();
                await expect(await span.count()).toBe(1);
                await expect(span).toHaveText("https://google.comtwitter.com");
                await expect(span).toHaveClass("highlight");
            });

            test("If we have two URLs, with both including the protocol, sitting next to each other with nothing separating them, then none of them will be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("https://google.comhttps://twitter.com", {
                    delay: 100,
                });

                const p = editor.locator("p");
                const span = editor.locator("span");

                await expect(span).toBeHidden();
                await expect(await p.count()).toBe(1);
                await expect(p).toHaveText(
                    "https://google.comhttps://twitter.com"
                );
            });
        });
    });
});
