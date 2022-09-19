import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
});

test.describe("Cashtags", async () => {
    test.describe("Cashtags relation to other entities", async () => {
        test.describe("Cashtags in relation to other cashtags", async () => {
            test("If the user types the $ character immediately before a highlighted cashtag, with no characters separating them, then the highlighting will be removed", async ({
                page,
            }) => {
                const editor = page.locator("div.input-area");

                await editor.type("Hello $google", { delay: 100 });

                for (let i = 0; i < 7; i++) {
                    await editor.press("ArrowLeft");
                }

                await editor.type("$", { delay: 100 });

                const p = editor.locator("p");
                const span = editor.locator("span");

                await expect(span).toBeHidden();
                await expect(await p.count()).toBe(1);
                await expect(p).toHaveText("Hello $$google");
            });

            test("If the user types the $ character after a highlighted cashtag, then the highlighting will be maintained, but the new $ character will not be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div.input-area");

                await editor.type("Hello $google$", { delay: 100 });

                const span = editor.locator("span");

                await expect(span).toBeVisible();
                await expect(await span.count()).toBe(1);
                await expect(span).toHaveText("$google");
            });

            test("If we have multiple cashtags one after the other, with no non-word characters separating them, then only the first of them will be highlighted", async ({
                page,
            }) => {
                const editor = page.locator("div.input-area");

                await editor.type("$AMZN$GOOGLE", { delay: 100 });

                const span = editor.locator("span");

                await expect(span).toBeVisible();
                await expect(await span.count()).toBe(1);
                await expect(span).toHaveText("$AMZN");
            });
        });
    });
});
