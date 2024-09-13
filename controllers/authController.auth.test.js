import {beforeEach, describe, jest, test, expect} from '@jest/globals'
import JWT from "jsonwebtoken";

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
	
	describe('Receives invalid form', () => {
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
					comparePassword.mockResolvedValueOnce(false)
					
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
				hashPassword.mockResolvedValueOnce("hashedPassword#")
				jest.spyOn(userModel, "findByIdAndUpdate")
				
				await forgotPasswordController(req, res)
				
				expect(userModel.findByIdAndUpdate)
					.toHaveBeenCalledWith(exampleUser._id, { password: "hashedPassword#" })
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