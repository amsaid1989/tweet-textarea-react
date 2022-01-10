import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
});

test.describe("Mentions", async () => {
    test.describe("No match for mention pattern", async () => {
        test("When the user type the @ character alone, nothing should be formatted", async ({
            page,
        }) => {
            const editor = page.locator("div#editor");

            await editor.type("Hello @");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeHidden();
            await expect(html).toBe("<p>Hello @</p>");
        });

        test("If the user types non-word characters immediately after the @, it shouldn't be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div#editor");

            await editor.type("Hello @-amsaid1989");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeHidden();
            await expect(html).toBe("<p>Hello @-amsaid1989</p>");
        });

        test("When the user erases characters from a string that matches the mention pattern, making it no longer matching, the highlighting should be removed", async ({
            page,
        }) => {
            const editor = page.locator("div#editor");

            await editor.type("Hello @amsaid");

            for (let i = 0; i < 6; i++) {
                await editor.press("Backspace");
            }

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeHidden();
            await expect(html).toBe("<p>Hello @</p>");
        });

        test("If the user adds word characters immediately before a highlighted mention, with no non-word characters separating them, then the highlighting should be removed", async ({
            page,
        }) => {
            const editor = page.locator("div#editor");

            await editor.type("Hello @amsaid1989");

            const span = page.locator("span.highlight");

            for (let i = 0; i < 11; i++) {
                await editor.press("ArrowLeft");
            }

            await editor.type("from");

            await expect(span).toBeHidden();
        });
    });

    test.describe("Text matches mention pattern", async () => {
        test("If the user types something after the @, and the result matches the mention pattern, it should be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div#editor");

            await editor.type("Hello @amsaid1989");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeVisible();
            await expect(html).toBe(
                '<p>Hello <span class="highlight">@amsaid1989</span></p>'
            );
        });

        test("When the user adds a non-word character after a sequence of word characters that match the mention pattern, then the formatting should stop before the non-word character", async ({
            page,
        }) => {
            const editor = page.locator("div#editor");

            await editor.type("Hello @amsaid1989-2022");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeVisible();
            await expect(html).toBe(
                '<p>Hello <span class="highlight">@amsaid1989</span>-2022</p>'
            );
        });

        test("If the user erases characters from a string that doesn't match the mention pattern, making it match, then the text should be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div#editor");

            await editor.type("Hello @-amsaid");

            for (let i = 0; i < 6; i++) {
                await editor.press("ArrowLeft");
            }

            await editor.press("Backspace");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeVisible();
            await expect(html).toBe(
                '<p>Hello <span class="highlight">@amsaid</span></p>'
            );
        });
    });

    test.describe("Mentions relation to other entities", async () => {
        test.describe("Mentions in relation to other mentinos", async () => {
            test("If the user types the @ character immediately before a highlighted mention, with no characters separating them, then the highlighting will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello @amsaid");

                for (let i = 0; i < 7; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("@");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe("<p>Hello @@amsaid</p>");
            });

            test("If the user types the @ character, followed by other word characters, immediately before a highlighted hashtag, with no characters separating them, then the highlighting will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello @amsaid");

                const span = page.locator("span.highlight");

                for (let i = 0; i < 7; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("@abdelrahman");

                await expect(span).toBeHidden();
            });

            test("If the user types the @ character after a highlighted mention, then the highlighting will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello @amsaid1989@");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeHidden();
                await expect(html).toBe("<p>Hello @amsaid1989@</p>");
            });

            test("If we have multiple mentions one after the other, with no non-word characters separating them, then none of them should be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("@amsaid@abdelrahman");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeHidden();
                await expect(html).toBe("<p>@amsaid@abdelrahman</p>");
            });
        });

        test.describe("Mentions in relation to hashtags", async () => {
            test("If the user types the # character after a highlighted mention, then the highlighting will be maintained", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello @amsaid1989#");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p>Hello <span class="highlight">@amsaid1989</span>#</p>'
                );
            });

            test("If the user types a valid hashtag after a highlighted mention, then the highlighting will be maintained", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello @amsaid1989#100DaysOfCode");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p>Hello <span class="highlight">@amsaid1989</span>#100DaysOfCode</p>'
                );
            });

            test("If the user types the # character immediately before a highlighted mention, with no characters separating them, then the highlighting will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello @amsaid");

                for (let i = 0; i < 7; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("#");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe("<p>Hello #@amsaid</p>");
            });

            test("If the user types the # character, followed by other word characters, immediately before a highlighted mention, with no characters separating them, then the highlighting will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello @amsaid");

                const span = page.locator("span.highlight");

                for (let i = 0; i < 7; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("#100Days");

                await expect(span).toBeHidden();
            });
        });

        test.describe("Mentions in relation to cashtags", async () => {
            test("If the user types the $ character after a highlighted mention, then the highlighting will be maintained", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello @amsaid1989$");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p>Hello <span class="highlight">@amsaid1989</span>$</p>'
                );
            });

            test("If the user types a valid cashtag after a highlighted mention, then the highlighting will be maintained", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello @amsaid1989$AMZN");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p>Hello <span class="highlight">@amsaid1989</span>$AMZN</p>'
                );
            });

            test("If the user types the $ character immediately before a highlighted mention, with no characters separating them, then the highlighting will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello @amsaid");

                for (let i = 0; i < 7; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("$");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe("<p>Hello $@amsaid</p>");
            });

            test("If the user types the $ character, followed by other word characters, immediately before a highlighted hashtag, with no characters separating them, then the highlighting will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello @amsaid");

                const span = page.locator("span.highlight");

                for (let i = 0; i < 7; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("$AMZN");

                await expect(span).toBeHidden();
            });
        });
    });
});
