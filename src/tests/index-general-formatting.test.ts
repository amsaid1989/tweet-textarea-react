import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
});

test("When the user types some text that doesn't match any patterns, nothing should be formatted", async ({
    page,
}) => {
    const editor = page.locator("div.tweet-textarea");

    await editor.type("Hello from TweetTextarea");

    const span = page.locator("span.highlight");
    const html = await editor.innerHTML();

    await expect(span).toBeHidden();
    await expect(html).toBe("<p>Hello from TweetTextarea</p>");
});
