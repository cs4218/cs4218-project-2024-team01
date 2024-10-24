import { test, expect } from "@playwright/test";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userModel from "../models/userModel";
import orderModel from "../models/orderModel";
import { UserBuilder } from "../testutils/user/userbuilder";
import { ObjectId } from "mongodb";
import { hashPassword } from "../helpers/authHelper";

dotenv.config();

test("User checkouts from Cart Page", async ({ page }) => {
  let userID;
  try {
    userID = new ObjectId();
    const userEmail = `${userID}@example.com`;

    let currUserModel = new UserBuilder()
      .withID(userID)
      .withEmail(userEmail)
      .withName("Test User")
      .withAnswer("Football")
      .withAddress("Test Address")
      .withPhone("13090434")
      .withPassword("test123")
      .withRole(0)
      .buildUserModel();

    await mongoose.connect(process.env.MONGO_URL);
    const hashedPassword = await hashPassword(currUserModel.password);

    currUserModel.password = hashedPassword;
    await currUserModel.save();

    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Enter Your Email ").fill(userEmail);
    await page.getByPlaceholder("Enter Your Password").click();
    await page.getByPlaceholder("Enter Your Password").fill("test123");
    await page.getByRole("button", { name: "LOGIN" }).click();

    await page.waitForURL("http://localhost:3000");
    const product = page.locator('//h5[text()="Product One"]/../..').first();
    await product.locator('button:has-text("ADD TO CART")').click();
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
    await expect(page.getByRole("row", { name: "1 Not Process Test User a few seconds ago" })).toBeVisible();

    await expect(page.getByText("Product One")).toBeVisible();
    await expect(page.getByText("This is product 1")).toBeVisible();
    await expect(page.getByText("Price : 10")).toBeVisible();
  } finally {
    await userModel.deleteOne({ _id: userID });
    await orderModel.deleteOne({ buyer: userID });
    await mongoose.connection.close();
  }
});
