import {beforeEach, describe, jest, test, expect} from '@jest/globals'
import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

import userModel from "../models/userModel.js";
import {forgotPasswordController, loginController, registerController, testController, updateProfileController, getOrdersController, getAllOrdersController, orderStatusController} from "./authController.js";
import {UserBuilder} from '../testutils/user/userbuilder.js';

import { ObjectId } from 'mongodb';
import orderModel from "../models/orderModel.js";
import { OrderBuilder } from '../testutils/order/orderbuilder.js';

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

// jest.mock("../models/userModel.js")

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

// jest.mock('../helpers/authHelper');
// jest.mock('jsonwebtoken');

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
					jest.spyOn(jsonwebtoken, "sign").mockReturnValueOnce(jwtExamplePayload)
					
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

// User Profile

let userRequest;
let userResponse;

const fillUserRequestAndResponse = (isValidRequest) => {
    let invalidUserRequest = new UserBuilder()
		.withName(null)
		.withEmail(null)
		.withPassword(null)
		.withPhone(null)
		.withAddress(null)
		.withAnswer(null)
		.build();

	userRequest = {
		body: isValidRequest ? new UserBuilder().build() : invalidUserRequest,
        user: {
            _id: new ObjectId()
        }
	};
	
	userResponse = {
		send: jest.fn(),
		status: jest.fn().mockReturnThis(),
        json : jest.fn().mockReturnThis()
	};
}

describe("Updating Profile", () => {

    let updateProfileFindByIdSpy;
    let updateProfileFindByIdAndUpdateSpy;
    let bcryptSpy;

    describe("Request is valid", () => {

        let existingUser = {
            _id: new ObjectId(),
            name: "Test User 456",
            email: "test456@example.com",
            phone: "90000456",
            address: "Test Address 678",
            password: "password456",
        }

        beforeEach(() => {
            updateProfileFindByIdSpy = jest.spyOn(userModel, "findById")
            updateProfileFindByIdAndUpdateSpy = jest.spyOn(userModel, "findByIdAndUpdate")
            bcryptSpy = jest.spyOn(bcrypt, "hash")
            fillUserRequestAndResponse(true)
            jest.clearAllMocks()
        });

        it("should update user profile when updating all fields", async () => {
            updateProfileFindByIdSpy.mockResolvedValue(existingUser)
            updateProfileFindByIdAndUpdateSpy.mockResolvedValue(userRequest.body)
            bcryptSpy.mockResolvedValue("hashedNewPassword")
            await updateProfileController(userRequest, userResponse)
            
            expect(updateProfileFindByIdSpy).toHaveBeenCalledWith(userRequest.user._id)
            expect(updateProfileFindByIdAndUpdateSpy).toHaveBeenCalledWith(userRequest.user._id, {
                name: userRequest.body.name,
                email: userRequest.body.email,
                password: "hashedNewPassword",
                phone: userRequest.body.phone,
                address: userRequest.body.address
            }, { new: true })
            expect(userResponse.status).toHaveBeenCalledWith(200)
            expect(userResponse.send).toHaveBeenCalledWith({
                success: true,
                message: "Profile Updated Successfully",
                updatedUser: userRequest.body
            })

            // Does not update email for the user
            // Wrong spelling in error message
        });

        it("should return an error if there is an error finding user", async () => {
            updateProfileFindByIdSpy.mockRejectedValue(new Error("Database Error"))
            await updateProfileController(userRequest, userResponse)
            expect(userResponse.status).toHaveBeenCalledWith(400)
            expect(userResponse.send).toHaveBeenCalledWith({
                success: false,
                message: "Error While Update profile",
                error: expect.any(Error)
            })

            // Wrong spelling in error message
        });

        it("should return an error if there is an error updating user", async () => {
            updateProfileFindByIdSpy.mockResolvedValue(userRequest.body)
            updateProfileFindByIdAndUpdateSpy.mockRejectedValue(new Error("Database Error"))
            await updateProfileController(userRequest, userResponse)
            expect(userResponse.status).toHaveBeenCalledWith(400)
            expect(userResponse.send).toHaveBeenCalledWith({
                success: false,
                message: "Error While Update profile",
                error: expect.any(Error)
            })

            // Wrong spelling in error message
        })

    })

    describe("Request is invalid", () => { 
        beforeEach(() => {
            updateProfileFindByIdSpy = jest.spyOn(userModel, "findById")
            updateProfileFindByIdAndUpdateSpy = jest.spyOn(userModel, "findByIdAndUpdate")
            fillUserRequestAndResponse(false)
            jest.clearAllMocks()
        });

        it("should return error message when password length is less than 6", async () => {
            updateProfileFindByIdSpy.mockResolvedValue(userRequest.body)
            userRequest.body.password = "passw"
            await updateProfileController(userRequest, userResponse)
            expect(updateProfileFindByIdSpy).toHaveBeenCalledWith(userRequest.user._id)
            expect(userResponse.json).toHaveBeenCalledWith({ error: "Passsword is required and 6 character long" })

        });

        it("should return an error if user is not found at findById", async () => {
            updateProfileFindByIdSpy.mockResolvedValue(null)
            updateProfileFindByIdAndUpdateSpy.mockResolvedValue(null)
        
            await updateProfileController(userRequest, userResponse);

            expect(updateProfileFindByIdSpy).toHaveBeenCalledWith(userRequest.user._id)
            expect(updateProfileFindByIdAndUpdateSpy).not.toHaveBeenCalled();

            expect(userResponse.status).toHaveBeenCalledWith(404);
            expect(userResponse.send).toHaveBeenCalledWith({
                success: false,
                message: "User Not Found",
            });
        });
    })

})

// Orders

let orderRequest;
let orderResponse;

const fillOrderRequestAndResponse = (isValidRequest) => {

    let invalidOrderRequest = new OrderBuilder()
        .withProducts(null)
        .withPayment(null)
        .withBuyer(null)
        .withStatus(null)
        .build()

    orderRequest = {
        user: {
            _id: isValidRequest ? new ObjectId() : null
        },
        params: {
            id: new ObjectId(),
            orderId: isValidRequest ? new ObjectId() : null
        },
        body: isValidRequest ? new OrderBuilder().build() : invalidOrderRequest

    }

    orderResponse = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json : jest.fn().mockReturnThis()
    }

}

let orderModelFindSpy;

describe("Get Orders", () => {

    describe("Request is valid", () => {
        beforeEach(() => {
            orderModelFindSpy = jest.spyOn(orderModel, "find")
            fillOrderRequestAndResponse(true)
            jest.clearAllMocks()
            orderModelFindSpy.mockClear()
        })
        
        it("should return orders if any", async () => {
            orderModelFindSpy.mockReturnValue({
                populate: jest.fn(() => ({
                    populate: jest.fn().mockResolvedValue(orderRequest.body)
                }))
            })
            await getOrdersController(orderRequest, orderResponse)
            expect(orderModelFindSpy).toHaveBeenCalledWith({buyer: orderRequest.user._id})
            expect(orderResponse.json).toHaveBeenCalledWith(orderRequest.body)
        });

        it("should return an error if there is an error retrieving orders", async () => {
            orderModelFindSpy.mockReturnValue({
                populate: jest.fn(() => ({
                    populate: jest.fn().mockRejectedValue(new Error("Database Error"))
                }))
            })
            await getOrdersController(orderRequest, orderResponse)
            expect(orderResponse.status).toHaveBeenCalledWith(500)
            expect(orderResponse.send).toHaveBeenCalledWith({
                success: false,
                message: "Error While Getting Orders",
                error: expect.any(Error)
            })

            // Wrong spelling in error message
        });
    })

    describe("Request is invalid", () => {
        beforeEach(() => {
            orderModelFindSpy = jest.spyOn(orderModel, "find")
            fillOrderRequestAndResponse(false)
            jest.clearAllMocks()
            orderModelFindSpy.mockClear()
        })

        it("should return an error if user ID is null", async () => {
            orderRequest.user._id = null
            await getOrdersController(orderRequest, orderResponse)

            expect(orderResponse.status).toHaveBeenCalledWith(400)
            expect(orderResponse.send).toHaveBeenCalledWith({
                message: "User Id is required",
            })

        })

        it("should return an error if user is not found", async () => {
            orderModelFindSpy.mockReturnValue({
                populate: jest.fn(() => ({
                    populate: jest.fn().mockResolvedValue(null)
                }))
            })
            await getOrdersController(orderRequest, orderResponse)
            expect(orderModel.find).toHaveBeenCalledWith({buyer: orderRequest.user._id})
            expect(orderResponse.json).toHaveBeenCalledWith(null)
        })
        
    })
})

describe("Get All Orders", () => {

    describe("For all requests", () => {
        beforeEach(() => {
            orderModelFindSpy = jest.spyOn(orderModel, "find")
            fillOrderRequestAndResponse(true)
            jest.clearAllMocks()
            orderModelFindSpy.mockClear()
        })

        it("should return all orders", async () => {
            orderModelFindSpy.mockReturnValue({
                populate: jest.fn(() => ({
                    populate: jest.fn(() => ({
                        sort: jest.fn().mockResolvedValue(orderRequest.body)
                    }))
                }))
            })

            await getAllOrdersController(orderRequest, orderResponse)
            expect(orderModelFindSpy).toHaveBeenCalledWith({})
            expect(orderResponse.json).toHaveBeenCalledWith(orderRequest.body)
        });

        it("should return an error if there is an error retrieving orders", async () => {
            orderModelFindSpy.mockReturnValue({
                populate: jest.fn(() => ({
                    populate: jest.fn(() => ({
                        sort: jest.fn().mockRejectedValue(new Error("Database Error"))
                    }))
                }))
            })

            await getAllOrdersController(orderRequest, orderResponse)
            expect(orderModelFindSpy).toHaveBeenCalledWith({})
            expect(orderResponse.status).toHaveBeenCalledWith(500)
            expect(orderResponse.send).toHaveBeenCalledWith({
                success: false,
                message: "Error While Getting Orders",
                error: expect.any(Error)
            })

            // Wrong spelling in error message
        });
       
    })
})

// Order Status
let orderStatusRequest;

let orderStatusResponse;

const fillOrderStatusRequestAndResponse = (isValidRequest) => {
    let invalidOrderStatusRequest = {
        body: {
            status: null
        },
        params: {
            orderId: null
        }
    }

    orderStatusRequest = {
        body: isValidRequest ? { status: "Shipped" } : invalidOrderStatusRequest.body,
        params: {
            orderId: isValidRequest ? new ObjectId() : invalidOrderStatusRequest.params.orderId
        }
    }

    orderStatusResponse = {

        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
    }

}

describe("Order Status", () => {

    let orderStatusFindByIdAndUpdateSpy;
    
    describe("Request is valid", () => {

        beforeEach(() => {
            orderStatusFindByIdAndUpdateSpy = jest.spyOn(orderModel, "findByIdAndUpdate")
            fillOrderStatusRequestAndResponse(true)
            jest.clearAllMocks()
            orderStatusFindByIdAndUpdateSpy.mockClear()
        })

        it("should update order status with valid orderId and status", async () => {

            orderStatusRequest.body = { status: "Shipped" }
            orderStatusFindByIdAndUpdateSpy = jest.spyOn(orderModel, "findByIdAndUpdate").mockResolvedValue(orderStatusRequest.body)

            await orderStatusController(orderStatusRequest, orderStatusResponse)
            
            expect(orderStatusFindByIdAndUpdateSpy).toHaveBeenCalledWith(orderStatusRequest.params.orderId, { status: "Shipped" }, { new: true })
            expect(orderStatusResponse.json).toHaveBeenCalledWith(orderStatusRequest.body)

        })

        it("should return an error if there is an error updating order even with valid request", async () => {

            orderStatusRequest.body = { status: "Shipped" }
            orderStatusFindByIdAndUpdateSpy = jest.spyOn(orderModel, "findByIdAndUpdate").mockRejectedValue(new Error("Database Error"))

            await orderStatusController(orderStatusRequest, orderStatusResponse)

            expect(orderStatusFindByIdAndUpdateSpy).toHaveBeenCalledWith(orderStatusRequest.params.orderId, { status: "Shipped" }, { new: true })
            expect(orderStatusResponse.status).toHaveBeenCalledWith(500)
            expect(orderStatusResponse.send).toHaveBeenCalledWith({
                success: false,
                message: "Error While Updating Order",
                error: expect.any(Error)
            })

            // Wrong spelling in error message

        })
    })

    describe("Request is invalid", () => {
        beforeEach(() => {
            orderStatusFindByIdAndUpdateSpy = jest.spyOn(orderModel, "findByIdAndUpdate")
            fillOrderStatusRequestAndResponse(false)
            jest.clearAllMocks()
            orderStatusFindByIdAndUpdateSpy.mockClear()
        })

        // Should handle the case where orderId in request is null
        it("should return an error if orderId is null", async () => {
            orderStatusRequest.params.orderId = null
            await orderStatusController(orderStatusRequest, orderStatusResponse)
            
            expect(orderStatusFindByIdAndUpdateSpy).toBeCalledWith(null, { status: null }, { new: true })
            expect(orderStatusResponse.status).toHaveBeenCalledWith(400)
            expect(orderStatusResponse.send).toHaveBeenCalledWith({
                message: "Order Id is required",
            })
        })

        // Should handle the case where orderId in request is invalid
        it("should return an error if orderId is invalid", async () => {
            orderStatusRequest.params.orderId = "invalid"
            await orderStatusController(orderStatusRequest, orderStatusResponse)
            
            expect(orderStatusFindByIdAndUpdateSpy).toBeCalledWith("invalid", { status: null }, { new: true })
            expect(orderStatusResponse.status).toHaveBeenCalledWith(500)
            expect(orderStatusResponse.send).toHaveBeenCalledWith({
                success: false,
                message: "Error While Updating Order",
                error: expect.any(Error)
            })

            // Wrong spelling in error message
        });

        // Should handle the case where status in request is invalid
        it("should return an error if the status is invalid", async () => { 
            orderStatusRequest.body.status = "Invalid"
            orderStatusRequest.params.orderId = new ObjectId()

            await orderStatusController(orderStatusRequest, orderStatusResponse)

            expect(orderStatusFindByIdAndUpdateSpy).toHaveBeenCalledWith(orderStatusRequest.params.orderId, { status: "Invalid" }, { new: true })
            expect(orderStatusResponse.status).toHaveBeenCalledWith(500)
            expect(orderStatusResponse.send).toHaveBeenCalledWith({
                success: false,
                message: "Error While Updating Order",
                error: expect.any(Error)
            })

            // Wrong spelling in error message
        })

        // Should handle the case where status in request is null
        it("should return an error if status is null", async () => {

            await orderStatusController(orderStatusRequest, orderStatusResponse)
            
            expect(orderStatusFindByIdAndUpdateSpy).toHaveBeenCalledWith(orderStatusRequest.params.orderId, { status: null }, { new: true })
            expect(orderStatusResponse.status).toHaveBeenCalledWith(400)
            expect(orderStatusResponse.send).toHaveBeenCalledWith({
                message: "Status is required",
            })

        })
    })
})