import { beforeEach, describe, jest, expect, it} from '@jest/globals';
import { updateProfileController, getOrdersController, getAllOrdersController, orderStatusController } from '../controllers/authController';
import userModel from "../models/userModel.js";
import { UserBuilder } from '../testutils/user/userbuilder.js';
import { ObjectId } from 'mongodb';
import { hashPassword } from '../helpers/authHelper.js';
import bcrypt from "bcrypt";

import orderModel from "../models/orderModel.js";
import { OrderBuilder } from '../testutils/order/orderbuilder.js';

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