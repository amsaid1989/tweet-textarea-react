import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	await page.goto("/");
});

test.describe("Hashtags", async () => {
	test.describe("Text matches hashtag pattern", async () => {
		test("If the user types something after the #, and the result matches the hashtag pattern, it should be highlighted", async ({
			page,
		}) => {
			const editor = page.locator("div.input-area");

			await editor.type("Hello #100DaysOfCode", { delay: 500 });

			const span = editor.locator("span");

			await expect(span).toBeVisible();
			expect(await span.count()).toBe(1);
			await expect(span).toHaveText("#100DaysOfCode");
		});

		test("When the user adds a non-word character after a sequence of word characters that match the hashtag pattern, then the formatting should stop before the non-word character", async ({
			page,
		}) => {
			const editor = page.locator("div.input-area");

			await editor.type("Hello #100DaysOfCode-2022", { delay: 500 });

			const span = editor.locator("span");

			await expect(span).toBeVisible();
			expect(await span.count()).toBe(1);
			await expect(span).toHaveText("#100DaysOfCode");
		});

		test("If the user erases characters from a string that doesn't match the hashtag pattern, making it match, then the text should be highlighted", async ({
			page,
		}) => {
			const editor = page.locator("div.input-area");

			await editor.type("Hello #100-days", { delay: 500 });

			for (let i = 0; i < 4; i++) {
				await editor.press("ArrowLeft");
			}

			await editor.press("Backspace");

			const span = editor.locator("span");

			await expect(span).toBeVisible();
			expect(await span.count()).toBe(1);
			await expect(span).toHaveText("#100days");
		});
	});
});
