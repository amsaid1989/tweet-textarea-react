import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
});

test.describe("URLs", async () => {
    test.describe(
        "Non-word characters in the subdirectory part of the URL",
        async () => {
            test("If the subdirectory part of the URL ends with the : character, then the highlighting will only apply to everything before the : character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings:", { delay: 100 });

                const span = editor.locator("span");

                await expect(span).toBeVisible();
                await expect(await span.count()).toBe(1);
                await expect(span).toHaveText("hello.com/greetings");
                await expect(span).toHaveClass("highlight");
            });

            test("If the subdirectory part of the URL includes the : character but not at the end, then the : character will be included in the highlighting", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings:hello", { delay: 100 });

                const span = editor.locator("span");

                await expect(span).toBeVisible();
                await expect(await span.count()).toBe(1);
                await expect(span).toHaveText("hello.com/greetings:hello");
                await expect(span).toHaveClass("highlight");
            });

            test("If the subdirectory part of the URL ends with the ; character, then the highlighting will only apply to everything before the ; character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings;", { delay: 100 });

                const span = editor.locator("span");

                await expect(span).toBeVisible();
                await expect(await span.count()).toBe(1);
                await expect(span).toHaveText("hello.com/greetings");
                await expect(span).toHaveClass("highlight");
            });

            test("If the subdirectory part of the URL includes the ; character but not at the end, then the ; character will be included in the highlighting", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings;hello", { delay: 100 });

                const span = editor.locator("span");

                await expect(span).toBeVisible();
                await expect(await span.count()).toBe(1);
                await expect(span).toHaveText("hello.com/greetings;hello");
                await expect(span).toHaveClass("highlight");
            });

            test("If the subdirectory part of the URL ends with the ' character, then the highlighting will only apply to everything before the ' character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings'", { delay: 100 });

                const span = editor.locator("span");

                await expect(span).toBeVisible();
                await expect(await span.count()).toBe(1);
                await expect(span).toHaveText("hello.com/greetings");
                await expect(span).toHaveClass("highlight");
            });

            test("If the subdirectory part of the URL includes the ' character but not at the end, then the ' character will be included in the highlighting", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings'hello", { delay: 100 });

                const span = editor.locator("span");

                await expect(span).toBeVisible();
                await expect(await span.count()).toBe(1);
                await expect(span).toHaveText("hello.com/greetings'hello");
                await expect(span).toHaveClass("highlight");
            });

            test("If the subdirectory part of the URL ends with the | character, then the highlighting will only apply to everything before the | character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings|", { delay: 100 });

                const span = editor.locator("span");

                await expect(span).toBeVisible();
                await expect(await span.count()).toBe(1);
                await expect(span).toHaveText("hello.com/greetings");
                await expect(span).toHaveClass("highlight");
            });
        }
    );
});
