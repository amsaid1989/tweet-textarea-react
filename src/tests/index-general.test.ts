import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
});

test.describe("General tests", async () => {
    test("Content-editable div with id=editor should exist", async ({
        page,
    }) => {
        const editor = page.locator("div#editor");

        await expect(editor).toBeVisible();
        await expect(editor).toHaveAttribute("contenteditable", "true");
    });

    test("The editor accepts user input", async ({ page }) => {
        const editor = page.locator("div#editor");

        await editor.type("Hello from TweetTextarea!");

        await expect(editor).toHaveText("Hello from TweetTextarea!");
    });
});
