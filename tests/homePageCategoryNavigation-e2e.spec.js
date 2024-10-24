import { test, expect } from "@playwright/test";

test("User navigates to product details from Home Page", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("TestUser@example.com");
  await page.getByPlaceholder("Enter Your Password").click();
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("link", { name: "All Categories" }).click();

  await page.waitForURL("http://localhost:3000/categories");
  await page.getByRole("link", { name: "Category One" }).click();
  const buttons = page.locator("button", { hasText: "More Details" });
  await buttons.nth(0).click();

  await expect(page).toHaveURL("http://localhost:3000/product/product-one");
  await expect(page.getByText("Name : Product One")).toBeVisible();
  await expect(page.getByText("Description : This is Product 1")).toBeVisible();
  await expect(page.getByText("Price :$10.00")).toBeVisible();
  await expect(page.getByText("Category : Category One")).toBeVisible();
  await expect(page.getByText("Product Two")).toBeVisible();
  await expect(page.getByText("Product Three")).toBeVisible();
});
