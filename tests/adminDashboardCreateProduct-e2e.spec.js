import { test, expect } from "@playwright/test";

test("Admin creates a new product and view all products in the all products list", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("admin@admin.com");
  await page.getByPlaceholder("Enter Your Password").click();
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  await page.getByRole("button", { name: "Admin" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();


  await expect(page.getByRole('link', { name: 'Create Product' })).toBeVisible();
  await page.getByRole('link', { name: 'Create Product' }).click();
  await page.waitForURL("http://localhost:3000/dashboard/admin/create-product");

  await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();

  await page.getByPlaceholder("write a name").fill("Product Four");
  await page.getByPlaceholder("write a description").fill("This is Product 4");
  await page.getByPlaceholder("write a Price").fill("29.99");
  await page.getByPlaceholder("write a quantity").fill("100");

  await page.click('.ant-select-selector');
  await page.waitForSelector('.ant-select-item-option');
  await page.click('.ant-select-item-option[title="Category One"]');
  await expect(page.locator('.ant-select-selection-item')).toHaveText('Category One');

  await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
  await page.waitForURL("http://localhost:3000/dashboard/admin/products");

  await expect(page.getByRole('heading', { name: 'Product Four' }).nth(0)).toBeVisible();
  await expect(page.locator('p.card-text').nth(0)).toHaveText('This is Product 4');

});
