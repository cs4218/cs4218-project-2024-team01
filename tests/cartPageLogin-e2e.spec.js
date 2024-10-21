import { test, expect } from "@playwright/test";

test("User logins from Cart Page", async ({ page }) => {
  await page.goto("http://localhost:3000");
  const buttons = page.locator("button", { hasText: "ADD TO CART" });
  await buttons.nth(0).click();
  await page.getByRole("link", { name: "Cart" }).click();

  await page.waitForURL("http://localhost:3000/cart");
  await expect(page.getByText("Hello Guest")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Make Payment" })
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Plase Login to checkout" }).click();

  await page.waitForURL("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("TestUser@example.com");
  await page.getByPlaceholder("Enter Your Password").click();
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await expect(page).toHaveURL("http://localhost:3000/cart");
  await expect(page.getByText("Hello Test User")).toBeVisible();
  await expect(page.getByText("Hello Guest")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Make Payment" })
  ).toBeVisible();
});