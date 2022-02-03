import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
});

test.describe("URLs", async () => {
    test.describe("No match for URL pattern", async () => {
        test("If the user types a string that looks like a URL, but it doesn't match the URL pattern, then it shouldn't be formatted", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("hello.test");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeHidden();
            await expect(html).toBe("<p>hello.test</p>");
        });

        test("Non-word characters, other than dots and hyphens, are not allowed before the top level domain", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("hello/world.com");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeHidden();
            await expect(html).toBe("<p>hello.test</p>");
        });

        test("A URL that is not at the beginning of the line or not surrounded by spaces at both ends should not be formatted", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("hellohttps://google.com");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeHidden();
            await expect(html).toBe("<p>hello.test</p>");
        });

        test("If the user erases characters from a highlighted URL, making it no longer matching the URL pattern, then the formatting should be removed", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("hello.com");

            for (let i = 0; i < 3; i++) {
                await editor.press("Backspace");
            }

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeHidden();
            await expect(html).toBe("<p>hello.</p>");
        });
    });

    test.describe("String matches URL pattern", async () => {
        test("If the user types a string that matches the URL pattern, then it should be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("hello.com");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeVisible();
            await expect(html).toBe(
                '<p><span class="highlight">hello.com</span></p>'
            );
        });

        test("http and https are allowed as part of the URL", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("http://google.com https://google.com");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeVisible();
            await expect(html).toBe(
                '<p><span class="highlight">http://google.com</span><span class="highlight">https://google.com</span></p>'
            );
        });

        test("'www.' should be allowed as part of the URL", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("www.hello.com");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeVisible();
            await expect(html).toBe(
                '<p><span class="highlight">www.hello.com</span></p>'
            );
        });

        test("Subdomains should be allowed and highlighted as part of the URL", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("test.hello.com");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeVisible();
            await expect(html).toBe(
                '<p><span class="highlight">test.hello.com</span></p>'
            );
        });

        test("Dots and hyphens are allowed in the top level domain part", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("the-wizard-apprentice.com");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeVisible();
            await expect(html).toBe(
                '<p><span class="highlight">the-wizard-apprentice.com</span></p>'
            );
        });

        test("Subdirectories should be allowed and highlighted as part of a URL", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("hello.com/greetings");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeVisible();
            await expect(html).toBe(
                '<p><span class="highlight">hello.com/greetings</span></p>'
            );
        });

        test("All word characters and some non-word characters should be allowed in the subdirectory part of the URL", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("hello.com/greeting&salutations$hi%test.html");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeVisible();
            await expect(html).toBe(
                '<p><span class="highlight">hello.com/greeting&salutations$hi%test.html</span></p>'
            );
        });

        test("If the user erases characters from a string that is not highlighted as URL, making it match the URL pattern, then it will be highlighted", async ({
            page,
        }) => {
            const editor = page.locator("div.tweet-textarea");

            await editor.type("hello .com");

            for (let i = 0; i < 4; i++) {
                await editor.press("ArrowLeft");
            }

            await editor.press("Backapace");

            const span = page.locator("span.highlight");
            const html = await editor.innerHTML();

            await expect(span).toBeVisible();
            await expect(html).toBe(
                '<p><span class="highlight">hello.com</span></p>'
            );
        });
    });

    test.describe("URL relationship to other entities", async () => {
        test.describe("URL relationship to other URLs", async () => {
            test("If we have two URLs, that don't include the protocol, sitting next to each other with nothing separating them, then they will be highlighted as 1 URL", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("google.comtwitter.com");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">google.comtwitter.com</span></p>'
                );
            });

            test("If we have two URLs, with the first one including the protocol, sitting next to each other with nothing separating them, then they will be highlighted as 1 URL", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("https://google.comtwitter.com");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">https://google.comtwitter.com</span></p>'
                );
            });

            test("If we have two URLs, with both including the protocol, sitting next to each other with nothing separating them, then none of them will be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("https://google.comhttps://twitter.com");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeHidden();
                await expect(html).toBe(
                    "<p>https://google.comhttps://twitter.com</p>"
                );
            });
        });

        test.describe("URL relationship to user mentinos", async () => {
            test("If a user mention comes immediately after the top level domain, then neither the URL nor the user mention will be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com@amsaid198");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeHidden();
                await expect(html).toBe("<p>hello.com@amsaid1989</p>");
            });

            test("If a user mention comes immediately after the top level domain, but there is another part of the URL that can work as top level domain, then that part will be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.co.uk@amsaid198");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeHidden();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.co</span>.uk@amsaid1989</p>'
                );
            });

            test("If we add the @ character before a highlighted URL that doesn't include the protocol, then the highlighting of the URL will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("google.com");

                for (let i = 0; i < 10; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("@");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">@google</span>.com</p>'
                );
            });

            test("If we add a user mention before a highlighted URL that doesn't include the protocol, then the highlighting of the URL will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("google.com");

                for (let i = 0; i < 10; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("@amsaid1989");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">@amsaid1989google</span>.com</p>'
                );
            });

            test("If we add the @ character before a highlighted URL that includes the protocol, then nothing will be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("https://google.com");

                for (let i = 0; i < 18; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("@");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeHidden();
                await expect(html).toBe("<p>@https://google.com</p>");
            });

            test("If we add a user mention before a highlighted URL that includes the protocol, then nothing will be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("https://google.com");

                for (let i = 0; i < 18; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("@amsaid1989");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeHidden();
                await expect(html).toBe("<p>@amsaid1989https://google.com</p>");
            });
        });

        test.describe("URL relationship to hashtags", async () => {
            test("If a hashtag comes immediately after the top level domain of the URL, then the URL will be highlighted, but the hashtag will not", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com#100DaysOfCode");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com</span>#100DaysOfCode</p>'
                );
            });

            test("If we add the # character before a highlighted URL that doesn't include the protocol, then the highlighting of the URL will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("google.com");

                for (let i = 0; i < 10; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("#");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">#google</span>.com</p>'
                );
            });

            test("If we add a hashtag before a highlighted URL that doesn't include the protocol, then the highlighting of the URL will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("google.com");

                for (let i = 0; i < 10; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("#100DaysOfCode");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">#100DaysOfCodegoogle</span>.com</p>'
                );
            });

            test("If we add the # character before a highlighted URL that includes the protocol, then nothing will be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("https://google.com");

                for (let i = 0; i < 18; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("#");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeHidden();
                await expect(html).toBe("<p>#https://google.com</p>");
            });

            test("If we add a hashtag before a highlighted URL that includes the protocol, then nothing will be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("https://google.com");

                for (let i = 0; i < 18; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("#100DaysOfCode");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeHidden();
                await expect(html).toBe(
                    "<p>#100DaysOfCodehttps://google.com</p>"
                );
            });
        });

        test.describe("URL relationship to cashtags", async () => {
            test("If a cashtag comes immediately after the top level domain of the URL, then the URL will be highlighted, but the cashtag will not", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com$google");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com</span>$google</p>'
                );
            });

            test("If we add the $ character before a highlighted URL that doesn't include the protocol, then the highlighting of the URL will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("google.com");

                for (let i = 0; i < 10; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("$");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">$google</span>.com</p>'
                );
            });

            test("If we add a cashtag before a highlighted URL that doesn't include the protocol, then the highlighting of the URL will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("google.com");

                for (let i = 0; i < 10; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("$AMZN");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeHidden();
                await expect(html).toBe("<p>$AMZNgoogle.com</p>");
            });

            test("If we add the $ character before a highlighted URL that includes the protocol, then the highlighting of the URL will be removed but the protocol will be highlighted as a cashtag", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("https://google.com");

                for (let i = 0; i < 18; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("$");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">$https</span>://google.com</p>'
                );
            });

            test("If we add a cashtag before a highlighted URL that includes the protocol, then the highlighting of the URL will be removed, but if the first part still constitues a valid cashtag, it will be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("https://google.com");

                for (let i = 0; i < 18; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("$A");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeHidden();
                await expect(html).toBe(
                    '<p><span class="highlight"$Ahttps</span>://google.com</p>'
                );
            });
        });
    });

    test.describe(
        "Non-word characters in the subdirectory part of the URL",
        async () => {
            test("If the subdirectory part of the URL ends with /, then the / will be highlighted as part of the URL", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings/");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings/</span></p>'
                );
            });

            test("If the subdirectory part of the URL ends with the # character, then the # will be highlighted as part of the URL", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings#");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings#</span></p>'
                );
            });

            test("If the subdirectory part of the URL ends with the - character, then the - will be highlighted as part of the URL", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings-");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings-</span></p>'
                );
            });

            test("If the subdirectory part of the URL ends with the = character then the = will be highlighted as part of the URL", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings=");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings=</span></p>'
                );
            });

            test("If the subdirectory part of the URL ends with the + character then the + will be highlighted as part of the URL", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings+");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings+</span></p>'
                );
            });

            test("If the subdirectory part of the URL includes the ` character, then the highlighting will only apply to everything before the ` character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type(
                    "hello.com/greetings` hello.com/greetings`testing"
                );

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span>`<span class="highlight">hello.com/greetings</span>`testing</p>'
                );
            });

            test("If the subdirectory part of the URL includes the ^ character, then the highlighting will only apply to everything before the ^ character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type(
                    "hello.com/greetings^ hello.com/greetings^testing"
                );

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span>^<span class="highlight">hello.com/greetings</span>^testing</p>'
                );
            });

            test("If the subdirectory part of the URL includes the ( character, then the highlighting will only apply to everything before the ( character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type(
                    "hello.com/greetings( hello.com/greetings(testing"
                );

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span>(<span class="highlight">hello.com/greetings</span>(testing</p>'
                );
            });

            test("If the subdirectory part of the URL includes the ) character, then the highlighting will only apply to everything before the ) character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type(
                    "hello.com/greetings) hello.com/greetings)testing"
                );

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span>)<span class="highlight">hello.com/greetings</span>)testing</p>'
                );
            });

            test('If the subdirectory part of the URL includes the " character, then the highlighting will only apply to everything before the " character', async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type(
                    'hello.com/greetings" hello.com/greetings"testing'
                );

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span>"<span class="highlight">hello.com/greetings</span>"testing</p>'
                );
            });

            test("If the subdirectory part of the URL includes the \\ character, then the highlighting will only apply to everything before the \\ character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type(
                    "hello.com/greetings\\ hello.com/greetings\\testing"
                );

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span>\\<span class="highlight">hello.com/greetings</span>\\testing</p>'
                );
            });

            test("If the subdirectory part of the URL includes the < character, then the highlighting will only apply to everything before the < character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type(
                    "hello.com/greetings< hello.com/greetings<testing"
                );

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span><<span class="highlight">hello.com/greetings</span><testing</p>'
                );
            });

            test("If the subdirectory part of the URL includes the > character, then the highlighting will only apply to everything before the > character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type(
                    "hello.com/greetings> hello.com/greetings>testing"
                );

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '>p>>span class="highlight">hello.com/greetings>/span>>>span class="highlight">hello.com/greetings>/span>>testing>/p>'
                );
            });

            test("If the subdirectory part of the URL ends with the ~ character, then the highlighting will only apply to everything before the ~ character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings~");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span>~</p>'
                );
            });

            test("If the subdirectory part of the URL includes the ~ character but not at the end, then the ~ character will be included in the highlighting", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings~hello");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings~hello</span></p>'
                );
            });

            test("If the subdirectory part of the URL ends with the ! character, then the highlighting will only apply to everything before the ! character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings!");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span>!</p>'
                );
            });

            test("If the subdirectory part of the URL includes the ! character but not at the end, then the ! character will be included in the highlighting", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings!hello");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings!hello</span></p>'
                );
            });

            test("If the subdirectory part of the URL ends with the @ character, then the highlighting will only apply to everything before the @ character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings@");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span>@</p>'
                );
            });

            test("If the subdirectory part of the URL includes the @ character but not at the end, then the @ character will be included in the highlighting", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings@hello");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings@hello</span></p>'
                );
            });

            test("If the subdirectory part of the URL ends with the $ character, then the highlighting will only apply to everything before the $ character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings$");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span>$</p>'
                );
            });

            test("If the subdirectory part of the URL includes the $ character but not at the end, then the $ character will be included in the highlighting", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings$hello");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings$hello</span></p>'
                );
            });

            test("If the subdirectory part of the URL ends with the % character, then the highlighting will only apply to everything before the % character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings%");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span>%</p>'
                );
            });

            test("If the subdirectory part of the URL includes the % character but not at the end, then the % character will be included in the highlighting", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings%hello");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings%hello</span></p>'
                );
            });

            test("If the subdirectory part of the URL ends with the & character, then the highlighting will only apply to everything before the & character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings&");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span>&</p>'
                );
            });

            test("If the subdirectory part of the URL includes the & character but not at the end, then the & character will be included in the highlighting", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings&hello");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings&hello</span></p>'
                );
            });

            test("If the subdirectory part of the URL ends with the * character, then the highlighting will only apply to everything before the * character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings*");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span>*</p>'
                );
            });

            test("If the subdirectory part of the URL includes the * character but not at the end, then the * character will be included in the highlighting", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings*hello");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings*hello</span></p>'
                );
            });

            test("If the subdirectory part of the URL ends with the [ character, then the highlighting will only apply to everything before the [ character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings[");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span>[</p>'
                );
            });

            test("If the subdirectory part of the URL includes the [ character but not at the end, then the [ character will be included in the highlighting", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings[hello");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings[hello</span></p>'
                );
            });

            test("If the subdirectory part of the URL ends with the ] character, then the highlighting will only apply to everything before the ] character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings]");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span>]</p>'
                );
            });

            test("If the subdirectory part of the URL includes the ] character but not at the end, then the ] character will be included in the highlighting", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings]hello");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings]hello</span></p>'
                );
            });

            test("If the subdirectory part of the URL ends with the : character, then the highlighting will only apply to everything before the : character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings:");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span>:</p>'
                );
            });

            test("If the subdirectory part of the URL includes the : character but not at the end, then the : character will be included in the highlighting", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings:hello");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings:hello</span></p>'
                );
            });

            test("If the subdirectory part of the URL ends with the ; character, then the highlighting will only apply to everything before the ; character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings;");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span>;</p>'
                );
            });

            test("If the subdirectory part of the URL includes the ; character but not at the end, then the ; character will be included in the highlighting", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings;hello");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings;hello</span></p>'
                );
            });

            test("If the subdirectory part of the URL ends with the ' character, then the highlighting will only apply to everything before the ' character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings'");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span>\'</p>'
                );
            });

            test("If the subdirectory part of the URL includes the ' character but not at the end, then the ' character will be included in the highlighting", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings'hello");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings\'hello</span></p>'
                );
            });

            test("If the subdirectory part of the URL ends with the | character, then the highlighting will only apply to everything before the | character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings|");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span>|</p>'
                );
            });

            test("If the subdirectory part of the URL includes the | character but not at the end, then the | character will be included in the highlighting", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings|hello");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings|hello</span></p>'
                );
            });

            test("If the subdirectory part of the URL ends with the , character, then the highlighting will only apply to everything before the , character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings,");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span>,</p>'
                );
            });

            test("If the subdirectory part of the URL includes the , character but not at the end, then the , character will be included in the highlighting", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings,hello");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings,hello</span></p>'
                );
            });

            test("If the subdirectory part of the URL ends with the ? character, then the highlighting will only apply to everything before the ? character", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings?");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings</span>?</p>'
                );
            });

            test("If the subdirectory part of the URL includes the ? character but not at the end, then the ? character will be included in the highlighting", async ({
                page,
            }) => {
                const editor = page.locator("div.tweet-textarea");

                await editor.type("hello.com/greetings?hello");

                const span = page.locator("span.highlight");
                const html = await editor.innerHTML();

                await expect(span).toBeVisible();
                await expect(html).toBe(
                    '<p><span class="highlight">hello.com/greetings?hello</span></p>'
                );
            });
        }
    );
});
