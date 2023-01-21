import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	await page.goto("/");
});

test("When the user types some text that doesn't match any patterns, nothing should be formatted", async ({
	page,
}) => {
	const editor = page.locator("div.input-area");

	await editor.type("Hello from TweetTextarea", { delay: 500 });

	const span = page.locator("span.highlight");
	const p = editor.locator("p");

	await expect(span).toBeHidden();
	expect(await p.count()).toBe(1);
	await expect(p).toHaveText("Hello from TweetTextarea");
});
