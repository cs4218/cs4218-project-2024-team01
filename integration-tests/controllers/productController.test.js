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
    productCountController
} from "../../controllers/productController";

let mongoServer;
const productCollectionName = "products";
const categoryCollectionName = "category";
var categoryId = new mongoose.Types.ObjectId();
var productId = new mongoose.Types.ObjectId();
let mockedProduct = new ProductBuilder().withId(productId).withCategoryId(categoryId).build();
let invalidMockedProduct = new ProductBuilder().withName(null).withId(productId).withCategoryId(categoryId).build();

describe("Product Controller integration test with MongoDB", () => {
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        process.env.MONGO_URL = mongoServer.getUri();
        await mongoose.connect(mongoServer.getUri());
        await mongoose.connection.db.createCollection(categoryCollectionName);
        await mongoose.connection.db.collection(categoryCollectionName).insertOne({
            name: "Test Category",
            _id: categoryId
        });
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    describe("Integration tests for createProductController", () => {
        beforeEach(async () => {
            await mongoose.connection.db.dropCollection(productCollectionName);
            await mongoose.connection.db.createCollection(productCollectionName);
            jest.clearAllMocks();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        const req = {
            fields: mockedProduct,
            files: {}
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        test("Product is created successfully and saved in database", async () => {
            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(201);

            // Check that the product returned in the response is the same as 
            // the one being sent in the request
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Product Created Successfully",
                products: expect.objectContaining({
                    name: mockedProduct.name,
                    price: mockedProduct.price,
                    description: mockedProduct.description,
                    quantity: mockedProduct.quantity, 
                    shipping: mockedProduct.shipping,
                }),
            });

            // Product returned in the response
            const returnedProduct = res.send.mock.calls[0][0].products; 

            // Check that product saved in database is same as the one being returned
            // in the response
            const product = await productModel.findOne({name: mockedProduct.name});
            expect(returnedProduct.name).toStrictEqual(product.name);
            expect(returnedProduct.price).toStrictEqual(product.price);
            expect(returnedProduct.description).toStrictEqual(product.description);
            expect(returnedProduct.quantity).toStrictEqual(product.quantity);
            expect(returnedProduct.shipping).toStrictEqual(product.shipping);
        });

        test("Error in creating product and product not saved in database", async () => {
            // Request with invalid product (missing name)
            req.fields = invalidMockedProduct;
            await createProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: "Name is Required",
            });

            // Check that the product is not created in the database
            const nonExistingProduct = await productModel.findOne({name: invalidMockedProduct.name});
            expect(nonExistingProduct).toBeNull();
        });
    });

    describe("Integration tests for getProductController", () => {
        beforeEach(async () => {
            await mongoose.connection.db.dropCollection(productCollectionName);
            await mongoose.connection.db.createCollection(productCollectionName);
            jest.clearAllMocks();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        const req = {
            fields: mockedProduct,
            files: {}
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        test("Get all the products successfully from the database", async () => {
            // Insert product into database using createProductController that has 
            // been tested to work in the test above
            await createProductController(req, res);
            jest.clearAllMocks();

            // Get the product that has been created
            const expectedResult = await productModel.find({})
            .populate("category")
            .select("-photo")
            .limit(12)
            .sort({ createdAt: -1 });

            // Check that the product returned in the response from the controller
            // is the same as the one in the database
            await getProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            const returnedResponse = res.send.mock.calls[0][0];
            expect(returnedResponse.success).toBe(true);
            expect(returnedResponse.counTotal).toBe(expectedResult.length);
            expect(returnedResponse.message).toBe("ALlProducts ");

            // As there is only one product in the array, check that the product 
            // returned is the same as the one in the database
            expect(returnedResponse.products[0]).toEqual(expect.objectContaining({
                name: expectedResult[0].name,
                price: expectedResult[0].price,
                description: expectedResult[0].description,
                quantity: expectedResult[0].quantity, 
                shipping: expectedResult[0].shipping,
            }));
        });

        test("Error when trying to get all products", async () => {
            // Mock the find method to throw error
            const mockError = jest.spyOn(productModel, 'find').mockImplementation(() => {
                throw new Error("Cannot find products");
            });

            // Check that error is returned in response
            await getProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            const returnedResponse = res.send.mock.calls[0][0];
            expect(returnedResponse.success).toBe(false);
            expect(returnedResponse.message).toBe("Erorr in getting products");
            expect(returnedResponse.error).toBe("Cannot find products");
            mockError.mockRestore();
        });
    });

    describe("Integration tests for deleteProductController", () => {
        const req = {
            fields: mockedProduct,
            files: {},
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        beforeEach(async () => {
            await mongoose.connection.db.dropCollection(productCollectionName);
            await mongoose.connection.db.createCollection(productCollectionName);
            jest.clearAllMocks();
            req.params = { pid: productId };
        });

        afterEach(() => {
            jest.clearAllMocks();
            delete req.params;
        });

        test("Product is deleted successfully from the database", async () => {
            // Insert product into database using createProductController that has 
            // been tested to work in the test above
            await createProductController(req, res);
            jest.clearAllMocks();

            // Check that the response returned is successfully
            await deleteProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            const returnedResponse = res.send.mock.calls[0][0];
            expect(returnedResponse.success).toBe(true);
            expect(returnedResponse.message).toBe("Product Deleted successfully");

            // Check that the product has been deleted from the database
            const product = await productModel.findById(productId);
            expect(product).toBeNull();
        });

        test("Error in deleting product from database", async () => {
            // Mock the findByIdAndDelete method to throw error
            const mockError =  jest.spyOn(productModel, 'findByIdAndDelete').mockImplementation(() => {
                throw new Error("Cannot find single product");
            });

            // Insert product into database using createProductController that has 
            // been tested to work in the test above
            await createProductController(req, res);
            jest.clearAllMocks();

            // Check that the response returns an error
            await deleteProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            const returnedResponse = res.send.mock.calls[0][0];
            expect(returnedResponse.success).toBe(false);
            expect(returnedResponse.message).toBe("Error while deleting product");
            expect(returnedResponse.error).toEqual(new Error("Cannot find single product"));

            // Check that the product is still in database since
            // there is an error in trying to delete product
            const product = await productModel.findById(productId);
            expect(product).not.toBeNull();

            mockError.mockRestore();
        });
    });

    describe("Integration tests for updateProductController", () => {
        const updatedMockProduct = new ProductBuilder()
        .withName("updated test")
        .withPrice(322)
        .withDescription("updated test description")
        .withId(productId)
        .withCategoryId(categoryId)
        .build();

        const req = {
            fields: mockedProduct,
            files: {}
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        beforeEach(async () => {
            await mongoose.connection.db.dropCollection(productCollectionName);
            await mongoose.connection.db.createCollection(productCollectionName);
            jest.clearAllMocks();
            req.params = { pid: productId };
            req.fields = mockedProduct;
        });

        afterEach(() => {
            jest.clearAllMocks();
            delete req.params;
        });

        test("Product updated successfully in the database", async () => {
            // Insert product into database using createProductController that has 
            // been tested to work in the test above
            await createProductController(req, res);
            jest.clearAllMocks();

            req.fields = updatedMockProduct;

            // Check that product has been updated successfully in the database
            await updateProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            const returnedResponse = res.send.mock.calls[0][0];
            expect(returnedResponse.success).toBe(true);
            expect(returnedResponse.message).toBe("Product Updated Successfully");

            // Check that product in database has been updated
            const product = await productModel.findById(productId); 
            expect(product.name).toStrictEqual(updatedMockProduct.name);
            expect(product.price).toStrictEqual(updatedMockProduct.price);
            expect(product.description).toStrictEqual(updatedMockProduct.description);
        });

        test("Error in updating product in database", async () => {
            // Mock the findByIdAndUpdate method to throw error
            const mockError =  jest.spyOn(productModel, "findByIdAndUpdate").mockImplementation(() => {
                throw new Error("Cannot find single product");
            });

            // Insert product into database using createProductController that has 
            // been tested to work in the test above
            await createProductController(req, res);
            jest.clearAllMocks();

            req.fields = updatedMockProduct;

            // Check that the response returns an error
            await updateProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            const returnedResponse = res.send.mock.calls[0][0];
            expect(returnedResponse.success).toBe(false);
            expect(returnedResponse.message).toBe("Error in Updte product");
            expect(returnedResponse.error).toEqual(new Error("Cannot find single product"));

            // Check that the product in the database is not updated
            // since there is an error in trying to update the product
            const product = await productModel.findById(productId);
            expect(product.name).not.toStrictEqual(updatedMockProduct.name);
            expect(product.price).not.toStrictEqual(updatedMockProduct.price);
            expect(product.description).not.toStrictEqual(updatedMockProduct.description);

            mockError.mockRestore();
        });
    });

    describe("Get product count", () => {
        beforeEach(async () => {
            jest.clearAllMocks();
            await mongoose.connection.db.dropCollection("users");
            await mongoose.connection.db.dropCollection("categories");
            await mongoose.connection.db.dropCollection("products");
        });

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

