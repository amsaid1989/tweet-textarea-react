import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	await page.goto("/");
});

test.describe("Cashtags", async () => {
	test.describe("Cashtags relation to other entities", async () => {
		test.describe("Cashtags in relation to user mentions", async () => {
			test("If the user types the @ character after a highlighted cashtag, then the highlighting will be maintained", async ({
				page,
			}) => {
				const editor = page.locator("div.input-area");

				await editor.type("Hello $google@", { delay: 500 });

				const span = editor.locator("span");

				await expect(span).toBeVisible();
				expect(await span.count()).toBe(1);
				await expect(span).toHaveText("$google");
			});

			test("If the user types a valid user mention after a highlighted cashtag, then the highlighting will be maintained", async ({
				page,
			}) => {
				const editor = page.locator("div.input-area");

				await editor.type("Hello $google@amsaid1989", { delay: 500 });

				const span = editor.locator("span");

				await expect(span).toBeVisible();
				expect(await span.count()).toBe(1);
				await expect(span).toHaveText("$google");
			});

			test("If the user types the @ character immediately before a highlighted cashtag, with no characters separating them, then the highlighting will be removed", async ({
				page,
			}) => {
				const editor = page.locator("div.input-area");

				await editor.type("Hello $google", { delay: 500 });

				for (let i = 0; i < 7; i++) {
					await editor.press("ArrowLeft");
				}

				await editor.type("@", { delay: 500 });

				const p = editor.locator("p");
				const span = editor.locator("span");

				await expect(span).toBeHidden();
				expect(await p.count()).toBe(1);
				await expect(p).toHaveText("Hello @$google");
			});

			test("If the user types the @ character, followed by other word characters, immediately before a highlighted cashtag, with no characters separating them, then the highlighting will be removed", async ({
				page,
			}) => {
				const editor = page.locator("div.input-area");

				await editor.type("Hello $google", { delay: 500 });

				const span = editor.locator("span");

				for (let i = 0; i < 7; i++) {
					await editor.press("ArrowLeft");
				}

				await editor.type("@amsaid1989", { delay: 500 });

				await expect(span).toBeVisible();
				expect(await span.count()).toBe(1);
				await expect(span).toHaveText("@amsaid1989");
			});
		});
	});
});
