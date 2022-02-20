import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
});

test.describe("URLs", async () => {
    test.describe("URL relationship to other entities", async () => {
        test.describe("URL relationship to user mentinos", async () => {
            test("If a user mention comes immediately after the top level domain, then neither the URL nor the user mention will be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com@amsaid1989", { delay: 50 });

                const p = editor.locator("p");
                const span = editor.locator("span");

                await expect(span).toBeHidden();
                await expect(await p.count()).toBe(1);
                await expect(p).toHaveText("hello.com@amsaid1989");
            });

            test("If a user mention comes immediately after the top level domain, but there is another part of the URL that can work as top level domain, then that part will be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.co.uk@amsaid198", { delay: 50 });

                const span = editor.locator("span");

                await expect(span).toBeVisible();
                await expect(await span.count()).toBe(1);
                await expect(span).toHaveText("hello.co");
                await expect(span).toHaveClass("highlight");
            });

            test("If we add the @ character before a highlighted URL that doesn't include the protocol, then the highlighting of the URL will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("google.com", { delay: 50 });

                for (let i = 0; i < 10; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("@", { delay: 50 });

                const span = editor.locator("span");

                await expect(span).toBeVisible();
                await expect(await span.count()).toBe(1);
                await expect(span).toHaveText("@google");
                await expect(span).toHaveClass("highlight");
            });

            test("If we add a user mention before a highlighted URL that doesn't include the protocol, then the highlighting of the URL will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("google.com", { delay: 50 });

                for (let i = 0; i < 10; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("@amsaid1989", { delay: 50 });

                const span = editor.locator("span");

                await expect(span).toBeVisible();
                await expect(await span.count()).toBe(1);
                await expect(span).toHaveText("@amsaid1989google");
                await expect(span).toHaveClass("highlight");
            });

            test("If we add the @ character before a highlighted URL that includes the protocol, then nothing will be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("https://google.com", { delay: 50 });

                for (let i = 0; i < 18; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("@", { delay: 50 });

                const p = editor.locator("p");
                const span = editor.locator("span");

                await expect(span).toBeHidden();
                await expect(await p.count()).toBe(1);
                await expect(p).toHaveText("@https://google.com");
            });

            test("If we add a user mention before a highlighted URL that includes the protocol, then nothing will be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("https://google.com", { delay: 50 });

                for (let i = 0; i < 18; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("@amsaid1989", { delay: 50 });

                const p = editor.locator("p");
                const span = editor.locator("span");

                await expect(span).toBeHidden();
                await expect(await p.count()).toBe(1);
                await expect(p).toHaveText("@amsaid1989https://google.com");
            });
        });
    });
});
