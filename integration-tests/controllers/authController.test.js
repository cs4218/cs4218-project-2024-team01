import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { UserBuilder } from "../../testutils/user/userbuilder";
import userModel from "../../models/userModel";
import { loginController, registerController, forgotPasswordController, updateProfileController, getOrdersController} from "../../controllers/authController";
import { comparePassword, hashPassword } from "../../helpers/authHelper";
import orderModel from "../../models/orderModel";
import productModel from "../../models/productModel";
import categoryModel from "../../models/categoryModel";

let mongoServer;
let userbuilder = new UserBuilder();
let mockedUserModel = userbuilder.buildUserModel();

describe("Update Profile Controller", () => {

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        process.env.MONGO_URL = mongoServer.getUri();
        await mongoose.connect(mongoServer.getUri());
    });
    
    const collectionName = "users";

    beforeEach(async () => {
        jest.clearAllMocks();
        await mongoose.connection.db.dropCollection(collectionName);
        await mongoose.connection.db.createCollection(collectionName);
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    describe("User update his profile with valid fields" , () => {

        const updatedUser = new UserBuilder()
            .withName("Test User 124")
            .withEmail("test124@example.com")
            .withPhone("90000124")
            .withAddress("Test Address 678")
            .withPassword("passw0rd123")
            .build();
        
        const req = {
            user: {
                _id: mockedUserModel._id
            },
            body: {
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                address: updatedUser.address,
                password: updatedUser.password
            }
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        it("should update user profile in the database", async () => {
            
            mockedUserModel.password = await hashPassword(mockedUserModel.password);
            await mockedUserModel.save();

            await updateProfileController(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalled();

            const resArgs = res.send.mock.calls[0][0];
            expect(resArgs.success).toBe(true);
            expect(resArgs.message).toBe("Profile Updated SUccessfully");
            expect(resArgs.updatedUser.name).toBe(updatedUser.name);
            expect(resArgs.updatedUser.phone).toBe(updatedUser.phone);
            expect(resArgs.updatedUser.address).toBe(updatedUser.address);

            const isPasswordMatch = await comparePassword(updatedUser.password, resArgs.updatedUser.password);
            expect(isPasswordMatch).toBe(true);

            expect(resArgs.updatedUser.email).toBe(updatedUser.email);

        });
    });

    describe("User update his profile with invalid password length" , () => {

        const existingUser = new UserBuilder()
            .withID("60f1b1b3b3b3bd83aab1b3c2")
            .buildUserModel();

        const updatedUser = new UserBuilder()  
            .withPassword("passw")
            .build();

        const req = {
            user: {
                _id: existingUser._id
            },
            body: {
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                address: updatedUser.address,
                password: updatedUser.password
            }
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        it("should not update user profile in the database", async () => {
            
            existingUser.password = await hashPassword(existingUser.password);
            await existingUser.save();

            await updateProfileController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalled();

            const resArgs = res.send.mock.calls[0][0];
            expect(resArgs.success).toBe(false);
            expect(resArgs.message).toBe("Error WHile Update profile");
            expect(resArgs.error).toBeDefined();

        });

    });

    describe("Database error while updating user profile" , () => {

        const existingUser = new UserBuilder()
            .withID("81f14de12b3bd4a3aab1b3c2")
            .buildUserModel();

        const updatedUser = new UserBuilder()
            .withName("Test User 124")
            .withPhone("90000124")
            .build();
        
        const req = {
            user: {
                _id: existingUser._id
            },
            body: {
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                address: updatedUser.address,
                password: updatedUser.password
            }
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        it("should not update user profile in the database", async () => {
                
            existingUser.password = await hashPassword(existingUser.password);
            await existingUser.save();

            jest.spyOn(userModel, "findById").mockImplementation(() => {
                throw new Error("Database Error");
            });

            await updateProfileController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalled();

            const resArgs = res.send.mock.calls[0][0];
            expect(resArgs.success).toBe(false);
            expect(resArgs.message).toBe("Error WHile Update profile");
            expect(resArgs.error).toStrictEqual(new Error("Database Error"));

            // Check to see if the user is not updated in the database
            const user = await userModel.find({ _id: existingUser._id });
            expect(user.name).not.toBe(updatedUser.name);
            expect(user.phone).not.toBe(updatedUser.phone);

    
        });
    });

});

describe("Get Orders Controller", () => {

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        process.env.MONGO_URL = mongoServer.getUri();
        await mongoose.connect(mongoServer.getUri());
    });
    

    beforeEach(async () => {
        jest.clearAllMocks();
        await mongoose.connection.db.dropCollection("users");
        await mongoose.connection.db.createCollection("users");
        await mongoose.connection.db.dropCollection("orders");
        await mongoose.connection.db.createCollection("orders");
        await mongoose.connection.db.dropCollection("products");
        await mongoose.connection.db.createCollection("products");
        await mongoose.connection.db.dropCollection("categories");
        await mongoose.connection.db.createCollection("categories");
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    describe("Get orders of a user" , () => {

        const existingUser = new UserBuilder()
            .withID("7e3b5d1a8f4c2b9d6a7c0e1f")
            .buildUserModel();

        const existingCategory = new categoryModel({
            name: "Test",
            slug: "test",
            _id: "3d8f6b2a9c4e1b7f5a2c8d7e"
        });

        const existingProduct = new productModel({
                _id: "9a4f7e2d8c5b1f3e7d4a2b9c",
                name: "test",
                slug: "test",
                price: 100,
                description: "test description",
                category: "3d8f6b2a9c4e1b7f5a2c8d7e",
                quantity: 10, 
                shipping: true,
        });

        const existingOrder = new orderModel({
            products: [
                "9a4f7e2d8c5b1f3e7d4a2b9c",
            ],
            payment: {},
            buyer: "7e3b5d1a8f4c2b9d6a7c0e1f",
            status: 'Not Process'
        });

        const req = {
            user: {
                _id: "7e3b5d1a8f4c2b9d6a7c0e1f"
            }
        };
    
        const res = {
            json: jest.fn(),
        };

        it("should get orders of a user from the database", async () => {

            await existingUser.save();
            await existingCategory.save();
            await existingProduct.save();
            await existingOrder.save();

            await getOrdersController(req, res);

            expect(res.json).toHaveBeenCalled();

            const resArgs = res.json.mock.calls[0][0];

            expect(resArgs[0].status).toBe(existingOrder.status);
            
            // Expect buyer to be populated correctly
            expect(resArgs[0].buyer.name).toBe(existingUser.name);
            expect(resArgs[0].buyer._id).toStrictEqual(existingUser._id);

            // Expect products to be populated correctly
            expect(resArgs[0].products[0].name).toBe(existingProduct.name);
            expect(resArgs[0].products[0].slug).toBe(existingProduct.slug);
            expect(resArgs[0].products[0].price).toBe(existingProduct.price);
            expect(resArgs[0].products[0].description).toBe(existingProduct.description);
            expect(resArgs[0].products[0].quantity).toBe(existingProduct.quantity);
            expect(resArgs[0].products[0].shipping).toBe(existingProduct.shipping);

        });


    });

    describe("Database error while getting orders of a user" , () => {

        const existingUser = new UserBuilder()
            .withID("2a9f3e7d4b6c1f8d5e0a3b7c")
            .buildUserModel();

        

        const existingCategory = new categoryModel({
            name: "Test",
            slug: "test",
            _id: "8c2f7a4d1b5e9d3c6b0e4f1a"
        });

        const existingProduct = new productModel({
                _id: "5b3e1d8a7c9f4a2e6d0b3f9c",
                name: "test",
                slug: "test",
                price: 100,
                description: "test description",
                category: "8c2f7a4d1b5e9d3c6b0e4f1a",
                quantity: 10, 
                shipping: true,
        });

        const existingOrder = new orderModel({
            products: [
                "5b3e1d8a7c9f4a2e6d0b3f9c",
            ],
            payment: {},
            buyer: "2a9f3e7d4b6c1f8d5e0a3b7c",
            status: 'Not Process'
        });

        const req = {
            user: {
                _id: "2a9f3e7d4b6c1f8d5e0a3b7c" 
            }
        };
    
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        it("should not get orders of a user from the database", async () => {

            await existingUser.save();
            await existingCategory.save();
            await existingProduct.save();
            await existingOrder.save();

            jest.spyOn(orderModel, "find").mockImplementation(() => {
                throw new Error("Database Error");
            });

            await getOrdersController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();

            const resArgs = res.send.mock.calls[0][0];

            expect(resArgs.success).toBe(false);
            expect(resArgs.message).toBe("Error WHile Geting Orders");
            expect(resArgs.error).toStrictEqual(new Error("Database Error"));

        });


    });

});
