import { beforeEach, describe, jest, test, expect } from '@jest/globals'
import JWT from "jsonwebtoken";

import userModel from "../models/userModel.js";
import {loginController, registerController} from "./authController.js";
import {comparePassword} from "../helpers/authHelper.js";
import {UserBuilder} from '../testutils/user/userbuilder.js'

// Mock request and response
let req;
let res;
const fillRegisterUserFormAndMockResponse = (isValidRequest) => {
	let invalidRequest = new UserBuilder()
		.withName(null)
		.withEmail(null)
		.withPassword(null)
		.withPhone(null)
		.withAddress(null)
		.withAnswer(null)
		.getUser()
	req = {
		body: isValidRequest ? new UserBuilder().getUser() : invalidRequest,
	};
	
	res = {
		send: jest.fn(),
		status: jest.fn().mockReturnThis()
	}
	
	jest.clearAllMocks()
}

jest.mock("../models/userModel.js")

describe('Given the Register page is rendered', () => {
	describe('Given that the form is filled with valid data', () => {
		beforeEach(() => fillRegisterUserFormAndMockResponse(true))
		describe('When the Register button is clicked', () => {
			describe('User already exist', () => {
				test("User not created", async () => {
					let user = new UserBuilder().getUser()
					userModel.findOne = jest.fn().mockResolvedValueOnce(user)
					
					await registerController(req, res)
					
					expect(res.status).toHaveBeenCalledWith(200);
					expect(res.send).toHaveBeenCalledWith({
						success: false,
						message: 'Already Register please login',
					});
				})
			})
			
			describe('User does not exist', () => {
				test("User created", async () => {
					userModel.findOne = jest.fn().mockResolvedValueOnce(null)
					let userWithHashedPassword = new UserBuilder().withPassword("hashedPassword#").getUser()
					userModel.prototype.save = jest.fn().mockResolvedValueOnce(userWithHashedPassword)
					
					await registerController(req, res)
					
					expect(res.status).toHaveBeenCalledWith(201);
					expect(res.send).toHaveBeenCalledWith({
						success: true,
						message: "User Register Successfully",
						user: userWithHashedPassword
					});
				})
			})
			
			describe('Error in dependencies', () => {
				test("Error in creating user will be returned", async () => {
					userModel.findOne = jest.fn().mockRejectedValueOnce(new Error("Connection failed"))
					
					await registerController(req, res)
					
					expect(res.status).toHaveBeenCalledWith(500)
					expect(res.send).toHaveBeenCalledWith({
						success: false,
						message: "Error in Registration",
						error: new Error("Connection failed")
					})
				})
			})
		})
	})
	
	describe('Given that the form is filled with invalid data', () => {
		beforeEach(() => fillRegisterUserFormAndMockResponse(false))
		describe("Given name is empty", () => {
			test("Returns message that name is required", async () => {
				await registerController(req, res)
				
				expect(res.send).toHaveBeenCalledWith({
					message: "Name is Required"
				})
			})
		})
		
		describe("Given Email is empty", () => {
			test("Returns message that email is required", async () => {
				req.body.name = "test123"
				
				await registerController(req, res)
				
				expect(res.send).toHaveBeenCalledWith({
					message: "Email is Required"
				})
			})
		})
		
		describe("Given Password is empty", () => {
			test("Returns message that password is required", async () => {
				req.body.name = "test123"
				req.body.email = "test123@example.com"
				
				await registerController(req, res)
				
				expect(res.send).toHaveBeenCalledWith({
					message: "Password is Required"
				})
			})
		})
		
		describe("Given Phone no is empty", () => {
			test("Returns message that phone no is required", async () => {
				req.body.name = "test123"
				req.body.email = "test123@example.com"
				req.body.password = "testPassword"
				
				await registerController(req, res)
				
				expect(res.send).toHaveBeenCalledWith({
					message: "Phone no is Required"
				})
			})
		})
		
		describe("Given address is empty", () => {
			test("Returns message that address is required", async () => {
				req.body.name = "test123"
				req.body.email = "test123@example.com"
				req.body.password = "testPassword"
				req.body.phone = "12345678"
				
				await registerController(req, res)
				
				expect(res.send).toHaveBeenCalledWith({
					message: "Address is Required"
				})
			})
		})
		
		describe("Given Answer is empty", () => {
			test("Returns message that answer is required", async () => {
				req.body.name = "test123"
				req.body.email = "test123@example.com"
				req.body.password = "testPassword"
				req.body.phone = "12345678"
				req.body.address = "example address"
				
				await registerController(req, res)
				
				expect(res.send).toHaveBeenCalledWith({
					message: "Answer is Required"
				})
			})
		})
	})
})

const jwtExamplePayload = {
	"sub": "1234567890",
	"name": "name",
	"email": "email",
	"iat": 1609459200,
	"exp": 1609462800,
	"role": "any role",
	"scope": "any scope"
}

const loginBody = {
	email: "test123@example.com",
	password: "password123"
}
const invalidLoginBody = {
	email: null,
	password: null
}

const fillLoginUserFormAndMockResponse = (isValidRequest) => {
	req = {
		body: isValidRequest ? loginBody : invalidLoginBody,
	};
	
	res = {
		send: jest.fn(),
		status: jest.fn().mockReturnThis()
	}
	
	jest.clearAllMocks()
}

jest.mock("../helpers/authHelper.js")
jest.mock("jsonwebtoken")

describe("Given that the Login Page is rendered", () => {
	describe("Given that that the Login Form is filled with valid data", () => {
		beforeEach(() => fillLoginUserFormAndMockResponse(true))
		describe("When Login button is clicked", () => {
			describe("User does not exist in database", () => {
				test("User not allowed to Login", async () => {
					userModel.findOne = jest.fn().mockResolvedValueOnce(null)
					
					await loginController(req, res)
					
					expect(res.status).toHaveBeenCalledWith(404)
					expect(res.send).toHaveBeenCalledWith({
						success: false,
						message: "Email is not registered"
					})
				})
			})
			
			describe("User exists in database", () => {
				describe("User input wrong password", () => {
					test("User fails to login", async () => {
						let userWithHashedPassword = new UserBuilder().withPassword("hashedPassword#").getUser()
						userModel.findOne = jest.fn().mockResolvedValueOnce(userWithHashedPassword)
						comparePassword.mockResolvedValueOnce(false)
						
						await loginController(req, res)
						
						expect(res.status).toHaveBeenCalledWith(200)
						expect(res.send).toHaveBeenCalledWith({
							success: false,
							message: "Invalid Password",
						})
					})
				})
				
				describe("User input correct password", () => {
					test("User logs in successfully", async () => {
						let userWithHashedPassword = new UserBuilder().withPassword("hashedPassword#").getUser()
						userModel.findOne = jest.fn().mockResolvedValueOnce(userWithHashedPassword)
						comparePassword.mockResolvedValueOnce(true)
						JWT.sign = jest.fn().mockResolvedValueOnce(jwtExamplePayload)
						
						await loginController(req, res)
						
						expect(res.status).toHaveBeenCalledWith(200)
						expect(res.send).toHaveBeenCalledWith({
							success: true,
							message: "login successfully",
							user: {
								_id: userWithHashedPassword._id,
								name: userWithHashedPassword.name,
								email: userWithHashedPassword.email,
								phone: userWithHashedPassword.phone,
								address: userWithHashedPassword.address,
								role: userWithHashedPassword.role,
							},
							token: jwtExamplePayload
						})
					})
				})
			})
			
			describe("Error in dependencies", () => {
				test("Error in login will be returned", async () => {
					userModel.findOne = jest.fn().mockRejectedValueOnce(new Error("Connection failed"))
					
					await loginController(req, res)
					
					expect(res.status).toHaveBeenCalledWith(500)
					expect(res.send).toHaveBeenCalledWith({
						success: false,
						message: "Error in login",
						error: new Error("Connection failed")
					})
				})
			})
		})
	})
})