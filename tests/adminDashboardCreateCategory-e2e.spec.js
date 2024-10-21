import { test, expect } from "@playwright/test";

test("Admin creates a new category", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("admin@admin.com");
  await page.getByPlaceholder("Enter Your Password").click();
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  await page.getByRole("button", { name: "Admin" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();


  await expect(page.getByRole('link', { name: 'Create Category' })).toBeVisible();
  await page.getByRole('link', { name: 'Create Category' }).click();
  await page.waitForURL("http://localhost:3000/dashboard/admin/create-category");

  await expect(page.getByRole('heading', { name: 'Manage Category' })).toBeVisible();
  await expect(page.getByPlaceholder("Enter new category")).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Category One' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Category Two' })).toBeVisible();

  await page.fill('input[placeholder="Enter new category"]', 'Category Three');
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole('cell', { name: 'Category Three' })).toBeVisible();
});
