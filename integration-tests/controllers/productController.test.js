import { beforeEach, describe, expect, test, jest } from "@jest/globals";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { UserBuilder } from "../../testutils/user/userbuilder";
import { ProductBuilder } from "../../testutils/product/productBuilder";
import categoryModel from "../../models/categoryModel";
import productModel from "../../models/productModel";
import { createProductController,
    getProductController,
    deleteProductController,
    updateProductController,
    productCountController,
    productFiltersController,
    productListController
} from "../../controllers/productController";

let mongoServer;

describe("Product Count Controller", () => {
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        process.env.MONGO_URL = mongoServer.getUri();
        await mongoose.connect(mongoServer.getUri());
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        await mongoose.connection.db.dropCollection("users");
        await mongoose.connection.db.dropCollection("categories");
        await mongoose.connection.db.dropCollection("products");
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    describe("Get product count", () => {
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

        const existingProduct1 = new productModel({
            _id: new Types.ObjectId(),
            name: "Test Product 1",
            slug: "test-product-1",
            price: 10,
            description: "Test product description",
            category: existingCategory._id,
            quantity: 10,
            shipping: true,
        });

        const existingProduct2 = new productModel({
            _id: new Types.ObjectId(),
            name: "Test Product 2",
            slug: "test-product-2",
            price: 20,
            description: "Test product description",
            category: existingCategory._id,
            quantity: 10,
            shipping: true,
        });

        const req = {};

        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        it("should return total product count from the database", async () => {
            await existingUser1.save();
            await existingCategory.save();
            await existingProduct1.save();
            await existingProduct2.save();

            await productCountController(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalled();
            const resArgs = res.send.mock.calls[0][0]; // Accessing the first call to send
            expect(resArgs.total).toBe(2);
            expect(resArgs.success).toBe(true);

        });

        it("should handle errors and return a 400 status", async () => {
            const mockQuery = {
                estimatedDocumentCount: jest.fn().mockImplementationOnce(() => {
                    throw new Error("Database error");
                }),
            };

            jest.spyOn(productModel, 'find').mockReturnValue(mockQuery);

            await productCountController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                message: "Error in product count",
                error: expect.any(Error),
                success: false,
            });
        });
    });
});


