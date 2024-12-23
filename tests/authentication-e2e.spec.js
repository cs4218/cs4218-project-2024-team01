import { test, expect } from "@playwright/test";
import mongoose from 'mongoose';
import dotenv from "dotenv";
import { UserBuilder } from '../testutils/user/userbuilder';
import userModel from "../models/userModel";

dotenv.config();

test.describe('Register with valid credentials and login', () => {
  const testUser = new UserBuilder().withEmail('JohnDoe@test.com')
    .withName('John Doe').withAnswer('Football').withAddress('123 Street')
    .withPhone('1234567890').withPassword('johndoe123').withRole(0)
    .build();
  test.beforeEach('Remove Test User before Test', async () => {
    try {
      await mongoose.connect(process.env.MONGO_URL);
      await userModel.deleteOne({ email: testUser.email });
      await mongoose.connection.close();
    } catch (error) {
      console.log(`Error in Mongodb ${error}`);
    }
  });
  test.afterEach('Remove Test User after Test', async () => {
    try {
      await mongoose.connect(process.env.MONGO_URL);
      await userModel.deleteOne({ email: testUser.email });
      await mongoose.connection.close();
    } catch (error) {
      console.log(`Error in Mongodb ${error}`);
    }
  });

  test("Should be able to register and login", async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.fill('input#exampleInputName1', testUser.name);
    await page.fill('input#exampleInputEmail1', testUser.email);
    await page.fill('input#exampleInputPassword1', testUser.password);
    await page.fill('input#exampleInputPhone1', testUser.phone);
    await page.fill('input#exampleInputaddress1', testUser.address);
    await page.fill('input#exampleInputDOB1', '2000-01-01');
    await page.fill('input#exampleInputanswer1', testUser.answer);
    const registerButton = page.getByRole('button', { name: 'REGISTER' });
    await registerButton.click();

    await page.waitForURL('http://localhost:3000/login');
    await page.fill('input#exampleInputEmail1', testUser.email);
    await page.fill('input#exampleInputPassword1', testUser.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();

    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page).toHaveTitle("ALL Products - Best offers");
  });
})

test.describe('Login with invalid credentials and navigate to home page', () => {
  test("Should not be able to login and navigate to protected routes", async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input#exampleInputEmail1', 'invalid@test');
    await page.fill('input#exampleInputPassword1', 'invalid');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page.getByText('Something went wrong')).toBeVisible();

    await page.goto('http://localhost:3000/dashboard/user/profile')
    await page.waitForURL('http://localhost:3000/');

    await expect(page).toHaveURL('http://localhost:3000/');
  });
})

test.describe('Existing User tries to reset password', () => {
  const originalPassword = 'darrenjames123';
  const newPassword = 'darrenjames1234';
  const answer = 'Football';
  const testUserModel = new UserBuilder().withEmail('DarrenJames@test.com')
    .withName('Darren James').withAnswer(answer).withAddress('123 Street')
    .withPhone('1234567890').withRole(0)
    .buildUserModel();

  test("Should be able to reset password and Login", async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.getByRole('button', { name: 'FORGET PASSWORD' }).click();

    await page.waitForURL('http://localhost:3000/forget-password');

    await page.getByPlaceholder('Enter Your Email').fill(testUserModel.email);
    await page.getByPlaceholder('Enter Your Answer').fill(answer);
    await page.getByPlaceholder('Enter Your New Password').fill(newPassword);

    const resetPasswordButton = page.getByRole('button', { name: 'RESET PASSWORD' });
    await resetPasswordButton.click();
    await page.waitForURL('http://localhost:3000/login', { timeout: 3000 });

    await page.goto('http://localhost:3000/login');
    await page.fill('input#exampleInputEmail1', testUserModel.email);
    await page.fill('input#exampleInputPassword1', newPassword);
    await page.getByRole('button', { name: 'LOGIN' }).click();

    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page).toHaveTitle("ALL Products - Best offers");
  });
})

test.describe('User Login and then navigate to protected routes and logout', () => {
  const testUserModel = new UserBuilder().withEmail('MaryJane@test.com')
    .withName('Mary Jane').withAnswer('Football').withAddress('123 Street')
    .withPhone('1234567890').withRole(0)
    .buildUserModel();
  const password = 'maryjane123';

  test("Should be able to login and logout", async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input#exampleInputEmail1', testUserModel.email);
    await page.fill('input#exampleInputPassword1', password);
    await page.getByRole('button', { name: 'LOGIN' }).click();

    await expect(page.getByText('Something went wrong')).not.toBeVisible();

    await page.waitForURL('http://localhost:3000/');
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page).toHaveTitle("ALL Products - Best offers");

    await page.goto('http://localhost:3000/dashboard/user/profile');
    await expect(page).toHaveURL('http://localhost:3000/dashboard/user/profile');
    await expect(page.getByText('USER PROFILE')).toBeVisible();

    await page.getByRole('button', { name: testUserModel.name }).click();
    const logoutButton = page.getByRole('link', { name: 'LOGOUT' });
    await logoutButton.click();

    await expect(page).toHaveURL('http://localhost:3000/login');
    await expect(page.getByText('LOGIN FORM')).toBeVisible();
  });
})