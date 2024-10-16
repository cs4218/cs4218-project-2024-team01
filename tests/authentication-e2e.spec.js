import { test, expect } from "@playwright/test";
import mongoose from 'mongoose';
import dotenv from "dotenv";
import { UserBuilder } from '../testutils/user/userbuilder';
import userModel from "../models/userModel";
import { hashPassword } from "../helpers/authHelper";

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
    await page.getByPlaceholder('Enter Your Name').fill(testUser.name);
    await page.getByPlaceholder('Enter Your Email').fill(testUser.email);
    await page.getByPlaceholder('Enter Your Password').fill(testUser.password);
    await page.getByPlaceholder('Enter Your Phone').fill(testUser.phone);
    await page.getByPlaceholder('Enter Your Address').fill(testUser.address);
    await page.getByPlaceholder('Enter Your DOB').fill('2000-01-01');
    await page.getByPlaceholder('What is Your Favorite sports').fill(testUser.answer);
    const registerButton = page.getByRole('button', { name: 'REGISTER' });
    await registerButton.click();

    await page.waitForURL('http://localhost:3000/login');
    await page.getByPlaceholder('Enter Your Email').fill(testUser.email);
    await page.getByPlaceholder('Enter Your Password').fill(testUser.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();

    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page).toHaveTitle("ALL Products - Best offers");
  });
})

test.describe('Login with invalid credentials and navigate to home page', () => {
  test("Should not be able to login and navigate to protected routes", async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.getByPlaceholder('Enter Your Email').fill('invalid@test');
    await page.getByPlaceholder('Enter Your Password').fill('invalid');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page.getByText('Something went wrong')).toBeVisible();

    await page.goto('http://localhost:3000/dashboard/user/profile')
    await expect(page.getByText('redirecting to you in 3 second')).toBeVisible();
    await expect(page.getByText('redirecting to you in 2 second')).toBeVisible();
    await expect(page.getByText('redirecting to you in 1 second')).toBeVisible();
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

  test.beforeEach('Remove and Add Test User before Test', async () => {
    try {
      await mongoose.connect(process.env.MONGO_URL);
      await userModel.deleteOne({ email: testUserModel.email });
      testUserModel.password = await hashPassword(originalPassword);
      await testUserModel.save();
      await mongoose.connection.close();
    } catch (error) {
      console.log(`Error in Mongodb ${error}`);
    }
  });
  test.afterEach('Remove Test User after Test', async () => {
    try {
      await mongoose.connect(process.env.MONGO_URL);
      await userModel.deleteOne({ email: testUserModel.email });
      await mongoose.connection.close();
    } catch (error) {
      console.log(`Error in Mongodb ${error}`);
    }
  });

  test("Should be able to reset password and Login", async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.getByRole('button', { name: 'FORGET PASSWORD' }).click();

    await page.waitForURL('http://localhost:3000/forget-password');

    await page.getByPlaceholder('Enter Your Email').fill(testUserModel.email);
    await page.getByPlaceholder('Enter Your Answer').fill(answer);
    await page.getByPlaceholder('Enter Your New Password').fill(newPassword);

    const resetPasswordButton = page.getByRole('button', { name: 'RESET PASSWORD' });
    await resetPasswordButton.click();

    await page.goto('http://localhost:3000/login');
    await page.getByPlaceholder('Enter Your Email').fill(testUserModel.email);
    await page.getByPlaceholder('Enter Your Password').fill(newPassword);
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

  test.beforeEach('Remove and Add User before Test', async () => {
    try {
      await mongoose.connect(process.env.MONGO_URL);
      await userModel.deleteOne({ email: testUserModel.email });

      testUserModel.password = await hashPassword(password);
      await testUserModel.save();
      await mongoose.connection.close();
    } catch (error) {
      console.log(`Error in Mongodb ${error}`);
    }
  });
  test.afterEach('Remove Test User after Test', async () => {
    try {
      await mongoose.connect(process.env.MONGO_URL);
      await userModel.deleteOne({ email: testUserModel.email });
      await mongoose.connection.close();
    } catch (error) {
      console.log(`Error in Mongodb ${error}`);
    }
  });

  test("Should be able to login and logout", async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.getByPlaceholder('Enter Your Email').fill(testUserModel.email);
    await page.getByPlaceholder('Enter Your Password').fill(password);
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