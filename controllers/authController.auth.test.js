import {beforeEach, describe, jest, test, expect} from '@jest/globals'
import JWT from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

import userModel from "../models/userModel.js";
import {forgotPasswordController, loginController, registerController, testController} from "./authController.js";
import {comparePassword, hashPassword} from "../helpers/authHelper.js";
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
		.build()
	req = {
		body: isValidRequest ? new UserBuilder().build() : invalidRequest,
	};
	
	res = {
		send: jest.fn(),
		status: jest.fn().mockReturnThis()
	}
	
	jest.clearAllMocks()
}

jest.mock("../models/userModel.js")

describe('Given that Register controller is called', () => {
	describe('Receives valid form', () => {
		beforeEach(() => fillRegisterUserFormAndMockResponse(true))
		describe('Given User already exist', () => {
			test("User not created", async () => {
				let user = new UserBuilder().build()
				userModel.findOne = jest.fn().mockResolvedValueOnce(user)
				
				await registerController(req, res)
				
				expect(res.status).toHaveBeenCalledWith(200);
				expect(res.send).toHaveBeenCalledWith({
					success: false,
					message: 'Already Register please login',
				});
			})
		})
		
		describe('Given User does not exist', () => {
			test("User created", async () => {
				userModel.findOne = jest.fn().mockResolvedValueOnce(null)
				let userWithHashedPassword = new UserBuilder().withPassword("hashedPassword#").build()
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
		
		describe('Given Error in dependencies', () => {
			test("Returns Error", async () => {
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
	
	let pairwiseTestCasesRegisterController = [{
		testCase: "Name empty",
		body: new UserBuilder().withName(null).withPassword(null).withPhone(null).build(),
		expected: "Name is Required"
	},{
		testCase: "Email empty",
		body: new UserBuilder().withEmail(null).withAddress(null).build(),
		expected: "Email is Required"
	}, {
		testCase: "Password empty",
		body: new UserBuilder().withPassword(null).withAnswer(null).build(),
		expected: "Password is Required"
	}, {
		testCase: "Phone no empty",
		body: new UserBuilder().withPhone(null).withAddress(null).build(),
		expected: "Phone no is Required"
	}, {
		testCase: "Address empty",
		body: new UserBuilder().withAddress(null).withAnswer(null).build(),
		expected: "Address is Required"
	}, {
		testCase: "Answer empty",
		body: new UserBuilder().withAnswer(null).build(),
		expected: "Answer is Required"
	}, {
		testCase: "Name is empty",
		body: new UserBuilder().withName(null).withEmail(null).build(),
		expected: "Name is Required"
	}]
	describe('Receives invalid form', () => {
		beforeEach(() => fillRegisterUserFormAndMockResponse(false))
		
		pairwiseTestCasesRegisterController.forEach(tc => {
			const {testCase, body, expected} = tc
			test(testCase, async () => {
				req.body = body
				
				await registerController(req, res)
				
				expect(res.status).toHaveBeenCalledWith(400)
				expect(res.send).toHaveBeenCalledWith({
					error: expected
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

jest.mock('../helpers/authHelper');
jest.mock('jsonwebtoken', () => ({
	sign: jest.fn(async () => Promise.resolve("token"))
}));

describe("Given that Login controller is called", () => {
	describe("Receives valid form", () => {
		beforeEach(() => fillLoginUserFormAndMockResponse(true))
		describe("Given User does not exist in database", () => {
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
		
		describe("Given User exists in database", () => {
			describe("Given User input wrong password", () => {
				test("User fails to login", async () => {
					let userWithHashedPassword = new UserBuilder().withPassword("hashedPassword#").build()
					userModel.findOne = jest.fn().mockResolvedValueOnce(userWithHashedPassword)
					let bcryptSpy = jest.spyOn(bcrypt, "compare")
					bcryptSpy.mockResolvedValueOnce(false)
					
					await loginController(req, res)
					
					expect(res.status).toHaveBeenCalledWith(200)
					expect(res.send).toHaveBeenCalledWith({
						success: false,
						message: "Invalid Password",
					})
				})
			})
			
			describe("Given User input correct password", () => {
				test("User logs in successfully", async () => {
					let userWithHashedPassword = new UserBuilder().withPassword("hashedPassword#").build()
					userModel.findOne = jest.fn().mockResolvedValueOnce(userWithHashedPassword)
					let bcryptSpy = jest.spyOn(bcrypt, "compare")
					bcryptSpy.mockResolvedValueOnce(true)
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
		
		describe("Given Error in dependencies", () => {
			test("Returns Error in login", async () => {
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
	
	describe("Receives invalid form", () => {
		beforeEach(() => fillLoginUserFormAndMockResponse(false))
		describe("Given email is empty",  () => {
			test("Returns Invalid email or password", async () => {
				req.body.email = null
				req.body.password = "password123"
				
				await loginController(req, res)
				
				expect(res.status).toHaveBeenCalledWith(404)
				expect(res.send).toHaveBeenCalledWith({
					success: false,
					message: "Invalid email or password"
				})
			})
		})
		describe("Given password is empty",  () => {
			test("Returns Invalid email or password", async () => {
				req.body.email = "test123@example.com"
				req.body.password = null
				
				await loginController(req, res)
				
				expect(res.status).toHaveBeenCalledWith(404)
				expect(res.send).toHaveBeenCalledWith({
					success: false,
					message: "Invalid email or password"
				})
			})
		})
	})
})

const forgotPasswordBody = {
	email: "test123@example.com",
	answer: "answer",
	newPassword: "newPassword123"
}
const fillInForgotPasswordFormAndMockResponse = (isValidRequest) => {
	const invalidForgotPasswordBody = {
		email: null,
		answer: null,
		newPassword: null
	}
	req = {
		body: isValidRequest ? forgotPasswordBody : invalidForgotPasswordBody,
	};
	
	res = {
		send: jest.fn(),
		status: jest.fn().mockReturnThis()
	}
	
	jest.clearAllMocks()
}

describe("Given that Forgot Password controller is called", () => {
	describe("Receives valid form", () => {
		beforeEach(() => fillInForgotPasswordFormAndMockResponse(true))
		describe("Given that email and answer not found", () => {
			test("Returns wrong email or answer", async () => {
				userModel.findOne = jest.fn().mockResolvedValueOnce(null)
				
				await forgotPasswordController(req, res)
				
				expect(res.status).toHaveBeenCalledWith(404)
				expect(res.send).toHaveBeenCalledWith({
					success: false,
					message: "Wrong Email Or Answer"
				})
			})
		})
		
		describe("Given that Email and Answer is found", () => {
			test("Returns password reset success", async () => {
				let exampleUser = new UserBuilder().build()
				userModel.findOne = jest.fn().mockResolvedValueOnce(exampleUser)
				let bcryptSpy = jest.spyOn(bcrypt, "hash")
				bcryptSpy.mockResolvedValueOnce("hashedPassword#")
				let userModelSpy = jest.spyOn(userModel, "findByIdAndUpdate")
				userModelSpy.mockResolvedValueOnce(null)
				
				await forgotPasswordController(req, res)
				
				expect(userModelSpy)
					.toHaveBeenCalledWith(new mongoose.Types.ObjectId(exampleUser._id)._id.toString(), {"password": "hashedPassword#"})
				expect(res.status).toHaveBeenCalledWith(200)
				expect(res.send).toHaveBeenCalledWith({
					success: true,
					message: "Password Reset Successfully"
				})
			})
		})
		
		describe("Given error in dependencies", () => {
			test("Returns Something went wrong", async () => {
				userModel.findOne = jest.fn().mockRejectedValueOnce(new Error("Connection Failed"))
				
				await forgotPasswordController(req, res)
				
				expect(res.status).toHaveBeenCalledWith(500)
				expect(res.send).toHaveBeenCalledWith({
					success: false,
					message: "Something went wrong",
					error: new Error("Connection Failed")
				})
			})
		})
	})
	
	describe("Receives invalid form", () => {
		beforeEach(() => fillInForgotPasswordFormAndMockResponse(false))
		describe("Given email is empty", () => {
			test("Returns Email is required", async () => {
				await forgotPasswordController(req, res)
				
				expect(res.status).toHaveBeenCalledWith(400)
				expect(res.send).toHaveBeenCalledWith({
					message: "Email is required"
				})
			})
		})
		describe("Given answer is empty", () => {
			test("Returns Answer is required", async () => {
				req.body.email = "test123@example.com"
				
				await forgotPasswordController(req, res)
				
				expect(res.status).toHaveBeenCalledWith(400)
				expect(res.send).toHaveBeenCalledWith({
					message: "Answer is required"
				})
			})
		})
		describe("Given newPassword is empty", () => {
			test("Returns New Password is required", async () => {
				req.body.email = "test123@example.com"
				req.body.answer = "answer"
				
				await forgotPasswordController(req, res)
				
				expect(res.status).toHaveBeenCalledWith(400)
				expect(res.send).toHaveBeenCalledWith({
					message: "New Password is required"
				})
			})
		})
	})
})

describe("Given that Test Controller is called", () => {
	beforeEach(() => {
		req = {}
		res = {
			send: jest.fn(),
			status: jest.fn().mockReturnThis()
		}

		jest.clearAllMocks()
	})
	describe("Protected Routes Health check OK", () => {
		test("Returns Protected Routes", async () => {
			await testController(req, res)

			expect(res.status).toHaveBeenCalledWith(200)
			expect(res.send).toHaveBeenCalledWith({
				success: true,
				message: "Protected Routes"
			})
		})
	})
	describe("Protected Routes Health check FAILED", () => {
		test("Returns Error Message", async () => {
			res = {
				send: jest.fn(() => {
					throw new Error('Connection Failed');
				}),
				status: jest.fn().mockReturnThis()
			};
			
			await testController(req, res)
			
			expect(res.status).toHaveBeenCalledWith(500)
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "Something went wrong",
				error: new Error("Connection Failed")
			})
		})
	})
})