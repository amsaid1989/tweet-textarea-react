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

            await editor.type("Hello #");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeHidden();
            await expect(html).toBe("<p>Hello #</p>");
        });

        test("If the user types word characters after the #, but the result doesn't match the hashtag pattern, it shouldn't be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("Hello #100");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeHidden();
            await expect(html).toBe("<p>Hello #100</p>");
        });

        test("If the user types non-word characters immediately after the #, it shouldn't be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("Hello #-hello");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeHidden();
            await expect(html).toBe("<p>Hello #-hello</p>");
        });

        test("When the user erases characters from a string that matches the hashtag pattern, making it no longer matching, the highlighting should be removed", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("Hello #100days");

            for (let i = 0; i < 4; i++) {
                await editor.press("Backspace");
            }

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeHidden();
            await expect(html).toBe("<p>Hello #100</p>");
        });

        test("If the user adds word characters immediately before a highlighted hashtag, with no non-word characters separating them, then the highlighting should be removed", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("Hello #100days");

            const span = page.locator("span.highlight");

            for (let i = 0; i < 8; i++) {
                await editor.press("ArrowLeft");
            }

            await editor.type("from");

            await expect(span).toBeHidden();
        });
    });

    test.describe("Text matches hashtag pattern", async () => {
        test("If the user types something after the #, and the result matches the hashtag pattern, it should be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("Hello #100DaysOfCode");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeVisible();
            await expect(html).toBe(
                '<p>Hello <span class="highlight">#100DaysOfCode</span></p>'
            );
        });

        test("When the user adds a non-word character after a sequence of word characters that match the hashtag pattern, then the formatting should stop before the non-word character", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("Hello #100DaysOfCode-2022");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeVisible();
            await expect(html).toBe(
                '<p>Hello <span class="highlight">#100DaysOfCode</span>-2022</p>'
            );
        });

        test("If the user erases characters from a string that doesn't match the hashtag pattern, making it match, then the text should be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("Hello #100-days");

            for (let i = 0; i < 4; i++) {
                await editor.press("ArrowLeft");
            }

            await editor.press("Backspace");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeVisible();
            await expect(html).toBe(
                '<p>Hello <span class="highlight">#100days</span></p>'
            );
        });
    });

    test.describe("Hashtags relation to other entities", async () => {
        test.describe("Hashtags in relation to other hashtags", async () => {
            test("If the user types the # character immediately before a highlighted hashtag, with no characters separating them, then the highlighting will be maintained", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("Hello #100days");

                for (let i = 0; i < 8; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("#");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p>Hello #<span class="highlight">#100days</span></p>'
                );
            });

            test("If the user types the # character, followed by other word characters, immediately before a highlighted hashtag, with no characters separating them, then the highlighting will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("Hello #100days");

                const span = page.locator("span.highlight");

                for (let i = 0; i < 8; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("#500");

                await expect(span).toBeHidden();
            });

            test("If the user types the # character after a highlighted hashtag, then the highlighting will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("Hello #100DaysOfCode#");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeHidden();
                await expect(html).toBe("<p>Hello #100DaysOfCode#</p>");
            });

            test("If we have multiple hashtags one after the other, with no non-word characters separating them, then none of them should be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("#buildinpublic#100DaysOfCode");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeHidden();
                await expect(html).toBe("<p>#buildinpublic#100DaysOfCode</p>");
            });
        });

        test.describe("Hashtags in relation to user mentions", async () => {
            test("If the user types the @ character after a highlighted hashtag, then the highlighting will be maintained", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("Hello #100DaysOfCode@");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p>Hello <span class="highlight">#100DaysOfCode</span>@</p>'
                );
            });

            test("If the user types a valid user mention after a highlighted hashtag, then the highlighting will be maintained", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("Hello #100DaysOfCode@amsaid1989");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p>Hello <span class="highlight">#100DaysOfCode</span>@amsaid1989</p>'
                );
            });

            test("If the user types the @ character immediately before a highlighted hashtag, with no characters separating them, then the highlighting will be maintained", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("Hello #100days");

                for (let i = 0; i < 8; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("@");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p>Hello @<span class="highlight">#100days</span></p>'
                );
            });

            test("If the user types the @ character, followed by other word characters, immediately before a highlighted hashtag, with no characters separating them, then the highlighting will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("Hello #100days");

                const span = page.locator("span.highlight");

                for (let i = 0; i < 8; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("@amsaid1989");

                await expect(span).toBeHidden();
            });
        });

        test.describe("Hashtags in relation to cashtags", async () => {
            test("If the user types the $ character after a highlighted hashtag, then the highlighting will be maintained", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("Hello #100DaysOfCode$");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p>Hello <span class="highlight">#100DaysOfCode</span>$</p>'
                );
            });

            test("If the user types a valid cashtag after a highlighted hashtag, then the highlighting will be maintained", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("Hello #100DaysOfCode$AMZN");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p>Hello <span class="highlight">#100DaysOfCode</span>$AMZN</p>'
                );
            });

            test("If the user types the $ character immediately before a highlighted hashtag, with no characters separating them, then the highlighting will be maintained", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("Hello #100days");

                for (let i = 0; i < 8; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("$");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p>Hello $<span class="highlight">#100days</span></p>'
                );
            });

            test("If the user types the $ character, followed by other word characters, immediately before a highlighted hashtag, with no characters separating them, then the highlighting will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("Hello #100days");

                const span = page.locator("span.highlight");

                for (let i = 0; i < 8; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("$AMZN");

                await expect(span).toBeHidden();
            });
        });
    });
});
