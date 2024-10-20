import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { UserBuilder } from "../../testutils/user/userbuilder";
import userModel from "../../models/userModel";
import { getAllOrdersController, orderStatusController } from "../../controllers/authController";
import orderModel from "../../models/orderModel";
import productModel from "../../models/productModel";
import categoryModel from "../../models/categoryModel";

let mongoServer;

describe("Get All Orders Controller", () => {
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        process.env.MONGO_URL = mongoServer.getUri();
        await mongoose.connect(mongoServer.getUri());
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        await mongoose.connection.db.dropCollection("users");
        await mongoose.connection.db.dropCollection("orders");
        await mongoose.connection.db.dropCollection("products");
        await mongoose.connection.db.dropCollection("categories");
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    describe("Get all orders available", () => {
        const existingUser1 = new UserBuilder()
            .withID(new Types.ObjectId())
            .withName("Test User 1")
            .withEmail("testuser1@gmail.com")
            .buildUserModel();

        const existingUser2 = new UserBuilder()
            .withID(new Types.ObjectId())
            .withName("Test User 2")
            .withEmail("testuser2@gmail.com")
            .buildUserModel();

        const existingCategory = new categoryModel({
            name: "Test Category",
            slug: "test-category",
            _id: new Types.ObjectId(),
        });

        const existingProduct = new productModel({
            _id: new Types.ObjectId(),
            name: "Test Product 1",
            slug: "test-product-1",
            price: 10,
            description: "Test product description",
            category: existingCategory._id,
            quantity: 10,
            shipping: true,
        });

        const order1 = new orderModel({
            products: [existingProduct._id],
            payment: {},
            buyer: existingUser1._id,
            status: "Not Process",
            createdAt: new Date("2024-01-01T00:00:00Z"),
        });

        const order2 = new orderModel({
            products: [existingProduct._id],
            payment: {},
            buyer: existingUser2._id,
            status: "Not Process",
            createdAt: new Date("2024-02-01T00:00:00Z"),
        });

        const req = {};

        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        it("should get all orders and sort by createdAt in descending order", async () => {
            await existingUser1.save();
            await existingUser2.save();
            await existingCategory.save();
            await existingProduct.save();
            await order1.save();
            await order2.save();

            await getAllOrdersController(req, res);

            expect(res.json).toHaveBeenCalled();

            const resArgs = res.json.mock.calls[0][0];

            expect(resArgs.length).toBe(2);

            // Ensure sorting is correct
            expect(resArgs[0].createdAt).toBe(order2.createdAt.toISOString());
            expect(resArgs[1].createdAt).toBe(order1.createdAt.toISOString());

            // Check that buyer is populated correctly
            expect(resArgs[0].buyer.name).toBe(existingUser2.name);
            expect(resArgs[1].buyer.name).toBe(existingUser1.name);

            // Check that products are populated correctly
            expect(resArgs[0].products[0].name).toBe(existingProduct.name);
            expect(resArgs[1].products[0].name).toBe(existingProduct.name);
        });

        it("should handle database error and return a 500 status", async () => {
            jest.spyOn(orderModel, 'find').mockImplementationOnce(() => {
                throw new Error("Database error");
            });

            await getAllOrdersController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Error WHile Geting Orders",
                error: expect.anything(),
            });
        });
    });
});

describe("Order Status Controller", () => {
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        process.env.MONGO_URL = mongoServer.getUri();
        await mongoose.connect(mongoServer.getUri());
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        await mongoose.connection.db.dropCollection("orders");
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    describe("Update order status", () => {
        const existingUser1 = new UserBuilder()
            .withID(new Types.ObjectId())
            .withName("Test User 1")
            .withEmail("testuser1@gmail.com")
            .buildUserModel();

        const existingCategory = new categoryModel({
            name: "Test Category",
            slug: "test-category",
            _id: new Types.ObjectId(),
        });

        const existingProduct = new productModel({
            _id: new Types.ObjectId(),
            name: "Test Product 1",
            slug: "test-product-1",
            price: 10,
            description: "Test product description",
            category: existingCategory._id,
            quantity: 10,
            shipping: true,
        });

        const existingOrder = new orderModel({
            _id: new Types.ObjectId(),
            products: [existingProduct._id],
            payment: {},
            buyer: existingUser1._id,
            status: "Not Process",
        });

        const req = {
            params: { orderId: existingOrder._id },
            body: { status: "Shipped" },
        };

        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        it("should update the order status successfully", async () => {
            await existingUser1.save();
            await existingCategory.save();
            await existingProduct.save();
            await existingOrder.save();

            await orderStatusController(req, res);

            expect(res.json).toHaveBeenCalled();
            const resArgs = res.json.mock.calls[0][0];
            expect(resArgs.status).toBe("Shipped");
        });

        it("should handle database error and return a 500 status", async () => {
            jest.spyOn(orderModel, 'findByIdAndUpdate').mockImplementationOnce(() => {
                throw new Error("Database error");
            });

            await orderStatusController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Error While Updateing Order",
                error: expect.anything(),
            });
        });
    });
});
