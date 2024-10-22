import { test, expect } from "@playwright/test";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userModel from "../models/userModel";
import { UserBuilder } from '../testutils/user/userbuilder';
import { ObjectId } from "mongodb";
import { hashPassword } from "../helpers/authHelper";

dotenv.config();

const testUserModel2 = new UserBuilder()
    .withID(new ObjectId())
    .withEmail("TestUser2@example.com")
    .withName("Test User 2")
    .withAnswer("Basketball")
    .withAddress("Test Address 2")
    .withPhone("12345678")
    .withPassword("test123")
    .withRole(0)
    .buildUserModel();

test.describe("Updating User Profile", () => {

    test.beforeEach("Setup", async () => {
        try {
            await mongoose.connect(process.env.MONGO_URL);
            const hashedPassword = await hashPassword("test123");
            await userModel.findOneAndUpdate({ email: testUserModel2.email }, { name: "Test User 2", password: hashedPassword});
            await mongoose.connection.close();
        } catch (error) {
            console.log(`Error in Mongodb 1 ${error}`);
        }
    });

    test("User update his profile name", async ({ page }) => {

        await page.goto("http://localhost:3000/login");
        await page.getByPlaceholder("Enter Your Email ").fill("TestUser2@example.com");
        await page.getByPlaceholder("Enter Your Password").click();
        await page.getByPlaceholder("Enter Your Password").fill("test123");
        await page.getByRole("button", { name: "LOGIN" }).click();

        await page.waitForURL("http://localhost:3000/");
        await page.getByRole("button", { name: "TEST USER 2" }).click();
        await page.getByRole("link", { name: "DASHBOARD" }).click();
        await page.getByRole("link", { name: "Profile" }).click();
        await page.goto("http://localhost:3000/dashboard/user/profile");
    
        await page.getByPlaceholder("Enter Your Name").fill("Test User 1");
        await page.getByRole("button", { name: "UPDATE" }).click();
        const updatedName = await page.getByText("TEST USER 1").innerText();
        expect(updatedName).toBe("TEST USER 1");
        await expect(page.getByText("Profile Updated Successfully")).toBeVisible();
    
    });

    test("User update his password with less than 6 characters", async ({ page }) => {
    
        await page.goto("http://localhost:3000/login");
        await page.getByPlaceholder("Enter Your Email ").fill("TestUser2@example.com");
        await page.getByPlaceholder("Enter Your Password").click();
        await page.getByPlaceholder("Enter Your Password").fill("test123");
        await page.getByRole("button", { name: "LOGIN" }).click();
    
        await page.waitForURL("http://localhost:3000");
        await page.getByRole("button", { name: "TEST USER 2" }).click();
        await page.getByRole("link", { name: "DASHBOARD" }).click();
        await page.getByRole("link", { name: "Profile" }).click();
        await page.goto("http://localhost:3000/dashboard/user/profile");
    
        await page.getByPlaceholder("Enter Your Password").fill("test1");
        await page.getByRole("button", { name: "UPDATE" }).click();
    
        await expect(page.getByText("Passsword is required and 6 character long")).toBeVisible();
    
    });
    
    test("User update his profile with a valid password", async ({ page }) => {
        const userID = new ObjectId();
        try {

            const userEmail = `${userID}@example.com`;

            let currUserModel = new UserBuilder()
                .withID(userID)
                .withEmail(userEmail)
                .withName("Test User 4")
                .withAnswer("Tennis")
                .withAddress("Test Address 4")
                .withPhone("12345678")
                .withPassword("test123")
                .withRole(0)
                .buildUserModel();

            await mongoose.connect(process.env.MONGO_URL);
            const hashedPassword = await hashPassword(currUserModel.password);

            currUserModel.password = hashedPassword;
            await userModel.create(currUserModel);


            await page.goto("http://localhost:3000/login");
            await page.getByPlaceholder("Enter Your Email ").fill(userEmail);
            await page.getByPlaceholder("Enter Your Password").click();
            await page.getByPlaceholder("Enter Your Password").fill("test123");
            await page.getByRole("button", { name: "LOGIN" }).click();
        
            await page.waitForURL("http://localhost:3000");
            await page.getByRole("button", { name: "TEST USER 4" }).click();
            await page.getByRole("link", { name: "DASHBOARD" }).click();
            await page.getByRole("link", { name: "Profile" }).click();
            await page.goto("http://localhost:3000/dashboard/user/profile");
        
            await page.getByPlaceholder("Enter Your Password").fill("test456");
            await page.getByRole("button", { name: "UPDATE" }).click();
            await expect(page.getByText("Profile Updated Successfully")).toBeVisible();
        
            await page.getByRole("button", { name: "TEST USER 4" }).click();
            await page.getByRole("link", { name: "LOGOUT" }).click();
        
            await page.waitForURL('http://localhost:3000/login');
            await page.getByPlaceholder("Enter Your Email ").fill(userEmail);
            await page.getByPlaceholder("Enter Your Password").click();
            await page.getByPlaceholder("Enter Your Password").fill("test456");
        
            await page.getByRole('button', { name: 'LOGIN' }).click();
            await expect(page).toHaveURL('http://localhost:3000/');
            await expect(page).toHaveTitle("ALL Products - Best offers");

        } finally {
            await userModel.deleteOne({ _id: userID });
            await mongoose.connection.close();
        }
        
    });
    
    
    
});

test.describe("User Orders", () => {

    test("User is able to see his orders", async ({ page }) => {

        await page.goto("http://localhost:3000/login");
        await page.getByPlaceholder("Enter Your Email ").fill("TestUser3@example.com");
        await page.getByPlaceholder("Enter Your Password").click();
        await page.getByPlaceholder("Enter Your Password").fill("test123");
        await page.getByRole("button", { name: "LOGIN" }).click();
    
        await page.getByRole("button", { name: "TEST USER 3" }).click();
        await page.getByRole("link", { name: "DASHBOARD" }).click();
        await page.getByRole("link", { name: "Orders" }).click();
        await page.waitForURL("http://localhost:3000/dashboard/user/orders");
    
        const pageTitle = await page.getByText("All Orders").innerText();
        expect(pageTitle).toBe("All Orders");

        const rows = page.locator("table tbody tr");
        await expect(rows).toHaveCount(1);

        const headerRow = page.getByRole("row");

        await expect(headerRow.getByRole("columnheader", { name: "#" })).toBeVisible();
        await expect(headerRow.getByRole("columnheader", { name: "Status" })).toBeVisible();
        await expect(headerRow.getByRole("columnheader", { name: "Buyer" })).toBeVisible();
        await expect(headerRow.getByRole("columnheader", { name: "date" })).toBeVisible();
        await expect(headerRow.getByRole("columnheader", { name: "Payment" })).toBeVisible();
        await expect(headerRow.getByRole("columnheader", { name: "Quantity" })).toBeVisible();
        
        
        const orderRow = page.getByRole("row", { name: "1 Not Process Test User 3 a few seconds ago Success 1" });
        expect(orderRow).toBeVisible();

        await expect(page.getByText("Product Three")).toBeVisible();
        await expect(page.getByText("This is product 3")).toBeVisible();
        await expect(page.getByText("Price : 30")).toBeVisible();
        
    });   

});


