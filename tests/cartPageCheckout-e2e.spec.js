import { test, expect } from "@playwright/test";

test("User checkouts from Cart Page", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("TestUser@example.com");
  await page.getByPlaceholder("Enter Your Password").click();
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  const buttons = page.locator("button", { hasText: "ADD TO CART" });
  await buttons.nth(0).click();
  await page.getByRole("link", { name: "Cart" }).click();

  await page.waitForURL("http://localhost:3000/cart");
  await page.getByRole("button", { name: "Card" }).click();
  await page
    .locator("iframe[name='braintree-hosted-field-number']")
    .contentFrame()
    .getByPlaceholder("•••• •••• •••• ••••")
    .fill("378282246310005");
  await page
    .locator("iframe[name='braintree-hosted-field-expirationDate']")
    .contentFrame()
    .getByPlaceholder("MM/YY")
    .fill("11/26");
  await page
    .locator("iframe[name='braintree-hosted-field-cvv']")
    .contentFrame()
    .getByPlaceholder("•••")
    .fill("1111");
  await page.getByRole("button", { name: "Make Payment" }).click();

  await expect(page).toHaveURL("http://localhost:3000/dashboard/user/orders");
});
