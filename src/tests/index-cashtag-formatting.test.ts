import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
});

test.describe("Cashtags", async () => {
    test.describe("No match for cashtag pattern", async () => {
        test("When the user types the $ character alone, nothing should be formatted", async ({
            page,
        }) => {
            const editor = page.locator("div#editor");

            await editor.type("Hello $");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeHidden();
            await expect(html).toBe("<p>Hello $</p>");
        });

        test("If the user types word characters after the $, but the result doesn't match the cashtag pattern, it shouldn't be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div#editor");

            await editor.type("Hello $100 $googleinc $goog22");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeHidden();
            await expect(html).toBe("<p>Hello $100 $googleinc $goog22</p>");
        });

        test("If the user types an underscore immediately after the $ character, it shouldn't be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div#editor");

            await editor.type("Hello $_googl");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeHidden();
            await expect(html).toBe("<p>Hello $_googl</p>");
        });

        test("If the user types non-word characters immediately after the $, it shouldn't be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div#editor");

            await editor.type("Hello $-google");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeHidden();
            await expect(html).toBe("<p>Hello $-google</p>");
        });

        test("When the user erases characters from a string that matches the cashtag pattern, making it no longer matching, the highlighting should be removed", async ({
            page,
        }) => {
            const editor = page.locator("div#editor");

            await editor.type("Hello $google");

            for (let i = 0; i < 6; i++) {
                await editor.press("Backspace");
            }

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeHidden();
            await expect(html).toBe("<p>Hello $</p>");
        });

        test("If the user adds word characters immediately before a highlighted cashtag, with no non-word characters separating them, then the highlighting should be removed", async ({
            page,
        }) => {
            const editor = page.locator("div#editor");

            await editor.type("Hello $google");

            const span = page.locator("span.highlight");

            for (let i = 0; i < 7; i++) {
                await editor.press("ArrowLeft");
            }

            await editor.type("from");

            await expect(span).toBeHidden();
        });
    });

    test.describe("Text matches cashtag pattern", async () => {
        test("If the user types something after the $ character, and the result matches the cashtag pattern, it should be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div#editor");

            await editor.type("Hello $google");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeVisible();
            await expect(html).toBe(
                '<p>Hello <span class="highlight">$google</span></p>'
            );
        });

        test("A suffix made of an underscore and a maximum of two alphabetical characters is allowed and should be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div#editor");

            await editor.type("Hello $google_uk");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeVisible();
            await expect(html).toBe(
                '<p>Hello <span class="highlight">$google_uk</span></p>'
            );
        });

        test("If the suffix doesn't match the rules, then only the cashtag part will be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div#editor");

            await editor.type("Hello $google_inc");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeHidden();
            await expect(html).toBe(
                '<p>Hello <span class="highlight">$google</span>_inc</p>'
            );
        });

        test("When the user adds a non-word character after a sequence of word characters that match the cashtag pattern, then the formatting should stop before the non-word character", async ({
            page,
        }) => {
            const editor = page.locator("div#editor");

            await editor.type("Hello $google-2022");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeVisible();
            await expect(html).toBe(
                '<p>Hello <span class="highlight">$google</span>-2022</p>'
            );
        });

        test("If the user erases characters from a string that doesn't match the cashtag pattern, making it match, then the text should be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div#editor");

            await editor.type("Hello $googleinc");

            for (let i = 0; i < 3; i++) {
                await editor.press("Backspace");
            }

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeVisible();
            await expect(html).toBe(
                '<p>Hello <span class="highlight">$google</span></p>'
            );
        });
    });

    test.describe("Cashtags relation to other entities", async () => {
        test.describe("Cashtags in relation to other cashtags", async () => {
            test("If the user types the $ character immediately before a highlighted cashtag, with no characters separating them, then the highlighting will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello $google");

                for (let i = 0; i < 7; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("$");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeHidden();
                await expect(html).toBe("<p>Hello $$google</p>");
            });

            test("If the user types the $ character, followed by other word characters, immediately before a highlighted cashtag, with no characters separating them, then the highlighting will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello $google");

                const span = page.locator("span.highlight");

                for (let i = 0; i < 7; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("$AMZN");

                await expect(span).toBeHidden();
            });

            test("If the user types the $ character after a highlighted cashtag, then the highlighting will be maintained, but the new $ character will not be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello $google$");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeHidden();
                await expect(html).toBe(
                    '<p>Hello <span class="highlight">$google</span>$</p>'
                );
            });

            test("If we have multiple cashtags one after the other, with no non-word characters separating them, then only the first of them will be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("$AMZN$GOOGLE");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">$AMZN</span>$GOOGLE</p>'
                );
            });
        });

        test.describe("Cashtags in relation to user mentions", async () => {
            test("If the user types the @ character after a highlighted cashtag, then the highlighting will be maintained", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello $google@");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p>Hello <span class="highlight">$google</span>@</p>'
                );
            });

            test("If the user types a valid user mention after a highlighted cashtag, then the highlighting will be maintained", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello $google@amsaid1989");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p>Hello <span class="highlight">$google</span>@amsaid1989</p>'
                );
            });

            test("If the user types the @ character immediately before a highlighted cashtag, with no characters separating them, then the highlighting will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello $google");

                for (let i = 0; i < 7; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("@");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeHidden();
                await expect(html).toBe("<p>Hello @$google</p>");
            });

            test("If the user types the @ character, followed by other word characters, immediately before a highlighted cashtag, with no characters separating them, then the highlighting will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello $google");

                const span = page.locator("span.highlight");

                for (let i = 0; i < 7; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("@amsaid1989");

                await expect(span).toBeHidden();
            });
        });

        test.describe("Cashtags in relation to hashtags", async () => {
            test("If the user types the # character after a highlighted cashtag, then the highlighting will be maintained", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello $google#");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p>Hello <span class="highlight">$google</span>#</p>'
                );
            });

            test("If the user types a valid hashtag after a highlighted cashtag, then the highlighting will be maintained", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello $google#100DaysOfCode");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p>Hello <span class="highlight">$google</span>#100DaysOfCode</p>'
                );
            });

            test("If the user types the # character immediately before a highlighted cashtag, with no characters separating them, then the highlighting will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello $google");

                for (let i = 0; i < 7; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("#");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeHidden();
                await expect(html).toBe("<p>Hello #$google</p>");
            });

            test("If the user types the # character, followed by other word characters, immediately before a highlighted cashtag, with no characters separating them, then the highlighting will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div#editor");

                await editor.type("Hello $google");

                const span = page.locator("span.highlight");

                for (let i = 0; i < 7; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("#100DaysOfCode");

                await expect(span).toBeHidden();
            });
        });
    });
});
