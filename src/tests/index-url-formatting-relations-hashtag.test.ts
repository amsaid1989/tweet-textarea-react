import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
});

test.describe("URLs", async () => {
    test.describe("URL relationship to other entities", async () => {
        test.describe("URL relationship to hashtags", async () => {
            test("If a hashtag comes immediately after the top level domain of the URL, then the URL will be highlighted, but the hashtag will not", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com#100DaysOfCode", { delay: 100 });

                const span = editor.locator("span");

                await expect(span).toBeVisible();
                await expect(await span.count()).toBe(1);
                await expect(span).toHaveText("hello.com");
            });

            test("If we add the # character before a highlighted URL that doesn't include the protocol, then the highlighting of the URL will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("google.com", { delay: 100 });

                for (let i = 0; i < 10; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("#", { delay: 100 });

                const span = editor.locator("span");

                await expect(span).toBeVisible();
                await expect(await span.count()).toBe(1);
                await expect(span).toHaveText("#google");
            });

            test("If we add a hashtag before a highlighted URL that doesn't include the protocol, then the highlighting of the URL will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("google.com", { delay: 100 });

                for (let i = 0; i < 10; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("#100DaysOfCode", { delay: 100 });

                const span = editor.locator("span");

                await expect(span).toBeVisible();
                await expect(await span.count()).toBe(1);
                await expect(span).toHaveText("#100DaysOfCodegoogle");
            });

            test("If we add the # character before a highlighted URL that includes the protocol, then nothing will be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("https://google.com", { delay: 100 });

                for (let i = 0; i < 18; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("#", { delay: 100 });

                const p = editor.locator("p");
                const span = editor.locator("span");

                await expect(span).toBeHidden();
                await expect(await p.count()).toBe(1);
                await expect(p).toHaveText("#https://google.com");
            });

            test("If we add a hashtag before a highlighted URL that includes the protocol, then nothing will be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("https://google.com", { delay: 100 });

                for (let i = 0; i < 18; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("#100DaysOfCode", { delay: 100 });

                const p = editor.locator("p");
                const span = editor.locator("span");

                await expect(span).toBeHidden();
                await expect(await p.count()).toBe(1);
                await expect(p).toHaveText("#100DaysOfCodehttps://google.com");
            });
        });
    });
});
